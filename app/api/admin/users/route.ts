import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Admin from "@/database/admin.model";
import bcrypt from "bcryptjs";
import { sanitizeString } from "@/lib/sanitize";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

// Helper to verify the requesting user is an admin
async function verifyAdmin() {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);
  if (!session?.adminId || session.role !== "admin") {
    return null;
  }
  return session;
}

// GET - List all users
export async function GET() {
  try {
    const session = await verifyAdmin();
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin access required." },
        { status: 403 },
      );
    }

    await connectDB();

    const users = await Admin.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return NextResponse.json(
      { message: "Users fetched successfully", users },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// POST - Create a new user
export async function POST(req: NextRequest) {
  try {
    const session = await verifyAdmin();
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin access required." },
        { status: 403 },
      );
    }

    await connectDB();

    const body = await req.json();

    const fullName = sanitizeString(body.fullName);
    const email = sanitizeString(body.email);
    const username = sanitizeString(body.username);
    const password = sanitizeString(body.password);
    const role = sanitizeString(body.role);

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

    // Check if user already exists
    const existingUser = await Admin.findOne({
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

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await Admin.create({
      fullName,
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
      role,
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          username: newUser.username,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Error creating user:", error);

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Failed to create user" },
      { status: 500 },
    );
  }
}
