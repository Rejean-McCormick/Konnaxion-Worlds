// FILE: frontend/modules/insights/components/LatencySLOGauge.tsx
"use client";
import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
ChartJS.register(ArcElement, Tooltip, Legend);

export default function LatencySLOGauge({
  valueMs,
  sloMs,
}: {
  valueMs: number;
  sloMs: number;
}) {
  const pct = Math.min(100, (valueMs / sloMs) * 100);
  const data = {
    labels: ["Latency", "Budget"],
    datasets: [
      {
        data: [pct, 100 - pct],
        backgroundColor: ["#3b82f6", "#e5e7eb"],
        borderWidth: 0,
      },
    ],
  };
  return (
    <div className="w-48">
      <Doughnut data={data} options={{ cutout: "70%" }} />
      <p className="text-center -mt-14 text-xl font-semibold">{valueMs} ms</p>
    </div>
  );
}

