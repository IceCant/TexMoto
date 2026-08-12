import Link from "next/link";

import { Logo } from "@/components/logo";

export default function NotFound() {
  return <main className="grid min-h-dvh place-items-center px-4"><div className="card max-w-md p-8 text-center"><Logo /><p className="eyebrow mt-10">404</p><h1 className="mt-2 text-3xl font-black">Page not found</h1><p className="mt-2 text-sm leading-6 text-[#68736c]">This shop or motorcycle listing is not available.</p><Link href="/" className="button-primary mt-6">Go home</Link></div></main>;
}

