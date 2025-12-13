import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ticket from "@/database/ticket.model";
import ReservedSeat from "@/database/reservedSeat.model";
import Payment from "@/database/payment.model";

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get movie_id from query parameters
    const { searchParams } = new URL(req.url);
    const movie_id = searchParams.get("movie_id");
    const dayOfWeek = searchParams.get("dayOfWeek");
    const weekNumber = searchParams.get("weekNumber");

    if (!movie_id) {
      return NextResponse.json(
        { message: "movie_id is required" },
        { status: 400 }
      );
    }

    // Build query filter
    const query: any = { movie_id };
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;
    if (weekNumber) query.weekNumber = weekNumber;

    // Find tickets for this movie filtered by day/week
    const tickets = await Ticket.find(query).select("_id");

    if (!tickets || tickets.length === 0) {
      return NextResponse.json(
        {
          message: "No tickets found for this movie",
          reservedSeats: [],
        },
        { status: 200 }
      );
    }

    // Extract ticket IDs
    const ticketIds = tickets.map((ticket) => ticket._id);

    // Find all reserved seats for these tickets
    const reservedSeats = await ReservedSeat.find({
      ticket_id: { $in: ticketIds },
    }).select("seatNumber ticket_id");

    // Find all payments for these tickets
    const payments = await Payment.find({
      ticket_id: { $in: ticketIds },
    }).select("ticket_id paymentStatus");

    // Create a map of ticket_id to payment status
    const paymentStatusMap = new Map();
    payments.forEach((payment) => {
      paymentStatusMap.set(payment.ticket_id.toString(), payment.paymentStatus);
    });

    // Combine seat numbers with payment status
    const seatsWithStatus = reservedSeats.map((seat) => ({
      seatNumber: seat.seatNumber,
      paymentStatus:
        paymentStatusMap.get(seat.ticket_id.toString()) || "pending",
    }));

    return NextResponse.json(
      {
        message: "Reserved seats fetched successfully",
        movie_id,
        reservedSeats: seatsWithStatus,
        count: seatsWithStatus.length,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("Error fetching reserved seats:", e);
    return NextResponse.json(
      {
        message: "Failed to fetch reserved seats",
        error: e instanceof Error ? e.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
