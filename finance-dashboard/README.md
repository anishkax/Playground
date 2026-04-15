# Ledgerly — Finance Dashboard

A beautiful, modern finance dashboard built with **React + Vite + TypeScript + Tailwind CSS**.

![Finance Dashboard](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss&logoColor=white)

## ✨ Features

- **Dark glassmorphism UI** — dark gradient background with frosted glass panels
- **Sidebar navigation** — Overview, Transactions, Budgets, Investments, Reports
- **KPI / Stat cards** — Net Worth, Income, Spending with sparkline charts
- **Cashflow panel** — per-account balances with progress bars
- **Recent transactions** — colour-coded by category (Income, Bills, Food, Shopping, Transfers)
- **Budget tracker** — spending vs limit progress bars with warning colours
- **Card summary** — virtual card panel with utilization, due date, rewards
- **Account health** — 2FA status, linked banks, last login
- **Fully responsive** — adapts to mobile and desktop layouts
- **Frontend-only** — 100% mock data, no backend required

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ (comes with Node)

### Install & run

```bash
# 1. Navigate to the dashboard folder
cd finance-dashboard

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for production

```bash
npm run build       # Outputs to finance-dashboard/dist/
npm run preview     # Preview the production build locally
```

## 📁 Project Structure

```
finance-dashboard/
├── index.html              # HTML entry point
├── package.json
├── vite.config.ts          # Vite config (React plugin)
├── tailwind.config.js      # Tailwind content paths
├── postcss.config.js       # PostCSS (Tailwind + Autoprefixer)
├── tsconfig.json
├── tsconfig.node.json
└── src/
    ├── main.tsx            # React entry point
    ├── index.css           # Tailwind directives + global styles
    └── App.tsx             # Full dashboard UI (single-file, self-contained)
```

## 🛠️ Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI framework |
| Vite | 5 | Dev server & bundler |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 3 | Utility-first styling |

## 📝 Notes

- All data is mocked inside `src/App.tsx` — see `TRANSACTIONS` and `BUDGETS` arrays.
- To connect a real backend, replace the mock arrays with API calls.
- The sidebar navigation updates the page title but all views show the same dashboard (extend as needed).
