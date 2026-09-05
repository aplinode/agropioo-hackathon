"use client";

import { useDrainOnReconnect } from "@/lib/offline/hooks";

export function OfflineDrainClient() {
  useDrainOnReconnect();
  return null;
}
