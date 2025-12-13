import { Schema, model, models, Document, Types } from "mongoose";

// TypeScript interface for Ticket document
export interface ITicket extends Document {
  ticket_id: number;
  movie_id: Types.ObjectId;
  platform: string;
  dayOfWeek: string;
  weekNumber: string;
  createdAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    ticket_id: {
      type: Number,
      required: [true, "Ticket ID is required"],
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
    dayOfWeek: {
      type: String,
      required: false,
      trim: true,
      enum: {
        values: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        message: "Day of week must be Mon, Tue, Wed, Thu, Fri, Sat, or Sun",
      },
    },
    weekNumber: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
  }
);

// Pre-save hook to automatically set dayOfWeek and weekNumber based on createdAt
TicketSchema.pre("save", function () {
  if (this.isNew) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const date = this.createdAt || new Date();
    this.dayOfWeek = days[date.getDay()];

    const dayOfMonth = date.getDate();
    // Calculate week number within the month (1-4)
    // Days 1-7: Week 1, Days 8-14: Week 2, Days 15-21: Week 3, Days 22-31: Week 4
    const weekNum = Math.ceil(dayOfMonth / 7);
    this.weekNumber = `Week ${weekNum}`;
  }
});

// Create index on ticket_id for better query performance
TicketSchema.index({ ticket_id: 1 }, { unique: true });

// Create index on movie_id for foreign key queries
TicketSchema.index({ movie_id: 1 });

// Create compound index for common queries
TicketSchema.index({ movie_id: 1, platform: 1 });

const Ticket = models.Ticket || model<ITicket>("Ticket", TicketSchema);

export default Ticket;
