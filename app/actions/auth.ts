"use server";

import { z } from "zod";
import connectDB from "@/lib/mongodb";
import Admin from "@/database/admin.model";
import bcrypt from "bcryptjs";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";

// Validation schemas
const SignupFormSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: "Full name must be at least 2 characters long." })
    .trim(),
  email: z.string().email({ message: "Please enter a valid email." }).trim(),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long." })
    .max(30, { message: "Username cannot exceed 30 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores.",
    })
    .trim(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." })
    .trim(),
});

const LoginFormSchema = z.object({
  username: z
    .string()
    .min(1, { message: "Username or email is required." })
    .trim(),
  password: z.string().min(1, { message: "Password is required." }).trim(),
});

export type FormState =
  | {
      errors?: {
        fullName?: string[];
        email?: string[];
        username?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export async function signup(state: FormState, formData: FormData) {
  // 1. Validate form fields
  const validatedFields = SignupFormSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
  });

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { fullName, email, username, password } = validatedFields.data;

  try {
    await connectDB();

    // 2. Check if admin already exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingAdmin) {
      const field =
        existingAdmin.email === email.toLowerCase() ? "Email" : "Username";
      return {
        message: `${field} already exists`,
      };
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Create new admin
    const newAdmin = await Admin.create({
      fullName,
      email,
      username,
      password: hashedPassword,
    });

    // 5. Create session
    await createSession(
      newAdmin._id.toString(),
      newAdmin.username,
      newAdmin.email
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return {
        message: messages.join(", "),
      };
    }

    return {
      message: "Failed to create admin account",
    };
  }

  // 6. Redirect user
  redirect("/dashboard");
}

export async function login(state: FormState, formData: FormData) {
  console.log("=== LOGIN ATTEMPT ===");

  // 1. Validate form fields
  const validatedFields = LoginFormSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    console.log(
      "Validation failed:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { username, password } = validatedFields.data;
  console.log("Login attempt for username:", username);

  try {
    await connectDB();
    console.log("Database connected");

    // 2. Find admin by username or email
    const admin = await Admin.findOne({
      $or: [{ username }, { email: username.toLowerCase() }],
    });

    console.log("Admin found:", admin ? "Yes" : "No");

    if (!admin) {
      return {
        message: "Invalid credentials",
      };
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      return {
        message: "Invalid credentials",
      };
    }

    // 4. Create session
    console.log("Creating session for admin:", admin.username);
    await createSession(admin._id.toString(), admin.username, admin.email);
    console.log("Session created successfully");
  } catch (error: any) {
    console.error("Login error details:", error);
    console.error("Error stack:", error.stack);
    return {
      message: "Login failed: " + error.message,
    };
  }

  // 5. Redirect user
  console.log("Redirecting to dashboard");
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
