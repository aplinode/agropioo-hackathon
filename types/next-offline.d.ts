/**
 * Type declarations for the custom Next.js 16 offline module (next/offline).
 *
 * next/offline.js re-exports from dist/client/components/use-offline but
 * has no corresponding .d.ts, so TypeScript cannot resolve exports like
 * OfflineProvider from the bare path.
 */
import type { ReactNode } from "react";

declare module "next/offline" {
  export function dispatchOfflineChange(isOffline: boolean): void;
  export function OfflineProvider({ children }: { children: ReactNode }): React.ReactElement;
  export function useOffline(): boolean;
}
