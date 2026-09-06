// FILE: frontend/shared/downloadCsv.ts
'use client'

export async function downloadCsv(endpoint: string, params?: Record<string, unknown>) {
  const search = new URLSearchParams();

  // Attach any filter params (range, grouping, etc.)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      search.append(key, String(value));
    }
  }

  // v14 export contract: /reports/export?report=smart-vote|usage|perf&format=csv
  search.set("report", endpoint);
  search.set("format", "csv");

  const url = `/api/reports/export?${search.toString()}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("CSV export failed");

  const blob = await res.blob();
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${endpoint}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
