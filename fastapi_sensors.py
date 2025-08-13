import asyncio
import time
import math
import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ADONIS_WS_ENDPOINT = "http://localhost:3333/sensor-batch"

def now_ms():
    return int(time.time() * 1000)

def nrand(s=0.02):
    return s * random.uniform(-1,1)

SENSORS = {
    "emg_right_v": {"uuid": "19B10001-E8F2-537E-4F6C-D104768A1214", "label":"EMG Right"},
    "emg_left_v":  {"uuid": "19B10002-E8F2-537E-4F6C-D104768A1214", "label":"EMG Left"},
    "gsr_uS":      {"uuid": "19B10003-E8F2-537E-4F6C-D104768A1214", "label":"GSR (Sweat)"},
    "temp_c":      {"uuid": "19B10004-E8F2-537E-4F6C-D104768A1214", "label":"Skin Temp"},
    "rh_pct":      {"uuid": "19B10005-E8F2-537E-4F6C-D104768A1214", "label":"Humidity"},
    "accel_ms2":   {"uuid": "19B10006-E8F2-537E-4F6C-D104768A1214", "label":"IMU Accel"},
    "gyro_dps":    {"uuid": "19B10007-E8F2-537E-4F6C-D104768A1214", "label":"IMU Gyro"},
}

async def generate_sensor_data():
    t_emg = t_gsr = t_env = t_imu = now_ms()
    while True:
        t = now_ms()
        batch = []

        # EMG Right + Left (50Hz)
        if t - t_emg >= 40:
        # if t - t_emg >= 20:
            t_emg = t
            base_r = 1.5
            base_l = 1.5
            emgR = base_r + 0.20*math.sin(t*0.02) + nrand(0.03)
            emgL = base_l + 0.18*math.cos(t*0.025) + nrand(0.03)
            batch.append({"ts": t, "uuid": SENSORS["emg_right_v"]["uuid"], "label": SENSORS["emg_right_v"]["label"], "value": round(emgR,3)})
            batch.append({"ts": t, "uuid": SENSORS["emg_left_v"]["uuid"],  "label": SENSORS["emg_left_v"]["label"],  "value": round(emgL,3)})

        # GSR (10Hz)
        if t - t_gsr >= 200:
        # if t - t_gsr >= 100:
            t_gsr = t
            gsr = 8.0 + 2.0*math.sin(t*0.0015) + nrand(0.3)
            gsr = max(0.5, gsr)
            batch.append({"ts": t, "uuid": SENSORS["gsr_uS"]["uuid"], "label": SENSORS["gsr_uS"]["label"], "value": round(gsr,3)})

        # Temp/Humidity (1Hz)
        if t - t_env >= 2000:
        # if t - t_env >= 1000:
            t_env = t
            temp = 33.5 + 0.2*math.sin(t*0.0008) + nrand(0.05)
            rh = 40.0 + 3.0*math.sin(t*0.0005) + nrand(0.3)
            batch.append({"ts": t, "uuid": SENSORS["temp_c"]["uuid"], "label": SENSORS["temp_c"]["label"], "value": round(temp,2)})
            batch.append({"ts": t, "uuid": SENSORS["rh_pct"]["uuid"], "label": SENSORS["rh_pct"]["label"], "value": round(rh,2)})

        # IMU Accel/Gyro (25Hz)
        if t - t_imu >= 80:
        # if t - t_imu >= 40:
            t_imu = t
            ax = 0.1*math.sin(t*0.01) + nrand(0.02)
            ay = 0.1*math.cos(t*0.009) + nrand(0.02)
            az = 9.81 + 0.1*math.sin(t*0.008) + nrand(0.02)
            gx = 1.0*math.sin(t*0.012) + nrand(0.1)
            gy = 0.8*math.cos(t*0.011) + nrand(0.1)
            gz = 0.5*math.sin(t*0.013) + nrand(0.1)
            batch.append({"ts": t, "uuid": SENSORS["accel_ms2"]["uuid"], "label": SENSORS["accel_ms2"]["label"], "value":[round(ax,3), round(ay,3), round(az,3)]})
            batch.append({"ts": t, "uuid": SENSORS["gyro_dps"]["uuid"], "label": SENSORS["gyro_dps"]["label"], "value":[round(gx,3), round(gy,3), round(gz,3)]})

        if batch:
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(ADONIS_WS_ENDPOINT, json={"batch": batch})
            except Exception as e:
                print("Erro enviando batch:", e)

        await asyncio.sleep(0.01)

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(generate_sensor_data())
