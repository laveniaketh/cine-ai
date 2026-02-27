import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/database/user.model";
import bcrypt from "bcryptjs";
import { sanitizeString } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    // Sanitize inputs — reject objects/arrays to prevent NoSQL injection
    const fullName = sanitizeString(body.fullName);
    const email = sanitizeString(body.email);
    const username = sanitizeString(body.username);
    const password = sanitizeString(body.password);
    const role = sanitizeString(body.role);

    // Validate required fields
    if (!fullName || !email || !username || !password || !role) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 },
      );
    }

    // Validate role
    const validRoles = ["admin", "cashier"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { message: "Role must be admin or cashier" },
        { status: 400 },
      );
    }

    // Check if user already exists (safe: values are guaranteed strings)
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      const field =
        existingUser.email === email.toLowerCase() ? "Email" : "Username";
      return NextResponse.json(
        { message: `${field} already exists` },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    const newUser = await User.create({
      fullName,
      email,
      username,
      password: hashedPassword,
      role,
    });

    // Return success without password
    return NextResponse.json(
      {
        message: "User account created successfully",
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
        },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      return NextResponse.json(
        { message: messages.join(", ") },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Failed to create user account" },
      { status: 500 },
    );
  }
}
