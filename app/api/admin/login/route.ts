import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/database/user.model";
import bcrypt from "bcryptjs";
import { encrypt } from "@/lib/session";
import { sanitizeString } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    // Sanitize inputs — reject objects/arrays to prevent NoSQL injection
    const username = sanitizeString(body.username);
    const password = sanitizeString(body.password);

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 },
      );
    }

    // Find user by username or email (safe: username is guaranteed to be a string)
    const user = await User.findOne({
      $or: [{ username }, { email: username.toLowerCase() }],
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Generate JWT token using jose (via shared encrypt function)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = await encrypt({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role || "admin",
      expiresAt,
    });

    // Return success with token
    return NextResponse.json(
      {
        message: "Login successful",
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          username: user.username,
          role: user.role || "admin",
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Login error:", error);

    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
