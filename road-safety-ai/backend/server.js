const cors = require("cors");
const express = require("express");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

// ======================
// 🔥 CREATE HTTP SERVER + SOCKET.IO
// ======================
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // later restrict to your frontend URL
  },
});

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());

// ======================
// 📁 STREAM PATH
// ======================
const streamPath = path.resolve(__dirname, "../stream");

console.log("📁 Serving stream from:", streamPath);

// ⚠️ In cloud, this may not exist → handle safely
if (fs.existsSync(streamPath)) {
  app.use("/stream", express.static(streamPath));
} else {
  console.log("⚠️ Stream folder not found (expected in local only)");
}

// ======================
// 💾 DATA STORAGE
// ======================
const filePath = path.join(__dirname, "alerts.json");

let alerts = [];

// Load previous alerts safely
try {
  if (fs.existsSync(filePath)) {
    alerts = JSON.parse(fs.readFileSync(filePath));
  }
} catch (err) {
  console.log("⚠️ Error reading alerts.json:", err.message);
  alerts = [];
}

// ======================
// 🔌 SOCKET CONNECTION
// ======================
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  // Send existing alerts
  socket.emit("init_alerts", alerts);

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// ======================
// 🚨 ROUTES
// ======================

// POST alert
app.post("/alert", (req, res) => {
  const alert = req.body;

  alerts.push(alert);

  try {
    fs.writeFileSync(filePath, JSON.stringify(alerts, null, 2));
  } catch (err) {
    console.log("⚠️ Failed to write alerts.json:", err.message);
  }

  console.log("🚨 Alert received:", alert);

  // 🔥 REAL-TIME BROADCAST
  io.emit("new_alert", alert);

  res.json({ status: "ok" });
});

// GET alerts
app.get("/alerts", (req, res) => {
  res.json(alerts);
});

// ======================
// 🧪 DEBUG ROUTE
// ======================
app.get("/test", (req, res) => {
  const file = path.resolve(__dirname, "../stream/frame.jpg");

  if (fs.existsSync(file)) {
    res.sendFile(file);
  } else {
    res.send("⚠️ frame.jpg not found (cloud won't have stream)");
  }
});

// ======================
// 🎥 VIDEO SWITCH
// ======================
let currentVideo = "video2.mp4";

app.get("/video", (req, res) => {
  res.json({ video: currentVideo });
});

app.post("/video", (req, res) => {
  currentVideo = req.body.video;

  try {
    fs.writeFileSync(
      path.resolve(__dirname, "../data/video.txt"),
      currentVideo
    );
  } catch (err) {
    console.log("⚠️ Failed to write video.txt:", err.message);
  }

  console.log("🎥 Switched video:", currentVideo);

  res.json({ status: "updated" });
});

// ======================
// 🚀 START SERVER (IMPORTANT)
// ======================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
