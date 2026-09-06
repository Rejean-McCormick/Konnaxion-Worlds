import type { Metadata } from "next";

import { DemoImporterPanel } from "@/features/ethikos/demo-importer/DemoImporterPanel";

export const metadata: Metadata = {
  title: "ethiKos Demo Importer | Konnaxion",
  description: "Import, preview, and reset ethiKos demo scenarios.",
};

export default function EthikosDemoImporterPage() {
  return <DemoImporterPanel />;
}