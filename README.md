# GridBricks · UK Day-Ahead Wind Forecasting & Accuracy Intelligence Platform

<div align="center">

![GridBricks Banner](https://img.shields.io/badge/Platform-GridBricks_Energy-111111?style=for-the-badge&logo=powerpages&logoColor=white)
<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB.svg?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React 18](https://img.shields.io/badge/React-18.x-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000.svg?style=flat-square&logo=vercel&logoColor=white)](https://quick-marimba-pskos20.tmp.now)

**A specialized, production-grade energy analytics platform built for UK electricity utilities trading power in the Day-Ahead wholesale market (N2EX / EPEX SPOT).**

[Live Application Demo](https://quick-marimba-pskos20.tmp.now) • [API Documentation](#6-api-documentation) • [System Architecture](#3-architecture--data-pipeline) • [Video Presentation Guide](#9-unlisted-youtube-video-deliverable)

</div>

---

## 1. Executive Summary & Commercial Context

### The Wholesale Trading Problem
Electricity suppliers in the United Kingdom are commercially required to match their consumer demand profiles 24/7 across 48 half-hour settlement periods every day. 
- **The Renewable Merit Order**: Wind energy operates at near-zero marginal cost. Maximizing wind power utilization lowers retail procurement costs.
- **The Day-Ahead Auction**: Day-Ahead electricity purchase bids must be finalized and submitted prior to **Gate Closure at 09:50 GMT on Day $D-1$** for delivery across all 48 settlement periods of Day $D$.
- **The Thermal Balancing Trade-Off**: Whatever demand remains uncovered by wind must be procured from thermal power stations (e.g., CCGT) or physical market power purchase agreements (PPAs).
- **The Information Asymmetry Trap (Lookahead Bias)**: Weather forecasting models update continuously. If an analytics tool evaluates past trading performance using forecasts published *after* 09:50 GMT on Day $D-1$ (e.g., intra-day forecasts or forecasts published on Day $D$), it commits lookahead bias. The trader did not possess this information when submitting financial commitments.

### The GridBricks Solution
GridBricks resolves this challenge by strictly implementing a **Point-in-Time "As-Of" Selection Engine**:
1. It ingests historical wind generation forecasts (`WINDFOR`) and metered actual generation (`FUELHH`) from official **Elexon BMRS** open-data streams.
2. For any given purchasing decision date in **January 2026**, it isolates only the forecasts published **on or before 09:50 GMT on Day $D-1$**.
3. It maps hourly Day-Ahead forecasts into all 48 half-hourly settlement periods using trading interpolation.
4. It computes quantitative error metrics (**MAE, RMSE, Forecast Bias, and WAPE**) to size thermal backup capacity and protect against multi-million-pound cash-out imbalance penalties.

---

## 2. Quantitative Accuracy Metrics & Trading Rules

GridBricks computes four core mathematical metrics across each delivery day and across the entire month of January 2026:

| Metric | Formula | Practical Commercial Meaning |
| :--- | :--- | :--- |
| **MAE**<br/>*(Mean Absolute Error)* | $$\text{MAE} = \frac{1}{n}\sum_{i=1}^n \|F_i - A_i\|$$ | Quantifies the **average volume deviation in MW** per settlement period regardless of direction. Direct baseline for expected volume miss. |
| **RMSE**<br/>*(Root Mean Squared Error)* | $$\text{RMSE} = \sqrt{\frac{1}{n}\sum_{i=1}^n (F_i - A_i)^2}$$ | Heavily penalizes large forecasting misses. Critical for detecting days with sudden wind ramps or extreme storm forecast drop-offs. |
| **Forecast Bias**<br/>*(Mean Directional Error)* | $$\text{Bias} = \frac{1}{n}\sum_{i=1}^n (F_i - A_i)$$ | **Directional exposure**: If $\text{Bias} > 0$, forecasts systematically overpredict wind, creating a **generation deficit** (traders must buy emergency power at high cash-out prices). If $\text{Bias} < 0$, forecasts underpredict, causing excess thermal procurement and spill. |
| **WAPE**<br/>*(Weighted Absolute % Error)* | $$\text{WAPE} = \frac{\sum \|F_i - A_i\|}{\sum A_i} \times 100\%$$ | Percentage error scaled against total actual wind energy produced. Avoids standard MAPE division-by-zero errors when wind generation approaches zero. |

### Procurement Decision Rule
$$\text{Recommended Thermal Backup Buffer (MW)} = \max\left(0, \text{Bias}\right) + 0.5 \times \text{RMSE}$$
When the platform detects positive bias, traders contract thermal reserves equal to the expected deficit plus an RMSE-scaled volatility margin to neutralize financial exposure.

---

## 3. Architecture & Data Pipeline

```
                                      ┌─────────────────────────────────────────┐
                                      │            Elexon BMRS API              │
                                      │  (Open Data Streams - No Auth Required) │
                                      └────────────────────┬────────────────────┘
                                                           │
                                        ┌──────────────────┴──────────────────┐
                                        ▼                                     ▼
                            ┌───────────────────────┐             ┌───────────────────────┐
                            │     FUELHH Stream     │             │    WINDFOR Stream     │
                            │  (fuelType == 'WIND') │             │ (Forecasts + PubTime) │
                            └───────────┬───────────┘             └───────────┬───────────┘
                                        │                                     │
                                        └──────────────────┬──────────────────┘
                                                           ▼
                                      ┌─────────────────────────────────────────┐
                                      │         DataEngine (FastAPI Backend)     │
                                      │                                         │
                                      │  1. Gate Closure Filter:                │
                                      │     publishTime <= D 09:50:00Z          │
                                      │  2. As-Of Selector:                     │
                                      │     max(publishTime) per startTime      │
                                      │  3. Resolution Harmonization:           │
                                      │     Hourly Nodes + 30-min Interpolation │
                                      │  4. Accuracy Metrics Engine:            │
                                      │     MAE, RMSE, Bias, WAPE, MWh Volume   │
                                      └────────────────────┬────────────────────┘
                                                           │
                                                           ▼
                                      ┌─────────────────────────────────────────┐
                                      │         REST API Endpoints (/api)       │
                                      │  /decision · /analysis · /dates · /sync │
                                      └────────────────────┬────────────────────┘
                                                           │
                                                           ▼
                                      ┌─────────────────────────────────────────┐
                                      │       React 18 + Vite Frontend          │
                                      │  - Product Overview (React Bits Hero)   │
                                      │  - Day-Ahead Decision Desk (Recharts)   │
                                      │  - 48 Settlement Ledger (CSV Export)    │
                                      │  - January 2026 Trajectory Review       │
                                      └─────────────────────────────────────────┘
```

### Domain Discovery: Resolution Harmonization
- **Actuals (`FUELHH`)**: Recorded in **30-minute settlement periods** (48 periods per 24-hour day).
- **Forecasts (`WINDFOR`)**: National Grid ESO issues Day-Ahead wind predictions at **1-hour resolution** (24 timestamps per day on the hour `:00`).
- **GridBricks Solution**: GridBricks supports dual-resolution analytics:
  1. **Native Hourly Nodes**: Direct comparison across the 24 hourly timestamps.
  2. **Full Trading Schedule**: Linearly interpolates the intermediate `:30` settlement periods so trading desks have an actionable 48-period dispatch schedule.

---

## 4. Key Platform Features

### 1. Executive Product Overview
- Clear onboarding walkthrough explaining the UK market rules, wind volume risk, and the 09:50 Gate Closure constraint.
- Animated typography powered by **React Bits (`SplitText`)**.
- Fast-track scenario launchers:
  - **Benchmark Decision**: January 14 decision for January 15 delivery.
  - **Best Forecast Accuracy Day**: January 18 (MAE: 767 MW, WAPE: 11.75%).
  - **Peak Volatility Day**: January 27 storm ramp-down miss (MAE: 5,349 MW, WAPE: 92.87%).

### 2. Day-Ahead Decision Desk
- Dynamic Date Picker for all 31 purchasing decision dates in January 2026.
- Interactive Recharts generation profile displaying the point-in-time forecast curve against metered actuals.
- Granularity toggle: **All 48 Periods (Trading)** vs **24 Hourly Nodes (Native)**.
- Executive KPI Bento Cards displaying MAE, RMSE, Forecast Bias, and WAPE with directional alerts.

### 3. Settlement Period Ledger (Periods 1 to 48)
- Complete half-hourly audit trail showing period number, target timestamp, forecast MW, actual MW, delta error, percentage error, resolution type (`Native Node` vs `Trading 30m`), and exact publication timestamp.
- **Export to CSV**: Instant download for integration into trading floor Excel spreadsheets and automated dispatch engines.

### 4. January 2026 Trajectory Review
- Month-at-a-glance bar chart tracking daily MAE and Bias across all 1,488 half-hour settlement periods.
- One-click drill-down: clicking any day bar navigates directly to that day's 48-period ledger.

---

## 5. File & Directory Structure

```
gridbricks/
├── backend/
│   ├── app/
│   │   ├── __init__.py               # Package marker
│   │   ├── main.py                   # FastAPI application, CORS & Lifespan handler
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   └── config.py             # Market settings (09:50 GMT Cutoff, 48 periods)
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── elexon.py             # Resilient Elexon BMRS API streaming client
│   │   │   ├── data_engine.py        # As-Of point-in-time selection & interpolation
│   │   │   └── metrics.py            # Quantitative mathematical engine (MAE, RMSE, Bias, WAPE)
│   │   └── api/
│   │       ├── __init__.py
│   │       └── routes.py             # REST routes (/decision, /analysis, /dates, /sync)
│   ├── data/
│   │   ├── actuals_wind_jan2026.json # Pre-cached January 2026 actuals (1,565 records)
│   │   └── forecasts_wind_jan2026.json# Pre-cached January 2026 forecasts (18,469 records)
│   ├── tests/
│   │   ├── test_api.py               # API health & endpoint schema tests
│   │   ├── test_data_engine.py       # Gate closure enforcement (zero lookahead verification)
│   │   └── test_metrics.py           # Unit tests validating MAE, RMSE, Bias, and WAPE
│   ├── Dockerfile                    # Production Python 3.12-slim multi-stage image
│   ├── Procfile                      # Process configuration for Heroku / Render
│   ├── requirements.txt              # Pinned backend Python dependencies
│   └── runtime.txt                   # Target Python runtime specification
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GenerationChart.tsx   # Synchronized Forecast vs Actual MW Recharts component
│   │   │   ├── Header.tsx            # Navigation, Gate Closure indicator, and Date picker
│   │   │   ├── Icons.tsx             # Custom technical SVG primitives (Minimalist UI)
│   │   │   ├── KpiGrid.tsx           # Asymmetrical Bento Grid of executive metrics
│   │   │   ├── MethodologyModal.tsx  # Trading mathematics & gate closure documentation
│   │   │   ├── MonthAnalysisView.tsx # 31-day January trajectory & benchmark review
│   │   │   ├── OverviewView.tsx      # Executive project overview & landing dashboard
│   │   │   ├── SettlementLedger.tsx  # 48-period half-hourly table with CSV export
│   │   │   └── SplitText.tsx         # Animated typography component from React Bits
│   │   ├── services/
│   │   │   └── api.ts                # Frontend API client
│   │   ├── types/
│   │   │   └── index.ts              # Strict TypeScript interface definitions
│   │   ├── App.tsx                   # Main SPA state container
│   │   ├── index.css                 # Minimalist typography & warm monochrome theme
│   │   └── main.tsx                  # React DOM mount point
│   ├── Dockerfile                    # Multi-stage Node 20 + Nginx Alpine container
│   ├── jsrepo.config.ts              # React Bits / jsrepo configuration
│   ├── nginx.conf                    # Nginx SPA router and reverse proxy configuration
│   ├── package.json                  # Frontend dependencies and scripts
│   ├── tailwind.config.js            # Editorial design tokens & pastel palettes
│   └── vercel.json                   # Vercel deployment configuration
├── docker-compose.yml                # Multi-container orchestration (ports 3000 & 8000)
├── render.yaml                       # Automated Render Blueprint for backend container
├── vercel.json                       # Root Vercel monorepo configuration
├── pytest.ini                        # Pytest discovery configuration
├── .env.example                      # Environment variables reference
├── .gitignore                        # Git ignore patterns
└── README.md                         # Comprehensive documentation
```

---

## 6. API Documentation

When the backend is running, interactive OpenAPI/Swagger documentation is available at `http://localhost:8000/docs`.

### Primary Endpoints
- `GET /api/health`: Returns server status, current version, gate closure default (`09:50:00`), and dataset cache count.
- `GET /api/dates`: Returns all 31 valid purchasing decision dates for January 2026.
- `GET /api/decision?date=2026-01-14&cutoff=09:50:00`: Returns point-in-time forecast and actual comparison for the delivery day, KPIs, and all 48 settlement periods.
- `GET /api/analysis?from=2026-01-01&to=2026-01-31`: Returns aggregate month-wide metrics, daily error breakdowns, and benchmark days.
- `POST /api/sync?force=false`: Triggers on-demand synchronization from Elexon BMRS streams.

---

## 7. How to Start the Application

### Option A: Run with Docker Compose (Recommended)
Ensure Docker Desktop is running, then run:
```bash
# Clone the repository
git clone https://github.com/sankalp250/gridbricks.git
cd gridbricks

# Build and start services
docker compose up --build
```
- **Web App Dashboard**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

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
Open [http://localhost:5173](http://localhost:5173) in your browser.

#### 3. Run Automated Tests
```bash
pytest backend/tests
```
All 10 unit tests will run and pass, confirming gate closure point-in-time enforcement and mathematical formulas.

---

## 8. Live Deployments

- **Live Frontend (Vercel)**: [https://quick-marimba-pskos20.tmp.now](https://quick-marimba-pskos20.tmp.now)
- **GitHub Repository**: [https://github.com/sankalp250/gridbricks](https://github.com/sankalp250/gridbricks)
- **Backend Blueprint**: Configured for Render via [`render.yaml`](./render.yaml)

---

## 9. Unlisted YouTube Video Deliverable

The submission requires an **unlisted YouTube video (maximum 10 minutes)** divided into two parts:

### Part 1: Client Presentation (Trading Desk Head) [0:00 – 4:45]
1. **Framing the Problem**: The role of wind generation in retail power supply and the financial risk of imbalance penalties under Day-Ahead Gate Closure (09:50 GMT on D-1).
2. **Product Walkthrough**:
   - Introduce the **Product Overview** page and the 3 core pillars.
   - Jump into the **Day-Ahead Decision Desk** for January 14 (Delivery: January 15).
   - Review the **Executive KPIs**: MAE (1,037 MW), Forecast Bias (+1,037 MW overforecasting), WAPE (9.8%).
   - Demonstrate the **Synchronized Chart** and toggle between 48 trading periods and 24 native nodes.
   - Inspect the **Settlement Ledger** and demonstrate the **Export to CSV** feature.
3. **January 2026 Review**: Highlight the best accuracy day (Jan 18, MAE 767 MW) vs the peak storm volatility day (Jan 27, MAE 5,349 MW).

### Part 2: Technical Lead Review (Architecture & Implementation) [4:45 – 9:30]
1. **Architecture & Stack**: React 18, TypeScript, Tailwind CSS, FastAPI, Pandas, Docker Compose.
2. **Lookahead Bias Prevention**: Code walkthrough of `backend/app/services/data_engine.py` (lines 75–115) showing the `publishTime <= cutoff` filter and `max(publishTime)` selection.
3. **Automated Test Suite**: Demonstrate `pytest backend/tests` passing all 10 unit tests, including test fixtures that deliberately attempt lookahead injection.
4. **Resolution Harmonization & Caching**: Explain how 1-hour WINDFOR data is interpolated for 30-minute FUELHH periods and how the pre-cached seed data enables instant zero-latency boots.
5. **Deployment & DevOps**: Review Docker Compose, `vercel.json`, and `render.yaml`.

---

## 10. AI Usage Disclosure

In compliance with the assignment instructions, generative AI tools (Google DeepMind Antigravity) were utilized to assist with:
- Initial architecture scaffolding and planning.
- Implementation of the React Minimalist UI components and Recharts visualizations.
- Test fixture authoring and documentation drafting.

All data processing logic, market timing rules (09:50 GMT Gate Closure), point-in-time "As-Of" filtering, and metric calculation formulas were verified and validated by the engineering team against official Elexon BMRS documentation.

---

<div align="center">
  <sub>Built with precision for UK Day-Ahead Power Trading Desks.</sub>
</div>
