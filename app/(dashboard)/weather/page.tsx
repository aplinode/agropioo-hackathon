import type { Metadata } from "next";
import ToolPlaceholder from "@/components/shell/tool-placeholder";

export const metadata: Metadata = {
  title: "Weather — Agropioo",
};

export default function WeatherPage() {
  return (
    <ToolPlaceholder
      eyebrow="Weather"
      title="Your fields' forecast"
      description="A hyperlocal forecast for your farm locations, with the spray and irrigation windows that matter."
    />
  );
}
