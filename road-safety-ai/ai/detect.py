import cv2
from ultralytics import YOLO
import requests
import time
import math
import random
import os
import sys
import base64

# CAMERA CONFIG
CAMERA_ID = sys.argv[1] if len(sys.argv) > 1 else "cam_1"

# PATHS
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

VIDEO_MAP = {
    "cam_1": "video1.mp4",
    "cam_2": "video2.mp4",
    "cam_3": "video3.mp4"
}

video_file = VIDEO_MAP.get(CAMERA_ID, "video1.mp4")
VIDEO_PATH = os.path.join(BASE_DIR, f"../videos/{video_file}")

# BACKEND URL (FIXED)
BACKEND_URL = "https://safeway-ai-production.up.railway.app"

# MODEL
model = YOLO("yolov8n.pt")

cap = cv2.VideoCapture(VIDEO_PATH)

last_alert_time = 0
prev_frame = None

# FAKE LOCATIONS
locations = [
    "Bhopal Highway",
    "Indore Junction",
    "Delhi Expressway",
    "Mumbai Link Road",
    "Campus Main Gate"
]

# ---------------------
# SEND ALERT
# ---------------------
def send_alert(vehicle_count):
    global last_alert_time

    if time.time() - last_alert_time < 5:
        return

    last_alert_time = time.time()

    severity = "HIGH" if vehicle_count > 4 else "MEDIUM"
    location = random.choice(locations)

    alert_data = {
        "cameraId": CAMERA_ID,
        "location": location,
        "severity": severity,
        "time": time.ctime()
    }

    try:
        res = requests.post(f"{BACKEND_URL}/alert", json=alert_data)
        print("Alert sent:", res.status_code)
    except Exception as e:
        print("Alert failed:", e)

# ---------------------
# SEND FRAME
# ---------------------
def send_frame(frame):
    try:
        _, buffer = cv2.imencode(".jpg", frame)
        img_base64 = base64.b64encode(buffer).decode("utf-8")

        res = requests.post(
            f"{BACKEND_URL}/frame",
            json={
                "cameraId": CAMERA_ID,
                "image": img_base64
            }
        )

        print("Frame sent:", res.status_code)

    except Exception as e:
        print("Frame send failed:", e)

# ---------------------
# HELPERS
# ---------------------
def get_center(box):
    x1, y1, x2, y2 = box
    return (int((x1 + x2)/2), int((y1 + y2)/2))

def distance(p1, p2):
    return math.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2)

# ---------------------
# MAIN LOOP
# ---------------------
print(f"Starting detection for {CAMERA_ID}")

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        print(f"Video ended for {CAMERA_ID}")
        break

    # MOTION DETECTION
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    gray = cv2.GaussianBlur(gray, (5,5), 0)

    motion_detected = False

    if prev_frame is not None:
        diff = cv2.absdiff(prev_frame, gray)
        _, thresh = cv2.threshold(diff, 25, 255, cv2.THRESH_BINARY)

        if thresh.sum() > 500000:
            motion_detected = True

    prev_frame = gray

    # YOLO DETECTION
    results = model(frame)
    boxes = results[0].boxes

    vehicle_count = 0
    boxes_xy = []

    if boxes is not None:
        for i, cls in enumerate(boxes.cls):
            if int(cls) in [2,3,5,7]:
                vehicle_count += 1
                boxes_xy.append(boxes.xyxy[i].tolist())

    # COLLISION DETECTION
    accident_detected = False

    for i in range(len(boxes_xy)):
        for j in range(i+1, len(boxes_xy)):
            c1 = get_center(boxes_xy[i])
            c2 = get_center(boxes_xy[j])

            if distance(c1, c2) < 50:
                accident_detected = True

    # ALERT
    if accident_detected and motion_detected and vehicle_count > 2:
        print(f"ACCIDENT DETECTED on {CAMERA_ID}")
        send_alert(vehicle_count)

        cv2.putText(frame, "ACCIDENT ALERT!", (50,100),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0,0,255), 4)

    # UI
    cv2.putText(frame, f"{CAMERA_ID} | Vehicles: {vehicle_count}", (20,50),
                cv2.FONT_HERSHEY_SIMPLEX, 1, (255,0,0), 2)

    annotated = results[0].plot()
    final = cv2.addWeighted(annotated, 0.8, frame, 0.2, 0)

    # SEND FRAME TO CLOUD
    send_frame(final)

    # Optional local display
    cv2.imshow(CAMERA_ID, final)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

    # Limit FPS (important)
    time.sleep(0.2)

cap.release()
cv2.destroyAllWindows()
