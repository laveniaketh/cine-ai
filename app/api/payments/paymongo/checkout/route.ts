import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Movie from "@/database/movie.model";
import Ticket from "@/database/ticket.model";
import Payment from "@/database/payment.model";
import ReservedSeat from "@/database/reservedSeat.model";
import { createPaymongoCheckoutSession } from "@/lib/paymongo";

export async function POST(req: NextRequest) {
  await connectDB();

  try {
    const body = await req.json();

    const { movieTitle, seatsSelected, paymentAmount, platform, dayOfWeek, weekNumber } =
      body;

    if (
      !movieTitle ||
      !Array.isArray(seatsSelected) ||
      seatsSelected.length === 0 ||
      !paymentAmount ||
      !platform ||
      !dayOfWeek ||
      !weekNumber
    ) {
      return NextResponse.json(
        { message: "Required fields are missing" },
        { status: 400 }
      );
    }

    const movie = await Movie.findOne({
      movieTitle: { $regex: new RegExp(`^${movieTitle}$`, "i") },
    });

    if (!movie) {
      return NextResponse.json(
        { message: `Movie \"${movieTitle}\" not found` },
        { status: 404 }
      );
    }

    const existingReservations = await ReservedSeat.find({
      seatNumber: {
        $in: seatsSelected.map((seat: string) => seat.toUpperCase()),
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
        { status: 409 }
      );
    }

    const lastTicket = await Ticket.findOne().sort({ ticket_id: -1 });
    const newTicketId = lastTicket ? lastTicket.ticket_id + 1 : 1;

    const ticket = await Ticket.create({
      ticket_id: newTicketId,
      movie_id: movie._id,
      platform: platform.toLowerCase(),
      dayOfWeek,
      weekNumber,
    });

    const payment = await Payment.create({
      ticket_id: ticket._id,
      movie_id: movie._id,
      paymentAmount,
      paymentStatus: "pending",
      paymentMethod: "paymongo",
      gateway: "paymongo",
    });

    await Promise.all(
      seatsSelected.map((seat: string) =>
        ReservedSeat.create({
          ticket_id: ticket._id,
          seatNumber: seat.toUpperCase(),
        })
      )
    );

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const checkoutSession = await createPaymongoCheckoutSession({
        amount: Number(paymentAmount) * 100,
        description: `${movie.movieTitle} Ticket (${seatsSelected.length} seat${
          seatsSelected.length > 1 ? "s" : ""
        })`,
        successUrl: `${appUrl}/api/payments/paymongo/callback?checkout_session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${appUrl}/kiosk/payment-confirmation?payment=cancelled`,
        metadata: {
          payment_id: payment._id.toString(),
          ticket_id: ticket._id.toString(),
        },
      });

      payment.gatewayReference = checkoutSession.data.id;
      await payment.save();

      return NextResponse.json(
        {
          message: "E-wallet/online payment checkout session created",
          checkoutUrl: checkoutSession.data.attributes.checkout_url,
          checkoutSessionId: checkoutSession.data.id,
          ticketId: ticket.ticket_id,
        },
        { status: 201 }
      );
    } catch (gatewayError) {
      await ReservedSeat.deleteMany({ ticket_id: ticket._id });
      await Payment.findByIdAndDelete(payment._id);
      await Ticket.findByIdAndDelete(ticket._id);

      throw gatewayError;
    }
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to initialize e-wallet/online payment checkout",
        error: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
