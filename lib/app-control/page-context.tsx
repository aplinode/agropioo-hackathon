"use client";
import { createContext, useContext } from "react";

type PageContext = {
  currentPath: string;
  pageState: Record<string, unknown>;
};

const PageContext = createContext<PageContext>({ currentPath: "", pageState: {} });

export function PageContextProvider({
  children,
  currentPath,
  pageState,
}: {
  children: React.ReactNode;
  currentPath: string;
  pageState: Record<string, unknown>;
}) {
  return (
    <PageContext.Provider value={{ currentPath, pageState }}>
      {children}
    </PageContext.Provider>
  );
}

export function usePageContext() {
  return useContext(PageContext);
}
