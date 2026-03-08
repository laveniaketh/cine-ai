"use server";

import { z } from "zod";
import connectDB from "@/lib/mongodb";
import User from "@/database/user.model";
import bcrypt from "bcryptjs";
import {
  clearPendingTwoFactorSession,
  createPendingTwoFactorSession,
  createSession,
  deleteSession,
  getPendingTwoFactorSession,
  isTrustedTwoFactorDevice,
  setTrustedTwoFactorDevice,
  setPendingTwoFactorMethod,
} from "@/lib/session";
import { redirect } from "next/navigation";
import { generateTwoFactorCode, sendVerificationCode } from "@/lib/twoFactor";

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

const LoginFormSchema = z
  .object({
    username: z
      .string()
      .min(1, { message: "Username or email is required." })
      .trim(),
    password: z.string().min(1, { message: "Password is required." }).trim(),
  });

const TwoFactorMethodSchema = z.object({
  method: z.enum(["sms", "call"], {
    message: "Please select a verification method.",
  }),
});

const TwoFactorCodeSchema = z.object({
  code: z.preprocess(
    (value) => String(value ?? "").replace(/\D/g, ""),
    z
      .string()
      .length(6, { message: "Code must be 6 digits." })
      .regex(/^\d{6}$/, { message: "Code must be 6 digits." }),
  ),
});

export type FormState =
  | {
      errors?: {
        fullName?: string[];
        email?: string[];
        username?: string[];
        password?: string[];
        method?: string[];
        code?: string[];
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

    // 2. Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      const field =
        existingUser.email === email.toLowerCase() ? "Email" : "Username";
      return {
        message: `${field} already exists`,
      };
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Create new user
    const newUser = await User.create({
      fullName,
      email,
      username,
      password: hashedPassword,
    });

    // 5. Create session
    await createSession(
      newUser._id.toString(),
      newUser.username,
      newUser.email,
      newUser.role || "admin",
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(
        (err: any) => err.message,
      );
      return {
        message: messages.join(", "),
      };
    }

    return {
      message: "Failed to create user account",
    };
  }

  // 6. Redirect user
  redirect("/dashboard");
}

export async function login(state: FormState, formData: FormData) {
  const validatedFields = LoginFormSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { username, password } = validatedFields.data;
  let nextPath: "/dashboard" | "/verify-2fa" = "/dashboard";

  try {
    await connectDB();

    const user = await User.findOne({
      $or: [{ username }, { email: username.toLowerCase() }],
    });

    if (!user) {
      return { message: "Invalid credentials" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { message: "Invalid credentials" };
    }

    if (user.phoneNumber) {
      const trustedDevice = await isTrustedTwoFactorDevice(user._id.toString());

      if (trustedDevice) {
        await createSession(
          user._id.toString(),
          user.username,
          user.email,
          user.role || "admin",
        );
      } else {
        await createPendingTwoFactorSession({
          userId: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role || "admin",
          phoneNumber: user.phoneNumber,
        });
        nextPath = "/verify-2fa";
      }
    } else {
      await createSession(
        user._id.toString(),
        user.username,
        user.email,
        user.role || "admin",
      );
    }
  } catch (error: any) {
    return {
      message: "Login failed: " + error.message,
    };
  }

  redirect(nextPath);
}

export async function sendTwoFactorCode(state: FormState, formData: FormData) {
  const validatedFields = TwoFactorMethodSchema.safeParse({
    method: formData.get("method"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const pending = await getPendingTwoFactorSession();
  if (!pending) {
    return { message: "Login session expired. Please login again." };
  }

  try {
    await connectDB();

    const user = await User.findById(pending.userId);
    if (!user || !user.phoneNumber) {
      return { message: "Unable to send code. User phone number not found." };
    }

    const code = generateTwoFactorCode();
    user.twoFactorCode = code;
    user.twoFactorExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendVerificationCode(
      user.phoneNumber,
      code,
      validatedFields.data.method,
    );
    await setPendingTwoFactorMethod(validatedFields.data.method);
  } catch (error: any) {
    return {
      message:
        error?.message ||
        "Failed to send verification code. Please try again.",
    };
  }

  redirect("/verify-2fa/code");
}

export async function verifyTwoFactorCode(state: FormState, formData: FormData) {
  const validatedFields = TwoFactorCodeSchema.safeParse({
    code: formData.get("code"),
  });

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  const pending = await getPendingTwoFactorSession();
  if (!pending) {
    return { message: "Login session expired. Please login again." };
  }

  try {
    await connectDB();

    const trustDevice =
      formData.get("trustDevice") === "on" ||
      formData.get("trustDevice") === "true";

    const user = await User.findById(pending.userId);
    if (!user) {
      return { message: "User not found. Please login again." };
    }

    if (
      !user.twoFactorCode ||
      !user.twoFactorExpires ||
      user.twoFactorExpires.getTime() < Date.now()
    ) {
      return { message: "Verification code expired. Please request a new code." };
    }

    if (validatedFields.data.code !== user.twoFactorCode) {
      return { message: "Invalid verification code." };
    }

    user.twoFactorCode = undefined;
    user.twoFactorExpires = undefined;
    await user.save();

    await createSession(
      user._id.toString(),
      user.username,
      user.email,
      user.role || "admin",
    );

    if (trustDevice) {
      await setTrustedTwoFactorDevice(user._id.toString());
    }

    await clearPendingTwoFactorSession();
  } catch (error: any) {
    return { message: error?.message || "Verification failed. Please try again." };
  }

  redirect("/dashboard");
}

export async function cancelTwoFactorLogin() {
  await clearPendingTwoFactorSession();
  redirect("/");
}

export async function resendTwoFactorCode() {
  const pending = await getPendingTwoFactorSession();
  if (!pending) {
    return { message: "Login session expired. Please login again." };
  }

  try {
    await connectDB();

    const user = await User.findById(pending.userId);
    if (!user || !user.phoneNumber) {
      return { message: "Unable to send code. User phone number not found." };
    }

    const code = generateTwoFactorCode();
    user.twoFactorCode = code;
    user.twoFactorExpires = new Date(Date.now() + 5 * 60 * 1000);
    await user.save();

    await sendVerificationCode(user.phoneNumber, code, pending.method || "sms");

    return { message: "A new verification code has been sent." };
  } catch (error: any) {
    return {
      message:
        error?.message ||
        "Failed to send verification code. Please try again.",
    };
  }
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
