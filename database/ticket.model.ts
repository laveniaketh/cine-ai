import { Schema, model, models, Document, Types } from "mongoose";

// TypeScript interface for Ticket document
export interface ITicket extends Document {
  ticket_id: number;
  movie_id: Types.ObjectId;
  platform: string;
  createdAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    ticket_id: {
      type: Number,
      required: [true, "Ticket ID is required"],
      unique: true,
    },
    movie_id: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: [true, "Movie ID is required"],
    },
    platform: {
      type: String,
      required: [true, "Platform is required"],
      trim: true,
      lowercase: true,
      enum: {
        values: ["kiosk", "website"],
        message: "Platform must be either kiosk or website",
      },
    },
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
  }
);

// Create index on ticket_id for better query performance
TicketSchema.index({ ticket_id: 1 }, { unique: true });

// Create index on movie_id for foreign key queries
TicketSchema.index({ movie_id: 1 });

// Create compound index for common queries
TicketSchema.index({ movie_id: 1, platform: 1 });

const Ticket = models.Ticket || model<ITicket>("Ticket", TicketSchema);

export default Ticket;
