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
        origin: "*"
    }
});

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());

// ======================
// 🔥 STREAM FIX (IMPORTANT)
// ======================
const streamPath = path.resolve(__dirname, "../stream");

console.log("📁 Serving stream from:", streamPath);

app.use("/stream", express.static(streamPath));

// ======================
// DATA STORAGE
// ======================
const filePath = path.join(__dirname, "alerts.json");

let alerts = [];

// Load previous alerts
if (fs.existsSync(filePath)) {
    alerts = JSON.parse(fs.readFileSync(filePath));
}

// ======================
// 🔥 SOCKET CONNECTION
// ======================
io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    // Send existing alerts when user connects
    socket.emit("init_alerts", alerts);

    socket.on("disconnect", () => {
        console.log("🔴 Client disconnected:", socket.id);
    });
});

// ======================
// ROUTES
// ======================

// POST alert
app.post("/alert", (req, res) => {
    const alert = req.body;

    alerts.push(alert);

    fs.writeFileSync(filePath, JSON.stringify(alerts, null, 2));

    console.log("🚨 Stored Alert:", alert);

    // 🔥 REAL-TIME BROADCAST
    io.emit("new_alert", alert);

    res.send("Stored");
});

// GET alerts
app.get("/alerts", (req, res) => {
    res.json(alerts);
});

// ======================
// 🔥 DEBUG ROUTE
// ======================
app.get("/test", (req, res) => {
    const file = path.resolve(__dirname, "../stream/frame.jpg");

    console.log("🧪 Testing file:", file);

    if (fs.existsSync(file)) {
        res.sendFile(file);
    } else {
        res.send("❌ frame.jpg not found");
    }
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

    // Optional: write to file so Python can read
    fs.writeFileSync(
        path.resolve(__dirname, "../data/video.txt"),
        currentVideo
    );

    console.log("🎥 Switched video:", currentVideo);

    res.send("Updated");
});

// ======================
// START SERVER
// ======================
server.listen(5000, () => {
    console.log("✅ Backend running at http://localhost:5000");
    console.log("🎥 Stream URL: http://localhost:5000/stream/frame.jpg");
    console.log("🧪 Test URL: http://localhost:5000/test");
});