import type { ReactNode } from "react";
import { requireGuestPage } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

/* Login page: signed-in visitors are pushed to /dashboard (FR28). */
export default async function LoginLayout({ children }: { children: ReactNode }) {
  await requireGuestPage();
  return <>{children}</>;
}
