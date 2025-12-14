import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Admin from "@/database/admin.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();
    const { username, password } = body;

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    // Find admin by username or email
    const admin = await Admin.findOne({
      $or: [{ username }, { email: username.toLowerCase() }],
    });

    if (!admin) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: admin._id,
        username: admin.username,
        email: admin.email,
      },
      process.env.JWT_SECRET || "your-secret-key-change-this-in-production",
      { expiresIn: "7d" }
    );

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
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error:", error);

    return NextResponse.json({ message: "Login failed" }, { status: 500 });
  }
}
