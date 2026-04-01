"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import io, { Socket } from "socket.io-client";

const cameras = ["cam_1", "cam_2", "cam_3"];

const Map = dynamic(() => import("./components/Map"), { ssr: false });
const Graph = dynamic(() => import("./components/Graph"), { ssr: false });

type Alert = {
  cameraId?: string;
  location: string;
  severity: string;
  time: string;
};

//   USE ENV VARIABLE
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function Home() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    //   INIT SOCKET ONLY ON CLIENT
    const newSocket = io(BACKEND_URL, {
      transports: ["websocket"]
    });

    setSocket(newSocket);

    newSocket.on("init_alerts", (data: Alert[]) => {
      setAlerts([...data].reverse());
    });

    newSocket.on("new_alert", (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const total = alerts.length;
  const high = alerts.filter(a => a.severity === "HIGH").length;
  const medium = alerts.filter(a => a.severity === "MEDIUM").length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-slate-800 text-white p-8 relative">

      {/*  LIVE INDICATOR */}
      <div className="absolute top-6 right-8 flex items-center gap-2">
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-green-400 text-sm">LIVE</span>
      </div>

      {/* TITLE */}
      <h1 className="text-3xl font-bold text-cyan-400 mb-6 drop-shadow-[0_0_10px_rgba(34,211,238,0.7)]">
        🚦 Road Safety AI Dashboard
      </h1>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card title="Total Alerts" value={total} />
        <Card title="High Severity" value={high} />
        <Card title="Medium Severity" value={medium} />
      </div>

      {/* MAP + GRAPH */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-2xl shadow-lg">
          <Map alerts={alerts} />
        </div>

        <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-2xl shadow-lg">
          <Graph alerts={alerts} />
        </div>
      </div>

      {/* 🎥 CAMERA GRID */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {cameras.map((cam) => {
          const camAlerts = alerts.filter(a => a.cameraId === cam);

          return (
            <div
              key={cam}
              className={`bg-white/5 backdrop-blur-lg border ${
                camAlerts.length > 0 ? "border-red-500" : "border-white/10"
              } p-3 rounded-2xl shadow-lg transition hover:scale-[1.02]`}
            >
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-cyan-400"> {cam}</p>
                <p className="text-xs text-gray-400"> {camAlerts.length}</p>
              </div>

              <img
                src={`${BACKEND_URL}/stream/${cam}.jpg?${Date.now()}`}
                className="rounded-lg w-full transition-opacity duration-150"
              />
            </div>
          );
        })}
      </div>

      {/* ALERTS */}
      <div className="space-y-4">
        {alerts.map((alert, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-2xl flex justify-between items-center hover:scale-[1.01] transition"
          >
            <div>
              <p className="font-semibold text-lg"> {alert.location}</p>

              <p className="text-xs text-cyan-300">
                 {alert.cameraId || "cam_1"}
              </p>

              <p className="text-sm text-gray-400">
                {new Date(alert.time).toLocaleTimeString()}
              </p>
            </div>

            <span
              className={`px-4 py-1 rounded-full text-sm font-bold ${
                alert.severity === "HIGH"
                  ? "bg-red-500/20 text-red-400 border border-red-500 shadow-[0_0_10px_rgba(255,0,0,0.6)]"
                  : "bg-yellow-500/20 text-yellow-300 border border-yellow-500"
              }`}
            >
              {alert.severity}
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 p-4 rounded-2xl shadow-lg">
      <p className="text-gray-400">{title}</p>
      <h2 className="text-2xl font-bold mt-2">{value}</h2>
    </div>
  );
}