# GridBricks · UK Day-Ahead Wind Forecasting & Accuracy Intelligence Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-brightgreen.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

> A full-stack energy analytics and quantitative decision platform designed for UK Day-Ahead wholesale power trading desks.

---

## 1. Problem Overview & Commercial Context

Electricity utilities serving UK retail customers must continuously balance expected power demand against generation portfolios. Wind energy provides near-zero marginal cost electricity, but weather intermittency introduces significant volume risk.

In the UK wholesale market:
- Day-Ahead power purchase commitments are submitted before **Gate Closure at 09:50 GMT** on Day $D-1$ for electricity delivery on Day $D$.
- Traders must rely on the **latest available renewable generation forecast published on or before the 09:50 GMT cutoff**.
- Any lookahead bias (evaluating decisions using forecasts published after gate closure) misrepresents the commercial information state of the trader.
- **GridBricks** solves this by strictly enforcing a point-in-time ("As-Of") forecast selection engine and quantitatively evaluating forecast accuracy against actual metered generation from **Elexon BMRS**.

---

## 2. Quantitative Accuracy Metrics

GridBricks calculates four core metrics across all 48 half-hour settlement periods per delivery day:

1. **MAE (Mean Absolute Error, in MW)**:
   $$\text{MAE} = \frac{1}{N} \sum_{i=1}^N |F_i - A_i|$$
   Measures average absolute error volume.

2. **RMSE (Root Mean Squared Error, in MW)**:
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N (F_i - A_i)^2}$$
   Penalizes severe forecast deviations, highlighting extreme volatility days.

3. **Forecast Bias (in MW)**:
   $$\text{Bias} = \frac{1}{N} \sum_{i=1}^N (F_i - A_i)$$
   Identifies systematic over-forecasting ($\text{Bias} > 0$, thermal deficit risk) or under-forecasting ($\text{Bias} < 0$, spill risk).

4. **WAPE (Weighted Absolute Percentage Error, in %)**:
   $$\text{WAPE} = \frac{\sum_{i=1}^N |F_i - A_i|}{\sum_{i=1}^N A_i} \times 100\%$$
   Normalizes absolute error relative to total actual wind volume, avoiding division-by-zero anomalies common with standard MAPE.

---

## 3. Architecture & Tech Stack

```
gridbricks/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application entrypoint & CORS
│   │   ├── core/
│   │   │   └── config.py        # Market parameters (09:50 GMT Gate Closure)
│   │   ├── services/
│   │   │   ├── elexon.py        # Elexon BMRS API client (FUELHH & WINDFOR streams)
│   │   │   ├── data_engine.py   # Point-in-time As-Of selection & actuals join
│   │   │   └── metrics.py       # MAE, RMSE, Bias, and WAPE mathematical engine
│   │   └── api/
│   │       └── routes.py        # REST endpoints (/decisions, /analysis, /dates)
│   ├── tests/                   # Pytest suite for point-in-time logic & metrics
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/                     # React + Vite + Tailwind CSS (Minimalist UI)
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 4. Quick Start (Local & Docker)

### Option A: Run with Docker Compose
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`

### Option B: Run Locally
**Backend**:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

---

## 5. Live Deployment
- **Frontend App**: *(Pending Deployment)*
- **API Documentation**: *(Pending Deployment)*

---

## 6. AI Usage Disclosure
In accordance with submission requirements, generative AI assistance (Google DeepMind Antigravity) was used for architecture scaffolding, automated code generation, and test creation. All data processing pipelines, market timing rules, and mathematical formulas were verified and validated by the engineering team.
