import "server-only";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/session";
import { cache } from "react";
import { redirect } from "next/navigation";

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.adminId) {
    redirect("/login");
  }

  return {
    isAuth: true,
    adminId: session.adminId,
    username: session.username,
    email: session.email,
  };
});
