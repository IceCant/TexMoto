import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { createMotorcycleAction } from "@/app/admin/motorcycles/actions";
import { MotorcycleForm } from "@/components/motorcycle-form";

export const metadata = { title: "Add motorcycle" };

export default function NewMotorcyclePage() {
  return (
    <div>
      <div className="mx-auto mb-5 max-w-3xl"><Link href="/admin/motorcycles" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold"><ArrowLeft size={18} /> Motorcycles</Link><h1 className="mt-2 text-3xl font-black tracking-tight">Add a motorcycle</h1><p className="mt-2 text-sm text-[#68736c]">Only six things are needed to publish. Everything else is optional.</p></div>
      <MotorcycleForm action={createMotorcycleAction} />
    </div>
  );
}

