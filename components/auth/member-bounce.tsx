"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/* Client-side bounce used ONLY where this Next.js build swallows server
   redirect()s (locale-rewritten routes): /login and /signup. The server has
   already validated the session against the database before rendering this;
   the redirect target is fixed, never user input. */
export default function MemberBounce({ target }: { target: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(target);
  }, [router, target]);
  return (
    <div className="flex min-h-dvh items-center justify-center bg-agro-paper">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-agro-slate">
        Taking you to your farm…
      </p>
    </div>
  );
}
