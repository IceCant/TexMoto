import type { Motorcycle } from "@/db/schema";

const statusStyles: Record<Motorcycle["status"], string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-800",
  DRAFT: "bg-slate-100 text-slate-700",
  RESERVED: "bg-amber-50 text-amber-800",
  SOLD: "bg-blue-50 text-blue-800",
  HIDDEN: "bg-rose-50 text-rose-800",
};

export function StatusBadge({ status }: { status: Motorcycle["status"] }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[status]}`}>{status.toLowerCase()}</span>;
}

