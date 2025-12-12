import { Schema, model, models, Document, Types } from "mongoose";

// TypeScript interface for Payment document
export interface IPayment extends Document {
  ticket_id: Types.ObjectId;
  movie_id: Types.ObjectId;
  paymentAmount: number;
  paymentStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    ticket_id: {
      type: Schema.Types.ObjectId,
      ref: "Ticket",
      required: [true, "Ticket ID is required"],
    },
    movie_id: {
      type: Schema.Types.ObjectId,
      ref: "Movie",
      required: [true, "Movie ID is required"],
    },
    paymentAmount: {
      type: Number,
      required: [true, "Payment amount is required"],
      min: [0, "Payment amount cannot be negative"],
    },
    paymentStatus: {
      type: String,
      required: [true, "Payment status is required"],
      trim: true,
      lowercase: true,
      enum: {
        values: ["paid", "pending", "cancelled"],
        message: "Payment status must be paid, pending, or cancelled",
      },
      default: "pending",
    },
  },
  {
    timestamps: true, // Auto-generate createdAt and updatedAt
  }
);

// Create index on ticket_id for foreign key queries
PaymentSchema.index({ ticket_id: 1 });

// Create index on movie_id for reporting queries
PaymentSchema.index({ movie_id: 1 });

// Create compound index for common queries
PaymentSchema.index({ ticket_id: 1, paymentStatus: 1 });

// Create index on paymentStatus for filtering
PaymentSchema.index({ paymentStatus: 1 });

const Payment = models.Payment || model<IPayment>("Payment", PaymentSchema);

export default Payment;
