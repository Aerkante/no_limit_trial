from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import List, Optional
import math
import asyncio
import json
import random
import uuid

app = FastAPI()

class MuscleLoad(BaseModel):
    muscle: str
    activation: float
    intensity: float
    time: float

class SleepInput(BaseModel):
    mean_recovery_hrs: float
    strain: float

class InjuryRiskInput(BaseModel):
    acwr: float
    delta_hrv: float
    sleep_adequacy: float
    gsr_spikes: float

class InjuryProbInput(BaseModel):
    pass

class AIInput(BaseModel):
    muscle_loads: List[MuscleLoad] = Field(default_factory=list)
    sleep_input: SleepInput
    injury_risk_input: InjuryRiskInput
    injury_prob_input: Optional[InjuryProbInput] = None

def calculate_recovery_timer(muscle_loads: List[MuscleLoad]):
    k = 0.65
    grouped = {}
    for load in muscle_loads:
        grouped.setdefault(load.muscle, 0)
        grouped[load.muscle] += load.activation * load.intensity * load.time
    result = []
    for muscle, load in grouped.items():
        recovery_hours = k * (load ** 0.6)
        ready_at = "2025-08-08T19:30:00Z"
        result.append({
            "muscle": muscle,
            "hours_left": round(recovery_hours, 2),
            "ready_at": ready_at
        })
    return result

def calculate_sleep_needed(mean_recovery_hrs, strain):
    val = 7 + 0.5 * (mean_recovery_hrs / 12) + 0.3 * (strain / 10)
    sleep_goal = min(max(val, 6), 9)
    confidence = 0.72
    return {"sleep_goal_hours": round(sleep_goal, 2), "confidence": confidence}

def calculate_injury_risk(acwr, delta_hrv, sleep_adequacy, gsr_spikes):
    def sigmoid(x):
        return 1 / (1 + math.exp(-x))
    x = 1.8 * acwr + 1.2 * delta_hrv - 0.8 * sleep_adequacy + 1.0 * gsr_spikes
    risk_pct = sigmoid(x)
    if risk_pct < 0.33:
        band = "low"
    elif risk_pct < 0.66:
        band = "elevated"
    else:
        band = "high"
    return {"risk_pct": round(risk_pct, 2), "risk_band": band}

def calculate_injury_probability():
    prob_6w = 0.34
    peak_week = 3
    peak_week_dates = ["2025-08-28", "2025-09-03"]
    return {"prob_6w": prob_6w, "peak_week": peak_week, "peak_week_dates": peak_week_dates}

def generate_fake_data():
    muscles = ['quadriceps', 'hamstrings', 'calves', 'glutes', 'hipflexors']
    muscle_loads = []
    for m in muscles:
        muscle_loads.append({
            "muscle": m,
            "activation": round(random.uniform(0.4, 1.0), 2),
            "intensity": random.randint(1,5),
            "time": random.randint(5, 15)
        })
    sleep_input = {
        "mean_recovery_hrs": round(random.uniform(6, 10), 2),
        "strain": round(random.uniform(0, 5), 2)
    }
    injury_risk_input = {
        "acwr": round(random.uniform(0.5, 2.0), 2),
        "delta_hrv": round(random.uniform(-0.5, 0.5), 2),
        "sleep_adequacy": round(random.uniform(0.5, 1.0), 2),
        "gsr_spikes": round(random.uniform(0, 1), 2)
    }
    return {
        "muscle_loads": muscle_loads,
        "sleep_input": sleep_input,
        "injury_risk_input": injury_risk_input,
        "injury_prob_input": {}
    }

@app.post("/process")
async def process_ai(data: AIInput):
    recovery = calculate_recovery_timer(data.muscle_loads)
    mean_recovery_hrs = (
        sum([r["hours_left"] for r in recovery]) / len(recovery) if recovery else 0
    )
    sleep = calculate_sleep_needed(mean_recovery_hrs, data.sleep_input.strain)
    injury_risk = calculate_injury_risk(
        data.injury_risk_input.acwr,
        data.injury_risk_input.delta_hrv,
        data.injury_risk_input.sleep_adequacy,
        data.injury_risk_input.gsr_spikes,
    )
    injury_prob = calculate_injury_probability()
    return {
        "recovery_timer": recovery,
        "sleep_needed": sleep,
        "injury_risk": injury_risk,
        "injury_probability": injury_prob
    }

@app.get("/process/mock")
async def process_mock():
    fake_data = generate_fake_data()
    recovery = calculate_recovery_timer([MuscleLoad(**ml) for ml in fake_data['muscle_loads']])
    mean_recovery_hrs = (
        sum([r["hours_left"] for r in recovery]) / len(recovery) if recovery else 0
    )
    sleep = calculate_sleep_needed(mean_recovery_hrs, fake_data['sleep_input']['strain'])
    injury_risk = calculate_injury_risk(
        fake_data['injury_risk_input']['acwr'],
        fake_data['injury_risk_input']['delta_hrv'],
        fake_data['injury_risk_input']['sleep_adequacy'],
        fake_data['injury_risk_input']['gsr_spikes'],
    )
    injury_prob = calculate_injury_probability()
    return {
        "recovery_timer": recovery,
        "sleep_needed": sleep,
        "injury_risk": injury_risk,
        "injury_probability": injury_prob
    }

async def event_generator():
    while True:
        fake_data = generate_fake_data()
        recovery = calculate_recovery_timer([MuscleLoad(**ml) for ml in fake_data['muscle_loads']])
        mean_recovery_hrs = (
            sum([r["hours_left"] for r in recovery]) / len(recovery) if recovery else 0
        )
        sleep = calculate_sleep_needed(mean_recovery_hrs, fake_data['sleep_input']['strain'])
        injury_risk = calculate_injury_risk(
            fake_data['injury_risk_input']['acwr'],
            fake_data['injury_risk_input']['delta_hrv'],
            fake_data['injury_risk_input']['sleep_adequacy'],
            fake_data['injury_risk_input']['gsr_spikes'],
        )
        injury_prob = calculate_injury_probability()
        payload = json.dumps({
            "recovery_timer": recovery,
            "sleep_needed": sleep,
            "injury_risk": injury_risk,
            "injury_probability": injury_prob
        })
        yield f"data: {payload}\n\n"
        await asyncio.sleep(5)

@app.get("/stream")
async def stream():
    return StreamingResponse(event_generator(), media_type="text/event-stream")


def generate_consistent_batch(batch_size=3):
    sessions = []
    for _ in range(batch_size):
        session_id = str(uuid.uuid4())
        muscles = ['quadriceps', 'hamstrings', 'calves', 'glutes', 'hipflexors']
        muscle_loads = []
        total_load = 0
        for m in muscles:
            activation = round(random.uniform(0.4, 1.0), 2)
            intensity = random.randint(1,5)
            time = random.randint(5, 15)
            muscle_loads.append({
                "muscle": m,
                "activation": activation,
                "intensity": intensity,
                "time": time
            })
            total_load += activation * intensity * time

        k = 0.65
        recovery_hours = round(k * (total_load ** 0.6), 2)

        strain = round(min(total_load / 20, 5), 2)

        acwr = round(min(total_load / 30, 2.0), 2)
        delta_hrv = round(random.uniform(-0.3, 0.3), 2)
        sleep_adequacy = round(random.uniform(0.7, 1.0), 2)
        gsr_spikes = round(random.uniform(0, 0.8), 2)

        sessions.append({
            "session_id": session_id,
            "muscle_loads": muscle_loads,
            "recovery_hours": recovery_hours,
            "strain": strain,
            "injury_risk_input": {
                "acwr": acwr,
                "delta_hrv": delta_hrv,
                "sleep_adequacy": sleep_adequacy,
                "gsr_spikes": gsr_spikes
            }
        })
    return sessions

async def batch_event_generator():
    while True:
        batch = generate_consistent_batch()
        mean_recovery = sum(s['recovery_hours'] for s in batch) / len(batch)
        sleep = calculate_sleep_needed(mean_recovery, strain=batch[0]['strain'])
        injury_risks = []
        for s in batch:
            ir = calculate_injury_risk(
                s['injury_risk_input']['acwr'],
                s['injury_risk_input']['delta_hrv'],
                s['injury_risk_input']['sleep_adequacy'],
                s['injury_risk_input']['gsr_spikes'],
            )
            injury_risks.append({"session_id": s['session_id'], **ir})

        injury_prob = calculate_injury_probability()

        payload = json.dumps({
            "batch_sessions": batch,
            "sleep_needed": sleep,
            "injury_risks": injury_risks,
            "injury_probability": injury_prob
        })
        yield f"data: {payload}\n\n"
        await asyncio.sleep(5)

@app.get("/stream_batch")
async def stream_batch():
    return StreamingResponse(batch_event_generator(), media_type="text/event-stream")
