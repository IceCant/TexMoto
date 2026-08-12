import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 font-black tracking-tight">
      <span className="grid size-9 place-items-center rounded-xl bg-[#d75d2a] text-sm text-white">TM</span>
      <span className="text-xl">TexMoto</span>
    </Link>
  );
}

