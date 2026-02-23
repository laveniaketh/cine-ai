import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Admin from "@/database/admin.model";
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

    // Find admin by username or email (safe: username is guaranteed to be a string)
    const admin = await Admin.findOne({
      $or: [{ username }, { email: username.toLowerCase() }],
    });

    if (!admin) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Generate JWT token using jose (via shared encrypt function)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const token = await encrypt({
      adminId: admin._id.toString(),
      username: admin.username,
      email: admin.email,
      role: admin.role || "admin",
      expiresAt,
    });

    // Return success with token
    return NextResponse.json(
      {
        message: "Login successful",
        token,
        admin: {
          id: admin._id,
          fullName: admin.fullName,
          email: admin.email,
          username: admin.username,
          role: admin.role || "admin",
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Login error:", error);

    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
