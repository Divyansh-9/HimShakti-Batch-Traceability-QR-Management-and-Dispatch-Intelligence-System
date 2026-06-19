# HimShakti Batch Traceability, QR Management, and Dispatch Intelligence System

![Deliverable 1 Complete](https://img.shields.io/badge/Status-Deliverable%201%20Complete-success)

This repository contains the documentation and phase-wise planning reports for the **Batch Traceability, QR Management, and Dispatch Intelligence System**, developed for HimShakti Food Processing.

## Quick Start (Frontend)

To run the frontend React application locally:

```bash
cd frontend
npm install
npm run dev
```

### UI Features
- **Responsive Dashboard Layout:** Adapts to mobile and desktop automatically.
- **Dark/Light Mode:** Includes a fully animated toggle using `lucide-react` icons. User preferences are saved across sessions via `localStorage`.
- **Custom Components Library:** Reusable, modern UI elements including interactive Modals and Toasts via `react-hot-toast`.

## Documentation Structure

The documentation follows the Software Development Life Cycle (SDLC) process and is structured into the following phases:

| Phase | Document | Location | Description |
| :--- | :--- | :--- | :--- |
| **Phase 2** | Planning Report | [`intern-2/planning_report.md`](./intern-2/planning_report.md) | Initial problem statement, user personas, and project scope. |
| **Phase 3** | System Design | [`final_project_report.md`](./final_project_report.md) | System architecture, MongoDB schemas, and AI integration flows. |
| **Phase 4** | SRS | [`intern-2/srs.md`](./intern-2/srs.md) | Software Requirements Specification, functional & non-functional constraints. |
| **Phase 5** | Implementation Plan | [`intern-2/implementation_plan.md`](./intern-2/implementation_plan.md) | 6-week step-by-step build schedule, test strategy, and deployment guide. |

### Directory Overview
- `/frontend`: The React (Vite) application scaffold.
- `/backend`: The Express server (stubbed for now).
- `/shared`: Shared DB contracts and schemas between services.
- `/intern-2`: Contains intern-specific requirement, planning, and implementation files.
- `/`: Root directory hosting the system design / final project report.

## Note
Code implementation for the backend and frontend modules is organized under `backend/` and `frontend/` directories as per Phase 5 of the Implementation Plan.
