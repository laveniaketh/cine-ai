import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Ticket from "@/database/ticket.model";
import Payment from "@/database/payment.model";
import ReservedSeat from "@/database/reservedSeat.model";

// GET single ticket by ticket_id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const ticketId = parseInt(id);

    if (isNaN(ticketId)) {
      return NextResponse.json(
        { message: "Invalid ticket ID" },
        { status: 400 }
      );
    }

    const ticket = await Ticket.findOne({ ticket_id: ticketId }).populate(
      "movie_id"
    );

    if (!ticket) {
      return NextResponse.json(
        { message: `Ticket #${ticketId} not found` },
        { status: 404 }
      );
    }

    const payment = await Payment.findOne({ ticket_id: ticket._id });
    const reservedSeats = await ReservedSeat.find({ ticket_id: ticket._id });

    return NextResponse.json(
      {
        message: "Ticket fetched successfully",
        ticket: {
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
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Failed to fetch ticket",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update payment status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const ticketId = parseInt(id);

    if (isNaN(ticketId)) {
      return NextResponse.json(
        { message: "Invalid ticket ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { paymentStatus } = body;

    // Validate paymentStatus
    if (!paymentStatus) {
      return NextResponse.json(
        { message: "paymentStatus is required" },
        { status: 400 }
      );
    }

    const validStatuses = ["paid", "pending", "cancelled"];
    if (!validStatuses.includes(paymentStatus.toLowerCase())) {
      return NextResponse.json(
        { message: "paymentStatus must be paid, pending, or cancelled" },
        { status: 400 }
      );
    }

    // Find ticket
    const ticket = await Ticket.findOne({ ticket_id: ticketId });

    if (!ticket) {
      return NextResponse.json(
        { message: `Ticket #${ticketId} not found` },
        { status: 404 }
      );
    }

    // Update payment status
    const updatedPayment = await Payment.findOneAndUpdate(
      { ticket_id: ticket._id },
      { paymentStatus: paymentStatus.toLowerCase() },
      { new: true }
    );

    if (!updatedPayment) {
      return NextResponse.json(
        { message: "Payment record not found for this ticket" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Payment status updated successfully",
        payment: {
          ticket_id: ticketId,
          paymentAmount: updatedPayment.paymentAmount,
          paymentStatus: updatedPayment.paymentStatus,
          updatedAt: updatedPayment.updatedAt,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      {
        message: "Failed to update payment status",
        error: e instanceof Error ? e.message : "Unknown",
      },
      { status: 500 }
    );
  }
}
