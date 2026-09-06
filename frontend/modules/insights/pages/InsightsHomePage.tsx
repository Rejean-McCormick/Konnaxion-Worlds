// FILE: frontend/modules/insights/pages/InsightsHomePage.tsx

import Link from "next/link";

import MainLayout from "@/shared/layout/MainLayout";

export default function InsightsHomePage() {
  const links = [
    ["smart-vote", "Smart-Vote dashboard"],
    ["usage", "Usage dashboard"],
    ["perf", "Performance dashboard"],
    ["custom", "Custom report builder"],
  ];
  return (
    <MainLayout>
      <h1 className="mb-6 text-xl font-semibold">Insights</h1>
      <ul className="space-y-4 text-blue-600 underline">
        {links.map(([slug, label]) => (
          <li key={slug}>
            <Link href={`/reports/${slug}`}>{label}</Link>
          </li>
        ))}
      </ul>
    </MainLayout>
  );
}
