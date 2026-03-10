import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Movie from "@/database/movie.model";
import ReservedSeat from "@/database/reservedSeat.model";
import { escapeRegex, sanitizeString } from "@/lib/sanitize";

const PAYMONGO_BASE_URL = (
  process.env.PAYMONGO_BASE_URL || "https://api.paymongo.com/v1"
).replace(/\/$/, "");

type PayMongoCreateCheckoutResponse = {
  data?: {
    id?: string;
    attributes?: {
      checkout_url?: string;
    };
  };
  errors?: Array<{
    code?: string;
    detail?: string;
  }>;
};

function getPayMongoAuthHeader(secretKey: string) {
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");
  return `Basic ${encoded}`;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const paymongoSecretKey = process.env.PAYMONGO_SECRET_KEY;
    if (!paymongoSecretKey) {
      return NextResponse.json(
        { message: "PAYMONGO_SECRET_KEY is not configured" },
        { status: 500 },
      );
    }

    const body = await req.json();

    const movieTitle = sanitizeString(body.movieTitle);
    const paymentMethod = sanitizeString(body.paymentMethod);
    const platform = sanitizeString(body.platform);
    const dayOfWeek = sanitizeString(body.dayOfWeek);
    const weekNumber = sanitizeString(body.weekNumber);
    const paymentAmount =
      typeof body.paymentAmount === "number" ? body.paymentAmount : null;
    const seatsSelected = body.seatsSelected;

    if (
      !movieTitle ||
      !paymentMethod ||
      !platform ||
      !dayOfWeek ||
      !weekNumber ||
      !paymentAmount ||
      !Array.isArray(seatsSelected) ||
      seatsSelected.length === 0
    ) {
      return NextResponse.json(
        { message: "Required fields are missing" },
        { status: 400 },
      );
    }

    if (paymentMethod.toLowerCase() !== "e-wallet") {
      return NextResponse.json(
        { message: "This endpoint only supports e-wallet checkout" },
        { status: 400 },
      );
    }

    const validPlatforms = ["kiosk", "website"];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return NextResponse.json(
        { message: "platform must be kiosk or website" },
        { status: 400 },
      );
    }

    const movie = await Movie.findOne({
      movieTitle: { $regex: new RegExp(`^${escapeRegex(movieTitle)}$`, "i") },
    });

    if (!movie) {
      return NextResponse.json(
        { message: `Movie \"${movieTitle}\" not found` },
        { status: 404 },
      );
    }

    // Prevent duplicate seat reservation for same movie/day/week before creating records.
    const existingReservations = await ReservedSeat.find({
      seatNumber: {
        $in: seatsSelected.map((seat: string) =>
          (typeof seat === "string" ? seat : String(seat)).toUpperCase(),
        ),
      },
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
      return NextResponse.json(
        {
          message: "Some seats are already reserved",
          reservedSeats,
        },
        { status: 409 },
      );
    }

    const normalizedSeats = seatsSelected.map((seat: string) =>
      (typeof seat === "string" ? seat : String(seat)).toUpperCase(),
    );

    const origin = req.nextUrl.origin;
    const successUrl = `${origin}/api/payments/checkout/success?checkout_session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/kiosk/payment-method?checkout=cancelled`;

    const payload = {
      data: {
        attributes: {
          send_email_receipt: false,
          show_description: true,
          show_line_items: true,
          line_items: [
            {
              currency: "PHP",
              amount: Math.round(paymentAmount * 100),
              name: `CineAI Ticket - ${movie.movieTitle}`,
              quantity: 1,
            },
          ],
          payment_method_types: [
            "gcash",
            "paymaya",
            "grab_pay",
            "shopee_pay",
            "qrph",
            "shopee_pay",
            "billease",
            "card",
            "brankas_landbank",
            "brankas_metrobank",
            "dob_ubp",
            "brankas_bdo",
          ],
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            movieId: String(movie._id),
            movieTitle: movie.movieTitle,
            platform: platform.toLowerCase(),
            dayOfWeek,
            weekNumber,
            paymentAmount: String(paymentAmount),
            seatsSelected: JSON.stringify(normalizedSeats),
          },
        },
      },
    };

    const paymongoResponse = await fetch(
      `${PAYMONGO_BASE_URL}/checkout_sessions`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: getPayMongoAuthHeader(paymongoSecretKey),
        },
        body: JSON.stringify(payload),
      },
    );

    const paymongoData =
      (await paymongoResponse.json()) as PayMongoCreateCheckoutResponse;

    if (!paymongoResponse.ok) {
      const message =
        paymongoData.errors?.[0]?.detail ||
        "Failed to create PayMongo checkout session";
      return NextResponse.json({ message }, { status: 502 });
    }

    const checkoutSessionId = paymongoData.data?.id;
    const checkoutUrl = paymongoData.data?.attributes?.checkout_url;

    if (!checkoutSessionId || !checkoutUrl) {
      return NextResponse.json(
        { message: "Invalid PayMongo checkout response" },
        { status: 502 },
      );
    }

    const response = NextResponse.json(
      {
        message: "Checkout session created",
        checkoutSessionId,
        checkoutUrl,
        checkout_session_url: checkoutUrl,
      },
      { status: 201 },
    );

    response.cookies.set("paymongo_checkout_session_id", checkoutSessionId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 30,
    });

    return response;
  } catch (error) {
    console.error("PayMongo checkout error:", error);
    return NextResponse.json(
      {
        message: "Failed to create e-wallet checkout session",
        error: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 },
    );
  }
}
