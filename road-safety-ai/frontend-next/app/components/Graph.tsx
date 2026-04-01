"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type Alert = {
  time: string;
};

export default function Graph({ alerts }: { alerts: Alert[] }) {

  // Group alerts by time (simple count)
  const labels = alerts.map((_, i) => `Event ${i + 1}`);

  const data = {
    labels,
    datasets: [
      {
        label: "Accidents Detected",
        data: alerts.map((_, i) => i + 1),
      }
    ]
  };

  return (
    <div className="bg-white p-4 rounded-xl">
      <Line data={data} />
    </div>
  );
}