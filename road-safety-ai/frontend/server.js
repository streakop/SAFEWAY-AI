const express = require("express");
const app = express();

const BACKEND = "http://localhost:5000";

app.get("/", async (req, res) => {
    try {
        const response = await fetch(`${BACKEND}/alerts`);
        const alerts = await response.json();

        const total = alerts.length;
        const high = alerts.filter(a => a.severity === "HIGH").length;
        const medium = alerts.filter(a => a.severity === "MEDIUM").length;

        let html = `
        <html>
        <head>
            <title>Road Safety AI Dashboard</title>
            <meta http-equiv="refresh" content="2">

            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Segoe UI', sans-serif;
                }

                body {
                    background: linear-gradient(135deg, #0f172a, #020617);
                    color: white;
                    padding: 30px;
                }

                h1 {
                    font-size: 32px;
                    margin-bottom: 20px;
                    color: #38bdf8;
                }

                .stats {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .card {
                    flex: 1;
                    padding: 20px;
                    border-radius: 15px;
                    background: #1e293b;
                    box-shadow: 0 0 20px rgba(0,0,0,0.3);
                    transition: 0.3s;
                }

                .card:hover {
                    transform: translateY(-5px);
                }

                .card h2 {
                    font-size: 18px;
                    color: #94a3b8;
                }

                .card p {
                    font-size: 28px;
                    margin-top: 10px;
                }

                .total { border-left: 5px solid #38bdf8; }
                .high { border-left: 5px solid #ef4444; }
                .medium { border-left: 5px solid #f59e0b; }

                .alerts {
                    margin-top: 20px;
                }

                .alert-card {
                    background: #1e293b;
                    padding: 15px;
                    margin-bottom: 15px;
                    border-radius: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: 0.2s;
                }

                .alert-card:hover {
                    background: #334155;
                }

                .left {
                    display: flex;
                    flex-direction: column;
                }

                .location {
                    font-size: 18px;
                    font-weight: bold;
                }

                .time {
                    font-size: 12px;
                    color: #94a3b8;
                }

                .severity {
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                }

                .HIGH {
                    background: #ef4444;
                }

                .MEDIUM {
                    background: #f59e0b;
                }

            </style>
        </head>

        <body>

        <h1>🚦 Road Safety AI Dashboard</h1>

        <div class="stats">
            <div class="card total">
                <h2>Total Alerts</h2>
                <p>${total}</p>
            </div>

            <div class="card high">
                <h2>High Severity</h2>
                <p>${high}</p>
            </div>

            <div class="card medium">
                <h2>Medium Severity</h2>
                <p>${medium}</p>
            </div>
        </div>

        <div class="alerts">
        `;

        alerts.slice().reverse().forEach(alert => {
            html += `
            <div class="alert-card">
                <div class="left">
                    <div class="location">📍 ${alert.location}</div>
                    <div class="time">⏱ ${alert.time}</div>
                </div>
                <div class="severity ${alert.severity}">
                    ${alert.severity}
                </div>
            </div>
            `;
        });

        html += `
        </div>
        </body>
        </html>
        `;

        res.send(html);

    } catch (err) {
        res.send("Error loading dashboard");
    }
});

app.listen(3000, () => {
    console.log("🌐 Dashboard running at http://localhost:3000");
});