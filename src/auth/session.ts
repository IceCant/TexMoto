import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";

import { db } from "@/db";
import { businesses, sessions, users } from "@/db/schema";
import { DomainError } from "@/domain/errors";

const sessionCookieName = "texmoto_session";

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sessionDurationMilliseconds() {
  const days = Number(process.env.SESSION_TTL_DAYS ?? 30);
  if (!Number.isFinite(days) || days < 1) throw new Error("SESSION_TTL_DAYS must be a positive number.");
  return days * 24 * 60 * 60 * 1000;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDurationMilliseconds());

  await db.insert(sessions).values({ tokenHash: hashSessionToken(token), userId, expiresAt });
  (await cookies()).set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token)));
  cookieStore.delete(sessionCookieName);
}

export const getCurrentSession = cache(async () => {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;

  const [session] = await db
    .select({
      userId: users.id,
      userName: users.name,
      userEmail: users.email,
      role: users.role,
      businessId: businesses.id,
      businessName: businesses.name,
      businessSlug: businesses.slug,
      storefrontTheme: businesses.storefrontTheme,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .innerJoin(businesses, eq(users.businessId, businesses.id))
    .where(and(eq(sessions.tokenHash, hashSessionToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  return session ?? null;
});

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) throw new DomainError("Please log in to continue.", "UNAUTHENTICATED");
  return session;
}
