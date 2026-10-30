# GridBricks · UK Day-Ahead Wind Forecasting & Accuracy Intelligence Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-brightgreen.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

> A production-grade energy analytics platform designed for UK electricity trading desks purchasing power in the Day-Ahead wholesale market (N2EX / EPEX SPOT). Evaluates renewable wind generation forecasts against outturn metered actuals from **Elexon BMRS** with **strict 09:50 GMT Gate Closure point-in-time enforcement (zero lookahead bias)**.

---

## 1. Executive Commercial Summary

### The Trading Problem
A UK electricity utility must procure power from wholesale markets to continuously match consumer electricity demand:
- **Renewable Merit Order**: Wind power operates with near-zero marginal fuel costs. The trading desk needs to prioritize wind generation and procure remaining demand from thermal/market sources.
- **The Day-Ahead Market Auction**: Final purchase bids for Delivery Day $D$ must be submitted by **09:50 GMT on Day $D-1$** (Gate Closure).
- **The Information Asymmetry Trap (Lookahead Bias)**: Weather forecast models update continuously throughout the day. If a model or analytics dashboard assesses historical decisions using forecasts published *after* 09:50 GMT on $D-1$ (e.g. on delivery day $D$), it commits lookahead bias and misrepresents what the trader actually knew at the time of the financial commitment.

### The GridBricks Solution
GridBricks enforces a **Point-in-Time "As-Of" Selection Engine**:
1. For any selected decision date $D$ in January 2026, it filters out all forecasts published after $D$ 09:50:00 GMT.
2. For each delivery settlement period on Day $D+1$, it selects the latest available forecast published on or before gate closure.
3. It joins these forecasts against metered actual generation from Elexon BMRS (`FUELHH` stream filtered for `fuelType == 'WIND'`).
4. It computes quantitative error metrics (MAE, RMSE, Bias, WAPE) so traders can size thermal backup buffers and prevent cash-out imbalance penalties.

---

## 2. Quantitative Accuracy Metrics

| Metric | Formula | Practical Trading Interpretation |
| :--- | :--- | :--- |
| **MAE** (Mean Absolute Error) | $\text{MAE} = \frac{1}{n}\sum \|F_i - A_i\|$ | Average absolute MW deviation per settlement period. |
| **RMSE** (Root Mean Squared Error) | $\text{RMSE} = \sqrt{\frac{1}{n}\sum (F_i - A_i)^2}$ | Strongly penalizes extreme volatility and sudden ramp-rate misses. |
| **Forecast Bias** | $\text{Bias} = \frac{1}{n}\sum (F_i - A_i)$ | **Directional risk**: $\text{Bias} > 0$ indicates systematic overforecasting (thermal deficit / imbalance buy penalty risk); $\text{Bias} < 0$ indicates underforecasting (excess thermal / spill risk). |
| **WAPE** | $\text{WAPE} = \frac{\sum \|F_i - A_i\|}{\sum A_i} \times 100\%$ | Normalized volume error relative to total actual wind generation (avoids MAPE divide-by-zero errors). |

---

## 3. Directory & File Structure

```
gridbricks/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI application entrypoint & Lifespan handler
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py             # Market settings (09:50 GMT Cutoff, 48 settlement periods)
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── elexon.py             # Elexon BMRS streaming API client (FUELHH & WINDFOR)
│   │   │   ├── data_engine.py        # Point-in-Time As-Of selection & settlement interpolation
│   │   │   └── metrics.py            # Mathematical engine for MAE, RMSE, Bias, and WAPE
│   │   └── api/
│   │       ├── __init__.py
│   │       └── routes.py             # REST endpoints (/api/decision, /api/analysis, /api/dates)
│   ├── data/
│   │   ├── actuals_wind_jan2026.json # Pre-cached January 2026 actuals (1,565 records)
│   │   └── forecasts_wind_jan2026.json# Pre-cached January 2026 forecasts (18,469 records)
│   ├── tests/
│   │   ├── test_api.py               # Endpoint schemas & HTTP response tests
│   │   ├── test_data_engine.py       # Gate closure cutoff enforcement (zero lookahead bias)
│   │   └── test_metrics.py           # Mathematical verification of MAE, RMSE, Bias, and WAPE
│   ├── Dockerfile                    # Python 3.12-slim container definition
│   ├── Procfile                      # Web process definition for Heroku / Render
│   ├── requirements.txt              # Production Python dependencies
│   └── runtime.txt                   # Python runtime specification
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GenerationChart.tsx   # Recharts synchronized forecast vs actual profile
│   │   │   ├── Header.tsx            # Navigation, Gate Closure badge, and Date Picker
│   │   │   ├── Icons.tsx             # Custom technical SVG primitives (Minimalist UI)
│   │   │   ├── KpiGrid.tsx           # Asymmetrical bento grid of executive KPIs
│   │   │   ├── MethodologyModal.tsx  # Trading mathematics & gate closure documentation
│   │   │   ├── MonthAnalysisView.tsx # January 2026 daily error trajectory & benchmark
│   │   │   └── SettlementLedger.tsx  # 48-period half-hourly table with CSV export
│   │   ├── services/
│   │   │   └── api.ts                # Frontend API client
│   │   ├── types/
│   │   │   └── index.ts              # Strict TypeScript definitions
│   │   ├── App.tsx                   # Main SPA container
│   │   ├── index.css                 # Minimalist typography & warm monochrome theme
│   │   └── main.tsx
│   ├── Dockerfile                    # Multi-stage Node 20 + Nginx Alpine build
│   ├── nginx.conf                    # Nginx SPA router and reverse proxy
│   ├── package.json
│   ├── tailwind.config.js            # Minimalist editorial theme tokens
│   └── vercel.json                   # Vercel deployment configuration
├── docker-compose.yml                # Multi-container orchestration (ports 3000 & 8000)
├── pytest.ini                        # Pytest configuration
├── vercel.json                       # Root Vercel monorepo configuration
├── .env.example                      # Environment variables reference
├── .gitignore                        # Git ignore patterns
└── README.md                         # Project documentation
```

---

## 4. How to Start the Application

### Option A: Run with Docker Compose (Recommended)
Make sure Docker Desktop is running, then clone and execute:
```bash
git clone https://github.com/sankalp250/gridbricks.git
cd gridbricks
docker compose up --build
```
- **Frontend Dashboard**: Open [http://localhost:3000](http://localhost:3000)
- **FastAPI Interactive Docs**: Open [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Healthcheck**: Open [http://localhost:8000/api/health](http://localhost:8000/api/health)

### Option B: Run Locally (Bare Metal)

#### 1. Backend Setup
```bash
cd backend
python -m venv .venv

# On Linux / macOS:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173).

#### 3. Run Backend Test Suite
```bash
pytest backend/tests
```
All 10 tests will execute, validating gate closure point-in-time enforcement and quantitative formulas.

---

## 5. Live Deployment Links

- **Repository**: [https://github.com/sankalp250/gridbricks](https://github.com/sankalp250/gridbricks)
- **Vercel Frontend**: *(Deployable via Vercel GitHub integration connected to `sankalp250/gridbricks`)*
- **API Documentation**: `http://localhost:8000/docs`

---

## 6. AI Usage Disclosure

In compliance with the assignment instructions, generative AI tools (Google DeepMind Antigravity) were utilized for:
- Initial codebase scaffolding and architectural planning.
- Implementation of the React Minimalist UI design system and Recharts componentry.
- Accelerated automated test authoring and documentation drafting.

All data parsing logic, market timing rules (09:50 GMT Gate Closure), point-in-time "As-Of" filtering, and metric calculation formulas were validated and verified against official Elexon BMRS specifications.
