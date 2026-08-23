import type { Metadata } from "next";
import PageHeader from "@/components/shell/page-header";
import AdvisorChat from "./advisor-chat";

export const metadata: Metadata = {
  title: "Advisor — Agropioo",
};

export default function AdvisorPage() {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col pt-1 lg:min-h-[calc(100dvh-11rem)]">
      <PageHeader
        eyebrow="AI advisor"
        title="Ask anything about your crop"
        description="Guidance that knows your farms, your weather, and your language. Text chat first — voice comes later."
      />
      <div className="mt-6 flex flex-1 flex-col">
        <AdvisorChat />
      </div>
    </div>
  );
}
