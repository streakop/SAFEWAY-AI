const cors = require("cors");
const express = require("express");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

// CREATE HTTP SERVER + SOCKET.IO
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: "10mb" })); // increase limit for image data

// ======================
// STREAM (LOCAL FALLBACK)
// ======================
const streamPath = path.resolve(__dirname, "../stream");

if (fs.existsSync(streamPath)) {
  app.use("/stream", express.static(streamPath));
}

// ======================
// IN-MEMORY FRAME STORE (CLOUD STREAM)
// ======================
let latestFrames = {}; // { cam_1: base64, cam_2: base64 }

// RECEIVE FRAME FROM PYTHON
app.post("/frame", (req, res) => {
  const { cameraId, image } = req.body;

  if (!cameraId || !image) {
    return res.status(400).json({ error: "Missing cameraId or image" });
  }

  latestFrames[cameraId] = image;

  res.json({ status: "frame stored" });
});

// SERVE FRAME TO FRONTEND
app.get("/frame/:cameraId", (req, res) => {
  const cam = req.params.cameraId;

  if (!latestFrames[cam]) {
    return res.status(404).send("No frame available");
  }

  const imgBuffer = Buffer.from(latestFrames[cam], "base64");

  res.setHeader("Content-Type", "image/jpeg");
  res.send(imgBuffer);
});

// ======================
// DATA STORAGE
// ======================
const filePath = path.join(__dirname, "alerts.json");

let alerts = [];

try {
  if (fs.existsSync(filePath)) {
    alerts = JSON.parse(fs.readFileSync(filePath));
  }
} catch (err) {
  console.log("Error reading alerts.json:", err.message);
  alerts = [];
}

// ======================
// SOCKET CONNECTION
// ======================
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.emit("init_alerts", alerts);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// ======================
// ROUTES
// ======================

// POST alert
app.post("/alert", (req, res) => {
  const alert = req.body;

  alerts.push(alert);

  try {
    fs.writeFileSync(filePath, JSON.stringify(alerts, null, 2));
  } catch (err) {
    console.log("Failed to write alerts.json:", err.message);
  }

  io.emit("new_alert", alert);

  res.json({ status: "ok" });
});

// GET alerts
app.get("/alerts", (req, res) => {
  res.json(alerts);
});

// DEBUG ROUTE
app.get("/test", (req, res) => {
  res.send("Backend working");
});

// ======================
// VIDEO SWITCH
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
    console.log("Failed to write video.txt:", err.message);
  }

  res.json({ status: "updated" });
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
