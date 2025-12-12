import { Schema, model, models, Document, Types } from "mongoose";

// TypeScript interface for ReservedSeat document
export interface IReservedSeat extends Document {
  ticket_id: Types.ObjectId;
  seatNumber: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReservedSeatSchema = new Schema<IReservedSeat>(
  {
    ticket_id: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: [true, "Ticket ID is required"],
    },
    seatNumber: {
      type: String,
      required: [true, "Seat number is required"],
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z]\d{1,2}$/,
        "Seat number must be in format like A5, B10, etc.",
      ],
    },
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
  }
);

// Create index on ticket_id for foreign key queries
ReservedSeatSchema.index({ ticket_id: 1 });

// Create unique compound index to prevent duplicate seat reservations for the same ticket
ReservedSeatSchema.index({ ticket_id: 1, seatNumber: 1 }, { unique: true });

// Create index on seatNumber for availability queries
ReservedSeatSchema.index({ seatNumber: 1 });

const ReservedSeat =
  models.ReservedSeat ||
  model<IReservedSeat>("ReservedSeat", ReservedSeatSchema);

export default ReservedSeat;
