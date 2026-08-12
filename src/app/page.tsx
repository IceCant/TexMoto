import { redirect } from "next/navigation";

import { getCurrentSession } from "@/auth/session";

export default async function HomePage() {
  const session = await getCurrentSession();
  redirect(session ? "/admin" : "/login");
}

