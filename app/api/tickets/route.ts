import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Movie from "@/database/movie.model";
import Ticket from "@/database/ticket.model";
import Payment from "@/database/payment.model";
import ReservedSeat from "@/database/reservedSeat.model";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      movieTitle,
      seatsSelected,
      paymentAmount,
      paymentStatus,
      platform,
    } = body;

    // Validate required fields
    if (
      !movieTitle ||
      !seatsSelected ||
      !paymentAmount ||
      !paymentStatus ||
      !platform
    ) {
      return NextResponse.json(
        { message: "Required fields are missing" },
        { status: 400 }
      );
    }

    // Validate platform
    const validPlatforms = ["kiosk", "website"];
    if (!validPlatforms.includes(platform.toLowerCase())) {
      return NextResponse.json(
        { message: "platform must be kiosk or website" },
        { status: 400 }
      );
    }

    // Validate seatsSelected is an array
    if (!Array.isArray(seatsSelected) || seatsSelected.length === 0) {
      return NextResponse.json(
        { message: "seatsSelected must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate payment status
    const validStatuses = ["paid", "pending", "cancelled"];
    if (!validStatuses.includes(paymentStatus.toLowerCase())) {
      return NextResponse.json(
        { message: "paymentStatus must be paid, pending, or cancelled" },
        { status: 400 }
      );
    }

    // Find movie by title
    const movie = await Movie.findOne({
      movieTitle: { $regex: new RegExp(`^${movieTitle}$`, "i") },
    });

    if (!movie) {
      return NextResponse.json(
        { message: `Movie "${movieTitle}" not found` },
        { status: 404 }
      );
    }

    // Check if any of the selected seats are already reserved for this movie
    const existingReservations = await ReservedSeat.find({
      seatNumber: {
        $in: seatsSelected.map((seat: string) => seat.toUpperCase()),
      },
    }).populate({
      path: "ticket_id",
      match: { movie_id: movie._id },
    });

    const reservedSeats = existingReservations
      .filter((reservation) => reservation.ticket_id !== null)
      .map((reservation) => reservation.seatNumber);

    if (reservedSeats.length > 0) {
      return NextResponse.json(
        {
          message: "Some seats are already reserved",
          reservedSeats: reservedSeats,
        },
        { status: 409 }
      );
    }

    // Generate unique ticket_id (simple incrementing number)
    const lastTicket = await Ticket.findOne().sort({ ticket_id: -1 });
    const newTicketId = lastTicket ? lastTicket.ticket_id + 1 : 1;

    // Create ticket
    const ticket = await Ticket.create({
      ticket_id: newTicketId,
      movie_id: movie._id,
      platform: platform.toLowerCase(),
    });

    // Create payment record
    const payment = await Payment.create({
      ticket_id: ticket._id,
      movie_id: movie._id,
      paymentAmount: paymentAmount,
      paymentStatus: paymentStatus.toLowerCase(),
    });

    // Create reserved seats
    const reservedSeatsPromises = seatsSelected.map((seat: string) =>
      ReservedSeat.create({
        ticket_id: ticket._id,
        seatNumber: seat.toUpperCase(),
      })
    );

    const reservedSeatsRecords = await Promise.all(reservedSeatsPromises);

    // Return success response with all created records
    return NextResponse.json(
      {
        message: "Ticket purchased successfully",
        ticket: {
          ticket_id: ticket.ticket_id,
          movie_id: ticket.movie_id,
          movieTitle: movie.movieTitle,
          platform: ticket.platform,
          createdAt: ticket.createdAt,
          payment: {
            paymentAmount: payment.paymentAmount,
            paymentStatus: payment.paymentStatus,
          },
          reservedSeats: reservedSeatsRecords.map((seat) => seat.seatNumber),
        },
      },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Ticket purchase failed",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const tickets = await Ticket.find()
      .populate("movie_id")
      .sort({ createdAt: -1 });

    // Get payment and reserved seats for each ticket
    const ticketsWithDetails = await Promise.all(
      tickets.map(async (ticket) => {
        const payment = await Payment.findOne({ ticket_id: ticket._id });
        const reservedSeats = await ReservedSeat.find({
          ticket_id: ticket._id,
        });

        return {
          ticket_id: ticket.ticket_id,
          movie: ticket.movie_id,
          platform: ticket.platform,
          createdAt: ticket.createdAt,
          payment: payment
            ? {
                paymentAmount: payment.paymentAmount,
                paymentStatus: payment.paymentStatus,
              }
            : null,
          reservedSeats: reservedSeats.map((seat) => seat.seatNumber),
        };
      })
    );

    // Filter out incomplete tickets (no payment or no reserved seats)
    const validTickets = ticketsWithDetails.filter(
      (ticket) =>
        ticket.ticket_id &&
        ticket.payment &&
        ticket.reservedSeats &&
        ticket.reservedSeats.length > 0
    );

    return NextResponse.json(
      { message: "Tickets fetched successfully", tickets: validTickets },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      { message: "Tickets fetch failed", error: e },
      { status: 500 }
    );
  }
}
