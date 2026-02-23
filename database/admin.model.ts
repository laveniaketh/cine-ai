import { Schema, model, models, Document } from "mongoose";

// Valid roles
export type AdminRole = "admin" | "cashier";

// TypeScript interface for Admin document
export interface IAdmin extends Document {
  fullName: string;
  email: string;
  username: string;
  password: string;
  role: AdminRole;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      maxlength: [100, "Full name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      unique: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      trim: true,
      unique: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "cashier"],
      default: "admin",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Create index on email for better query performance
AdminSchema.index({ email: 1 }, { unique: true });

// Create index on username for better query performance
AdminSchema.index({ username: 1 }, { unique: true });

const Admin = models.Admin || model<IAdmin>("Admin", AdminSchema);

export default Admin;
