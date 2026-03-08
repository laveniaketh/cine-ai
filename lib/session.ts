import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface SessionPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  expiresAt: Date;
}

export interface PendingTwoFactorPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  phoneNumber: string;
  method?: "sms" | "call";
  expiresAt: Date;
}

export interface TrustedTwoFactorDevicePayload {
  userId: string;
  role: "trusted_2fa";
  expiresAt: Date;
}

const secretKey = process.env.JWT_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as any as SessionPayload;
  } catch (error) {
    console.log("Failed to verify session");
    return null;
  }
}

export async function createSession(
  userId: string,
  username: string,
  email: string,
  role: string,
) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, username, email, role, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function createPendingTwoFactorSession(
  payload: Omit<PendingTwoFactorPayload, "expiresAt">,
) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const pendingSession = await encrypt({ ...payload, expiresAt } as SessionPayload);
  const cookieStore = await cookies();

  cookieStore.set("pending_2fa", pendingSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getPendingTwoFactorSession() {
  const cookie = (await cookies()).get("pending_2fa")?.value;
  if (!cookie) return null;

  const payload = (await decrypt(cookie)) as unknown as PendingTwoFactorPayload | null;
  if (!payload) return null;

  if (!payload.expiresAt || new Date(payload.expiresAt).getTime() < Date.now()) {
    return null;
  }

  return payload;
}

export async function setPendingTwoFactorMethod(method: "sms" | "call") {
  const pending = await getPendingTwoFactorSession();
  if (!pending) return;

  await createPendingTwoFactorSession({
    userId: pending.userId,
    username: pending.username,
    email: pending.email,
    role: pending.role,
    phoneNumber: pending.phoneNumber,
    method,
  });
}

export async function updateSession() {
  const session = (await cookies()).get("session")?.value;
  const payload = await decrypt(session);

  if (!session || !payload) {
    return null;
  }

  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const cookieStore = await cookies();

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expires,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

export async function clearPendingTwoFactorSession() {
  const cookieStore = await cookies();
  cookieStore.delete("pending_2fa");
}

export async function setTrustedTwoFactorDevice(userId: string) {
  const expiresAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
  const trustedToken = await encrypt({
    userId,
    username: "trusted-device",
    email: "",
    role: "trusted_2fa",
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set("trusted_2fa", trustedToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function isTrustedTwoFactorDevice(userId: string) {
  const cookie = (await cookies()).get("trusted_2fa")?.value;
  if (!cookie) return false;

  const payload = (await decrypt(cookie)) as unknown as TrustedTwoFactorDevicePayload | null;
  if (!payload) return false;
  if (payload.role !== "trusted_2fa") return false;
  if (payload.userId !== userId) return false;

  if (!payload.expiresAt || new Date(payload.expiresAt).getTime() < Date.now()) {
    return false;
  }

  return true;
}
