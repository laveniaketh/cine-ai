import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/database/user.model";
import bcrypt from "bcryptjs";
import { sanitizeString } from "@/lib/sanitize";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

// Helper to verify the requesting user is an admin
async function verifyAdmin() {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);
  if (!session?.userId || session.role !== "admin") {
    return null;
  }
  return session;
}

// GET - Get a single user
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifyAdmin();
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin access required." },
        { status: 403 },
      );
    }

    await connectDB();
    const { id } = await params;

    // Validate ObjectId format
    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json(
        { message: "Invalid user ID format" },
        { status: 400 },
      );
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "User fetched successfully", user },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Failed to fetch user" },
      { status: 500 },
    );
  }
}

// PUT - Update a user (role, name, email)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifyAdmin();
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin access required." },
        { status: 403 },
      );
    }

    await connectDB();
    const { id } = await params;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json(
        { message: "Invalid user ID format" },
        { status: 400 },
      );
    }

    const body = await req.json();

    const fullName = sanitizeString(body.fullName);
    const email = sanitizeString(body.email);
    const username = sanitizeString(body.username);
    const role = sanitizeString(body.role);
    const password = sanitizeString(body.password);

    const updateData: Record<string, string> = {};

    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email.toLowerCase();
    if (username) updateData.username = username;
    if (role) {
      const validRoles = ["admin", "cashier"];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { message: "Role must be admin or cashier" },
          { status: 400 },
        );
      }
      updateData.role = role;
    }
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { message: "Password must be at least 6 characters" },
          { status: 400 },
        );
      }
      updateData.password = await bcrypt.hash(password, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No fields to update" },
        { status: 400 },
      );
    }

    // Check for duplicate email/username (excluding current user)
    if (updateData.email || updateData.username) {
      const orConditions = [];
      if (updateData.email) orConditions.push({ email: updateData.email });
      if (updateData.username)
        orConditions.push({ username: updateData.username });

      const existingUser = await User.findOne({
        $or: orConditions,
        _id: { $ne: id },
      });

      if (existingUser) {
        const field =
          existingUser.email === updateData.email ? "Email" : "Username";
        return NextResponse.json(
          { message: `${field} already taken by another user` },
          { status: 409 },
        );
      }
    }

    // Prevent last admin from being changed to cashier
    if (updateData.role === "cashier") {
      const adminCount = await User.countDocuments({ role: "admin" });
      const currentUser = await User.findById(id);
      if (currentUser?.role === "admin" && adminCount <= 1) {
        return NextResponse.json(
          {
            message:
              "Cannot change role. At least one admin must exist in the system.",
          },
          { status: 400 },
        );
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "User updated successfully", user: updatedUser },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("Error updating user:", error);

    if (error instanceof Error && error.name === "ValidationError") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Failed to update user" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifyAdmin();
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized. Admin access required." },
        { status: 403 },
      );
    }

    await connectDB();
    const { id } = await params;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return NextResponse.json(
        { message: "Invalid user ID format" },
        { status: 400 },
      );
    }

    // Prevent self-deletion
    if (session.userId === id) {
      return NextResponse.json(
        { message: "You cannot delete your own account" },
        { status: 400 },
      );
    }

    // Prevent deletion of last admin
    const user = await User.findById(id);
    if (user?.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return NextResponse.json(
          {
            message:
              "Cannot delete the last admin. At least one admin must exist.",
          },
          { status: 400 },
        );
      }
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "User deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: "Failed to delete user" },
      { status: 500 },
    );
  }
}
