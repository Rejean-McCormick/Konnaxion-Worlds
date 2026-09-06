// FILE: frontend/modules/insights/components/SmartVoteChart.tsx
"use client";
import {
  BarElement,
  CategoryScale,
  ChartDataset,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  Tooltip,
} from "chart.js";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
);

type Props = {
  labels: string[];
  votes: number[];
  scores: number[];
};

export default function SmartVoteChart({ labels, votes, scores }: Props) {
  const data = {
    labels,
    datasets: [
      {
        type: "bar" as const,
        label: "Votes",
        data: votes,
        yAxisID: "y",
      } as ChartDataset<"bar", number[]>,
      {
        type: "line" as const,
        label: "Avg Score",
        data: scores,
        yAxisID: "y1",
      } as ChartDataset<"line", number[]>,
    ],
  };
  const options = {
    responsive: true,
    interaction: { mode: "index" as const, intersect: false },
    scales: {
      y: { beginAtZero: true },
      y1: { beginAtZero: true, position: "right" as const },
    },
  };
  return <Chart type="bar" data={data} options={options} />;
}
