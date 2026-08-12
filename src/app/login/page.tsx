import { redirect } from "next/navigation";

import { getCurrentSession } from "@/auth/session";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/app/login/login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getCurrentSession()) redirect("/admin");
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <section className="card w-full max-w-md p-6 sm:p-9">
        <Logo />
        <p className="eyebrow mt-10">Shop workspace</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-[#68736c]">Sign in to add motorcycles and manage your public listings.</p>
        <LoginForm />
      </section>
    </main>
  );
}

