import "server-only";

import { redirect } from "next/navigation";

import { getCurrentSession } from "@/auth/session";

export async function requirePageSession() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  return session;
}

