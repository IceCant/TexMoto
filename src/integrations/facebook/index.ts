import "server-only";

import { FacebookGraphPublisher } from "@/integrations/facebook/api";
import type { FacebookPublisher } from "@/integrations/facebook/types";

let testPublisher: FacebookPublisher | undefined;

export function getFacebookPublisher() {
  return testPublisher ?? new FacebookGraphPublisher();
}

export function setFacebookPublisherForTests(publisher?: FacebookPublisher) {
  if (process.env.NODE_ENV !== "test") throw new Error("Facebook test provider can only be changed in tests.");
  testPublisher = publisher;
}
