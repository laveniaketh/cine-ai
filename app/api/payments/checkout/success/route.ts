import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Movie from "@/database/movie.model";
import Ticket from "@/database/ticket.model";
import Payment from "@/database/payment.model";
import ReservedSeat from "@/database/reservedSeat.model";

const PAYMONGO_BASE_URL = (
  process.env.PAYMONGO_BASE_URL || "https://api.paymongo.com/v1"
).replace(/\/$/, "");

type PayMongoCheckoutSessionResponse = {
  data?: {
    id?: string;
    attributes?: {
      payment_intent?: {
        id?: string;
        attributes?: {
          status?: string;
        };
      };
      payments?: Array<{
        id?: string;
        attributes?: {
          status?: string;
        };
      }>;
      status?: string;
      checkout_url?: string;
      metadata?: {
        movieId?: string;
        movieTitle?: string;
        platform?: string;
        dayOfWeek?: string;
        weekNumber?: string;
        paymentAmount?: string;
        seatsSelected?: string;
      };
    };
  };
};

function getPayMongoAuthHeader(secretKey: string) {
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");
  return `Basic ${encoded}`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPaidStatus(status?: string) {
  if (!status) return false;
  const normalized = status.toLowerCase();
  return normalized === "paid" || normalized === "succeeded";
}

function isPlaceholderValue(value: string) {
  return value.includes("{") || value.includes("}");
}

function getCheckoutSessionIdFromQuery(req: NextRequest) {
  const keys = ["checkout_session_id", "checkoutSessionId", "session_id", "id"];

  for (const key of keys) {
    const value = req.nextUrl.searchParams.get(key);
    if (!value) {
      continue;
    }

    const normalized = value.trim();
    if (!normalized || isPlaceholderValue(normalized)) {
      continue;
    }

    return normalized;
  }

  return null;
}

function getCheckoutSessionId(req: NextRequest) {
  const fromQuery = getCheckoutSessionIdFromQuery(req);
  if (fromQuery) {
    return fromQuery;
  }

  const cookieValue = req.cookies.get("paymongo_checkout_session_id")?.value;
  if (!cookieValue) {
    return null;
  }

  const normalized = cookieValue.trim();
  if (!normalized || isPlaceholderValue(normalized)) {
    return null;
  }

  return normalized;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const checkoutSessionId = getCheckoutSessionId(req);

    if (!checkoutSessionId) {
      return NextResponse.redirect(
        new URL("/kiosk/payment-method?checkout=invalid", req.url),
      );
    }

    const paymongoSecretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!paymongoSecretKey) {
      return NextResponse.redirect(
        new URL("/kiosk/payment-method?checkout=config-error", req.url),
      );
    }

    let paymongoResponse: Response | null = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      paymongoResponse = await fetch(
        `${PAYMONGO_BASE_URL}/checkout_sessions/${encodeURIComponent(checkoutSessionId)}`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            authorization: getPayMongoAuthHeader(paymongoSecretKey),
          },
        },
      );

      if (paymongoResponse.ok) {
        break;
      }

      if (attempt < maxAttempts) {
        // Allow brief eventual-consistency window after PayMongo redirect.
        await delay(700);
      }
    }

    if (!paymongoResponse || !paymongoResponse.ok) {
      const status = paymongoResponse?.status;
      console.error("PayMongo checkout verification failed", {
        checkoutSessionId,
        status,
      });
      return NextResponse.redirect(
        new URL("/kiosk/payment-method?checkout=verification-failed", req.url),
      );
    }

    const paymongoData =
      (await paymongoResponse.json()) as PayMongoCheckoutSessionResponse;

    const sessionStatus = paymongoData.data?.attributes?.status;
    const intentStatus =
      paymongoData.data?.attributes?.payment_intent?.attributes?.status;
    const paymentStatus =
      paymongoData.data?.attributes?.payments?.[0]?.attributes?.status;

    const paid =
      isPaidStatus(sessionStatus) ||
      isPaidStatus(intentStatus) ||
      isPaidStatus(paymentStatus);

    if (!paid) {
      return NextResponse.redirect(
        new URL("/kiosk/payment-method?checkout=pending", req.url),
      );
    }

    // Idempotency: if this checkout session is already persisted, do not recreate records.
    const existingPayment = await Payment.findOne({
      paymongoCheckoutSessionId: checkoutSessionId,
      paymentMethod: "e-wallet",
      paymentStatus: "paid",
    });

    if (existingPayment) {
      return NextResponse.redirect(
        new URL("/kiosk/payment-sucessful", req.url),
      );
    }

    const metadata = paymongoData.data?.attributes?.metadata;
    const movieId = metadata?.movieId;
    const platform = metadata?.platform;
    const dayOfWeek = metadata?.dayOfWeek;
    const weekNumber = metadata?.weekNumber;
    const paymentAmountRaw = metadata?.paymentAmount;
    const seatsSelectedRaw = metadata?.seatsSelected;

    if (
      !movieId ||
      !platform ||
      !dayOfWeek ||
      !weekNumber ||
      !paymentAmountRaw ||
      !seatsSelectedRaw
    ) {
      return NextResponse.redirect(
        new URL("/kiosk/payment-method?checkout=invalid-metadata", req.url),
      );
    }

    const paymentAmount = Number(paymentAmountRaw);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.redirect(
        new URL("/kiosk/payment-method?checkout=invalid-amount", req.url),
      );
    }

    let seatsSelected: string[] = [];
    try {
      const parsed = JSON.parse(seatsSelectedRaw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Invalid seat list");
      }
      seatsSelected = parsed.map((seat) => String(seat).toUpperCase());
    } catch {
      return NextResponse.redirect(
        new URL("/kiosk/payment-method?checkout=invalid-seats", req.url),
      );
    }

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return NextResponse.redirect(
        new URL("/kiosk/payment-method?checkout=movie-not-found", req.url),
      );
    }

    // Re-check seat availability at commit time to prevent late conflicts.
    const existingReservations = await ReservedSeat.find({
      seatNumber: { $in: seatsSelected },
    }).populate({
      path: "ticket_id",
      match: {
        movie_id: movie._id,
        dayOfWeek,
        weekNumber,
      },
    });

    const reservedSeats = existingReservations
      .filter((reservation) => reservation.ticket_id !== null)
      .map((reservation) => reservation.seatNumber);

    if (reservedSeats.length > 0) {
      return NextResponse.redirect(
        new URL("/kiosk/payment-method?checkout=seat-conflict", req.url),
      );
    }

    const lastTicket = await Ticket.findOne().sort({ ticket_id: -1 });
    const newTicketId = lastTicket ? lastTicket.ticket_id + 1 : 1;

    const ticket = await Ticket.create({
      ticket_id: newTicketId,
      movie_id: movie._id,
      platform,
      dayOfWeek,
      weekNumber,
    });

    await Payment.create({
      ticket_id: ticket._id,
      movie_id: movie._id,
      paymentAmount,
      paymentStatus: "paid",
      paymentMethod: "e-wallet",
      paymongoCheckoutSessionId: checkoutSessionId,
      paymongoCheckoutUrl: paymongoData.data?.attributes?.checkout_url,
      paymongoPaymentId:
        paymongoData.data?.attributes?.payments?.[0]?.id ||
        paymongoData.data?.attributes?.payment_intent?.id ||
        "",
    });

    await Promise.all(
      seatsSelected.map((seatNumber) =>
        ReservedSeat.create({
          ticket_id: ticket._id,
          seatNumber,
        }),
      ),
    );

    return NextResponse.redirect(new URL("/kiosk/payment-sucessful", req.url));
  } catch (error) {
    console.error("PayMongo checkout success verification error:", error);
    return NextResponse.redirect(
      new URL("/kiosk/payment-method?checkout=error", req.url),
    );
  }
}
