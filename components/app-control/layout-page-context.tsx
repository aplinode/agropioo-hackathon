"use client";
import { usePathname } from "next/navigation";
import { PageContextProvider, usePageContext } from "@/lib/app-control/page-context";

function PathProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ctx = usePageContext();
  return (
    <PageContextProvider currentPath={pathname} pageState={ctx.pageState}>
      {children}
    </PageContextProvider>
  );
}

export default function LayoutWithPageContext({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageContextProvider currentPath="" pageState={{}}>
      <PathProvider>{children}</PathProvider>
    </PageContextProvider>
  );
}
