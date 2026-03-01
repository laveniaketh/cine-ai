import "server-only";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { cache } from "react";
import { redirect } from "next/navigation";

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    redirect("/");
  }

  return {
    isAuth: true,
    userId: session.userId,
    username: session.username,
    email: session.email,
    role: session.role,
  };
});
