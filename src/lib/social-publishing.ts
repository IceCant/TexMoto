import "server-only";

import { after } from "next/server";

import { publishMotorcycleToEnabledChannels } from "@/data/social-publishing";

export function scheduleSocialPublishing(input: { motorcycleId: string; businessId: string }) {
  const publicOrigin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  after(() => publishMotorcycleToEnabledChannels({ ...input, publicOrigin }));
}
