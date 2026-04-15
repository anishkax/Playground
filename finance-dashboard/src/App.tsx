import { useMemo, useState, useId } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  TrendingUp,
  TrendingDown,
  BarChart2,
  Search,
  Bell,
  Plus,
  Minus,
  CreditCard,
  Shield,
  Settings,
  ChevronRight,
  Building2,
  Utensils,
  ShoppingBag,
  Receipt,
  AlertTriangle,
  Wallet,
  Download,
  type LucideIcon,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = "Income" | "Bills" | "Food" | "Shopping" | "Transfers";
type Account = "Checking" | "Savings" | "Card";
type TxnStatus = "completed" | "pending";

interface Txn {
  id: string;
  merchant: string;
  category: Category;
  amount: number; // positive = income, negative = expense
  date: string;
  account: Account;
  status: TxnStatus;
}

interface Budget {
  name: string;
  used: number;
  limit: number;
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const currency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const TRANSACTIONS: Txn[] = [
  { id: "t1", merchant: "Payroll Deposit",    category: "Income",    amount:  3450.00, date: "2026-04-12", account: "Checking", status: "completed" },
  { id: "t2", merchant: "Monthly Rent",       category: "Bills",     amount: -1850.00, date: "2026-04-01", account: "Checking", status: "completed" },
  { id: "t3", merchant: "Whole Foods Market", category: "Food",      amount:  -132.54, date: "2026-04-10", account: "Card",     status: "completed" },
  { id: "t4", merchant: "Blue Bottle Coffee", category: "Food",      amount:    -8.75, date: "2026-04-13", account: "Card",     status: "completed" },
  { id: "t5", merchant: "Transfer to Savings",category: "Transfers", amount:  -500.00, date: "2026-04-08", account: "Checking", status: "completed" },
  { id: "t6", merchant: "Savings Interest",   category: "Income",    amount:    14.22, date: "2026-04-02", account: "Savings",  status: "completed" },
  { id: "t7", merchant: "Netflix Subscription",category: "Bills",    amount:   -17.99, date: "2026-04-05", account: "Card",     status: "pending"   },
  { id: "t8", merchant: "Amazon Purchase",    category: "Shopping",  amount:   -89.49, date: "2026-04-09", account: "Card",     status: "pending"   },
];

const BUDGETS: Budget[] = [
  { name: "Food & Dining",    used: 312,  limit: 500  },
  { name: "Shopping",         used: 220,  limit: 350  },
  { name: "Bills & Utilities",used: 1868, limit: 2000 },
];

const SPARKLINES: Record<string, number[]> = {
  netWorth: [22, 24, 24, 26, 25, 28, 30, 31, 35, 34, 38, 40],
  income:   [10, 12, 12, 13, 15, 15, 16, 16, 18, 18, 19, 20],
  spending: [18, 18, 17, 17, 16, 15, 15, 14, 14, 14, 13, 12],
};

const BALANCE_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  Category,
  { icon: LucideIcon; color: string; bg: string; border: string }
> = {
  Income:    { icon: Building2,      color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  Bills:     { icon: Receipt,        color: "text-rose-400",    bg: "bg-rose-500/10",    border: "border-rose-500/20"    },
  Food:      { icon: Utensils,       color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/20"   },
  Shopping:  { icon: ShoppingBag,    color: "text-violet-400",  bg: "bg-violet-500/10",  border: "border-violet-500/20"  },
  Transfers: { icon: ArrowLeftRight, color: "text-sky-400",     bg: "bg-sky-500/10",     border: "border-sky-500/20"     },
};

// ─── Sparkline SVG ────────────────────────────────────────────────────────────
function Sparkline({ points }: { points: number[] }) {
  const uid = useId();
  const { linePath, areaPath } = useMemo(() => {
    const W = 120, H = 36, PAD = 3;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const rng = Math.max(1e-6, max - min);
    const pts = points.map((p, i) => ({
      x: PAD + (i * (W - PAD * 2)) / (points.length - 1),
      y: PAD + (1 - (p - min) / rng) * (H - PAD * 2),
    }));
    const linePath = pts
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
      .join(" ");
    const areaPath =
      linePath +
      ` L${pts[pts.length - 1].x.toFixed(2)},${(H - PAD).toFixed(2)}` +
      ` L${pts[0].x.toFixed(2)},${(H - PAD).toFixed(2)} Z`;
    return { linePath, areaPath };
  }, [points]);

  return (
    <svg width="120" height="36" viewBox="0 0 120 36" aria-hidden="true">
      <defs>
        <linearGradient id={`sg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#818cf8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0"    />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${uid})`} />
      <path
        d={linePath}
        fill="none"
        stroke="#818cf8"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Balance-over-time chart ──────────────────────────────────────────────────
function BalanceChart() {
  const data   = SPARKLINES.netWorth;
  const W = 460, H = 170;
  const padL = 46, padR = 12, padT = 14, padB = 30;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;
  const yMin = 18, yMax = 44;
  const yTicks = [20, 25, 30, 35, 40];

  const sx = (i: number) => padL + (i / (data.length - 1)) * innerW;
  const sy = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * innerH;

  const linePath = data
    .map((p, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(1)},${sy(p).toFixed(1)}`)
    .join(" ");
  const areaPath =
    linePath +
    ` L${sx(data.length - 1).toFixed(1)},${(padT + innerH).toFixed(1)}` +
    ` L${padL.toFixed(1)},${(padT + innerH).toFixed(1)} Z`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      aria-label="Net worth balance over time"
      className="overflow-visible"
    >
      <defs>
        <linearGradient id="balance-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#6366f1" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0"    />
        </linearGradient>
      </defs>

      {/* Grid lines + Y labels */}
      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={padL} y1={sy(v)}
            x2={W - padR} y2={sy(v)}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
          <text
            x={padL - 8} y={sy(v) + 4}
            textAnchor="end" fontSize="10" fill="rgba(100,116,139,0.9)"
          >
            ${v}k
          </text>
        </g>
      ))}

      {/* X labels (every other month) */}
      {BALANCE_MONTHS.map((m, i) =>
        i % 2 === 0 ? (
          <text
            key={m}
            x={sx(i)} y={H - 4}
            textAnchor="middle" fontSize="10" fill="rgba(100,116,139,0.9)"
          >
            {m}
          </text>
        ) : null
      )}

      {/* Area */}
      <path d={areaPath} fill="url(#balance-grad)" />

      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke="#818cf8"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* End-point dot */}
      <circle
        cx={sx(data.length - 1)} cy={sy(data[data.length - 1])}
        r="4" fill="#6366f1" stroke="#0d1117" strokeWidth="2"
      />
    </svg>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({
  value,
  warning,
  danger,
}: {
  value: number;
  warning?: boolean;
  danger?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full rounded-full bg-white/[0.08]">
      <div
        className={clsx(
          "h-1.5 rounded-full transition-all duration-500",
          danger
            ? "bg-gradient-to-r from-rose-500 to-orange-400"
            : warning
            ? "bg-gradient-to-r from-amber-400 to-orange-400"
            : "bg-gradient-to-r from-indigo-500 to-emerald-400"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
const CATEGORY_BADGE: Record<string, string> = {
  Income:    "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  Bills:     "text-rose-300   bg-rose-500/10    border-rose-500/20",
  Food:      "text-amber-300  bg-amber-500/10   border-amber-500/20",
  Shopping:  "text-violet-300 bg-violet-500/10  border-violet-500/20",
  Transfers: "text-sky-300    bg-sky-500/10     border-sky-500/20",
};

function Badge({ children, category }: { children: React.ReactNode; category?: Category }) {
  const color = category
    ? CATEGORY_BADGE[category]
    : "text-slate-300 bg-white/[0.05] border-white/[0.1]";
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        color
      )}
    >
      {children}
    </span>
  );
}

function StatusPill({ status }: { status: TxnStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        status === "completed"
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-amber-500/10 text-amber-400"
      )}
    >
      {status === "completed" ? "Completed" : "Pending"}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  delta,
  trend,
  spark,
  icon: CardIcon,
}: {
  title: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
  spark: number[];
  icon: LucideIcon;
}) {
  const DeltaIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const deltaColor =
    trend === "up"   ? "text-emerald-400 bg-emerald-500/10" :
    trend === "down" ? "text-rose-400    bg-rose-500/10"    :
                       "text-slate-400   bg-white/[0.05]";

  return (
    <div className="group rounded-2xl border border-white/[0.08] bg-[#0d1117] p-5 transition-all duration-200 hover:border-white/[0.15] hover:bg-[#111827] hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/25 animate-page">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <CardIcon size={14} />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              {title}
            </span>
          </div>
          <div className="mt-2.5 truncate text-2xl font-bold tracking-tight text-slate-50">
            {value}
          </div>
          <span
            className={clsx(
              "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
              deltaColor
            )}
          >
            <DeltaIcon size={11} />
            {delta}
          </span>
        </div>
        <div className="mt-1 shrink-0 opacity-60 transition-opacity group-hover:opacity-100">
          <Sparkline points={spark} />
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { k: "Overview",      label: "Snapshot",        icon: LayoutDashboard },
  { k: "Transactions",  label: "All activity",     icon: ArrowLeftRight  },
  { k: "Budgets",       label: "Spending targets", icon: Target          },
  { k: "Investments",   label: "Holdings",         icon: TrendingUp      },
  { k: "Reports",       label: "Insights",         icon: BarChart2       },
];

function Sidebar({ active, onChange }: { active: string; onChange: (k: string) => void }) {
  return (
    <aside
      className="hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col rounded-2xl border border-white/[0.08] bg-[#0d1117] p-4 backdrop-blur-md lg:flex"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="mb-5 flex items-center justify-between px-2 py-1.5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/25">
            L
          </div>
          <span className="text-base font-semibold tracking-tight text-slate-50">Ledgerly</span>
        </div>
        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-300">
          Pro
        </span>
      </div>

      {/* Nav section */}
      <div className="flex-1">
        <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-700">
          Navigation
        </p>
        <nav className="space-y-0.5" aria-label="Sidebar">
          {NAV_ITEMS.map((it) => {
            const isActive = active === it.k;
            return (
              <button
                key={it.k}
                type="button"
                onClick={() => onChange(it.k)}
                aria-current={isActive ? "page" : undefined}
                className={clsx(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0d1117]",
                  isActive
                    ? "bg-indigo-500/15 text-slate-50"
                    : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-200"
                )}
              >
                <span
                  className={clsx(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors",
                    isActive
                      ? "border-indigo-500/30 bg-indigo-500/20 text-indigo-300"
                      : "border-white/[0.08] bg-white/[0.04] text-slate-500"
                  )}
                >
                  <it.icon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold leading-tight">{it.k}</div>
                  <div
                    className={clsx(
                      "text-xs leading-tight",
                      isActive ? "text-slate-400" : "text-slate-600"
                    )}
                  >
                    {it.label}
                  </div>
                </div>
                {isActive && (
                  <ChevronRight size={13} className="shrink-0 text-slate-600" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Quick actions */}
      <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
        <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-700">
          Quick Actions
        </p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { label: "Add income", icon: Plus          },
              { label: "Pay bill",   icon: Receipt       },
              { label: "Transfer",   icon: ArrowLeftRight},
              { label: "Export",     icon: Download      },
            ] as { label: string; icon: LucideIcon }[]
          ).map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              className="flex flex-col items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2.5 text-xs text-slate-500 transition hover:bg-white/[0.07] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* User stub */}
      <button
        type="button"
        aria-label="User settings"
        className="mt-3 flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] p-3 text-left transition hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/40 to-emerald-500/30 text-sm font-bold text-slate-100 ring-1 ring-white/10">
          AK
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-200">Anish K</div>
          <div className="truncate text-xs text-slate-600">anish@ledgerly.io</div>
        </div>
        <Settings size={13} className="shrink-0 text-slate-600" />
      </button>
    </aside>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("Overview");

  const totals = useMemo(() => {
    const income     = TRANSACTIONS.filter((t) => t.amount > 0).reduce((a, b) => a + b.amount, 0);
    const expenseAbs = Math.abs(TRANSACTIONS.filter((t) => t.amount < 0).reduce((a, b) => a + b.amount, 0));
    const net        = income - expenseAbs;
    return { income, expenseAbs, net };
  }, []);

  return (
    <div className="min-h-screen bg-[#080c14] bg-[radial-gradient(ellipse_1200px_600px_at_20%_0%,rgba(99,102,241,0.18),transparent_65%),radial-gradient(ellipse_900px_500px_at_90%_10%,rgba(16,185,129,0.12),transparent_60%),radial-gradient(ellipse_700px_500px_at_50%_110%,rgba(244,63,94,0.09),transparent_60%)] p-4">
      <div className="mx-auto flex max-w-[1400px] gap-4">
        <Sidebar active={active} onChange={setActive} />

        <main className="flex min-w-0 flex-1 flex-col gap-4">

          {/* ── Top bar ──────────────────────────────────────────────────── */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#0d1117] px-5 py-3 animate-page"
            style={{ animationDelay: "0ms" }}
          >
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                Finance Dashboard
              </div>
              <div className="mt-0.5 text-lg font-bold tracking-tight text-slate-50">{active}</div>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <label className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 transition focus-within:border-indigo-500/40 focus-within:bg-indigo-500/[0.04] md:flex">
                <Search size={14} className="shrink-0 text-slate-600" />
                <input
                  className="w-44 bg-transparent text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
                  placeholder="Search transactions…"
                  aria-label="Search transactions"
                />
              </label>

              {/* + New */}
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-2 text-sm font-semibold text-indigo-300 transition hover:bg-indigo-500/20 hover:text-indigo-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Plus size={14} />
                New
              </button>

              {/* Notifications */}
              <button
                type="button"
                aria-label="Notifications"
                className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.07] hover:text-slate-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                <Bell size={15} />
                <span
                  className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500"
                  aria-hidden="true"
                />
              </button>

              {/* User avatar */}
              <button
                type="button"
                aria-label="User menu"
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/[0.08] bg-gradient-to-br from-indigo-500/35 to-emerald-500/25 text-[11px] font-bold text-slate-100 transition hover:from-indigo-500/50 hover:to-emerald-500/35 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                AK
              </button>
            </div>
          </div>

          {/* ── Content grid ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

            {/* Left / main column */}
            <div className="flex flex-col gap-4 lg:col-span-2">

              {/* KPI cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="animate-page" style={{ animationDelay: "60ms" }}>
                  <StatCard
                    title="Net Worth"
                    value={currency(48230.12)}
                    delta="2.4% this month"
                    trend="up"
                    spark={SPARKLINES.netWorth}
                    icon={Wallet}
                  />
                </div>
                <div className="animate-page" style={{ animationDelay: "100ms" }}>
                  <StatCard
                    title="Income"
                    value={currency(totals.income)}
                    delta="3.1% vs last month"
                    trend="up"
                    spark={SPARKLINES.income}
                    icon={TrendingUp}
                  />
                </div>
                <div className="animate-page" style={{ animationDelay: "140ms" }}>
                  <StatCard
                    title="Spending"
                    value={currency(totals.expenseAbs)}
                    delta="1.8% vs last month"
                    trend="down"
                    spark={SPARKLINES.spending}
                    icon={BarChart2}
                  />
                </div>
              </div>

              {/* Balance over time chart */}
              <div
                className="rounded-2xl border border-white/[0.08] bg-[#0d1117] p-5 animate-page"
                style={{ animationDelay: "180ms" }}
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      Balance Over Time
                    </div>
                    <div className="mt-1 text-xl font-bold tracking-tight text-slate-50">
                      {currency(48230.12)}
                      <span className="ml-2 text-sm font-semibold text-emerald-400">
                        ↑ 81.8% YTD
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {["1M", "1Y", "All"].map((r, i) => (
                      <button
                        key={r}
                        type="button"
                        className={clsx(
                          "rounded-lg border px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                          i === 1
                            ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-300"
                            : "border-white/[0.08] bg-white/[0.03] text-slate-500 hover:bg-white/[0.07] hover:text-slate-300"
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <BalanceChart />
              </div>

              {/* Cashflow */}
              <div
                className="rounded-2xl border border-white/[0.08] bg-[#0d1117] p-5 animate-page"
                style={{ animationDelay: "220ms" }}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      Cashflow
                    </div>
                    <div className="mt-1 text-2xl font-bold tracking-tight text-slate-50">
                      {currency(totals.net)}
                      <span className="ml-2 text-sm font-semibold text-slate-400">
                        net this month
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>Apr 2026</Badge>
                    <Badge>All accounts</Badge>
                    <button
                      type="button"
                      className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.07] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                      View report →
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    { label: "Checking",    balance: 6240.55,  pct: 68, note: "68% of monthly target"  },
                    { label: "Savings",     balance: 18300.12, pct: 82, note: "82% of savings goal"    },
                    { label: "Investments", balance: 23689.45, pct: 54, note: "54% portfolio allocated" },
                  ].map((acct) => (
                    <div
                      key={acct.label}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                        {acct.label}
                      </div>
                      <div className="mt-1.5 text-xl font-bold text-slate-50">
                        {currency(acct.balance)}
                      </div>
                      <div className="mt-3">
                        <ProgressBar value={acct.pct} />
                        <div className="mt-1.5 text-xs text-slate-600">{acct.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transactions */}
              <div
                className="rounded-2xl border border-white/[0.08] bg-[#0d1117] p-5 animate-page"
                style={{ animationDelay: "260ms" }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      Recent Activity
                    </div>
                    <div className="mt-0.5 text-base font-bold text-slate-50">Transactions</div>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-400 transition hover:bg-white/[0.07] hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    See all <ChevronRight size={12} />
                  </button>
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border border-white/[0.06]">
                  {TRANSACTIONS.map((t, idx) => {
                    const cfg   = CATEGORY_CONFIG[t.category];
                    const Icon  = cfg.icon;
                    const isEven = idx % 2 === 0;
                    return (
                      <div
                        key={t.id}
                        className={clsx(
                          "flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition hover:bg-white/[0.04]",
                          isEven ? "bg-white/[0.015]" : "bg-transparent",
                          idx < TRANSACTIONS.length - 1 && "border-b border-white/[0.05]"
                        )}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={clsx(
                              "grid h-9 w-9 shrink-0 place-items-center rounded-xl border",
                              cfg.bg, cfg.border, cfg.color
                            )}
                          >
                            <Icon size={15} />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-200">
                              {t.merchant}
                            </div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                              <Badge category={t.category}>{t.category}</Badge>
                              <span className="text-slate-700 text-xs">·</span>
                              <span className="text-xs text-slate-500">{t.account}</span>
                              <span className="text-slate-700 text-xs">·</span>
                              <span className="text-xs text-slate-500">{t.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <StatusPill status={t.status} />
                          <div
                            className={clsx(
                              "min-w-[80px] text-right text-sm font-bold tabular-nums",
                              t.amount >= 0 ? "text-emerald-400" : "text-slate-200"
                            )}
                          >
                            {t.amount >= 0 ? "+" : ""}
                            {currency(t.amount)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">

              {/* Card summary */}
              <div
                className="rounded-2xl border border-white/[0.08] bg-[#0d1117] p-5 animate-page"
                style={{ animationDelay: "60ms" }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard size={13} className="text-slate-600" />
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    Cards
                  </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-indigo-600/50 via-indigo-500/25 to-emerald-500/20 p-5 shadow-xl shadow-black/30 ring-1 ring-white/[0.1]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-semibold text-slate-400">Platinum</div>
                      <div className="mt-0.5 text-sm font-bold text-slate-200">Visa</div>
                    </div>
                    <div className="font-mono text-xs text-slate-500">•••• 1842</div>
                  </div>
                  <div className="mt-6 text-3xl font-bold tabular-nums tracking-tight text-slate-50">
                    {currency(1284.19)}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">Current balance</div>
                  <div className="mt-4 h-px bg-white/[0.08]" />
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>Anish Kumar</span>
                    <span className="font-mono">04 / 29</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {[
                    { label: "Utilization",  value: "24%"           },
                    { label: "Due date",     value: "Apr 28"        },
                    { label: "Credit limit", value: currency(5000)  },
                    { label: "Rewards pts",  value: "3,420"         },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3"
                    >
                      <div className="text-xs text-slate-600">{stat.label}</div>
                      <div className="mt-1 text-base font-bold text-slate-100">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budgets */}
              <div
                className="rounded-2xl border border-white/[0.08] bg-[#0d1117] p-5 animate-page"
                style={{ animationDelay: "120ms" }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target size={13} className="text-slate-600" />
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                      Budgets
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-xs font-semibold text-indigo-400 transition hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                  >
                    Edit
                  </button>
                </div>

                <div className="space-y-3">
                  {BUDGETS.map((b) => {
                    const pct       = Math.round((b.used / b.limit) * 100);
                    const isWarning = pct >= 85 && pct < 100;
                    const isDanger  = pct >= 100;
                    const remaining = b.limit - b.used;
                    return (
                      <div
                        key={b.name}
                        className={clsx(
                          "rounded-xl border p-4 transition",
                          isDanger
                            ? "border-rose-500/25 bg-rose-500/[0.05]"
                            : isWarning
                            ? "border-amber-500/20 bg-amber-500/[0.04]"
                            : "border-white/[0.08] bg-white/[0.02]"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold text-slate-200">{b.name}</div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {isWarning && (
                              <AlertTriangle size={12} className="text-amber-400" />
                            )}
                            {isDanger && (
                              <AlertTriangle size={12} className="text-rose-400" />
                            )}
                            <span className="text-xs tabular-nums text-slate-500">
                              {currency(b.used)} / {currency(b.limit)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <ProgressBar value={pct} warning={isWarning} danger={isDanger} />
                          <div className="mt-1.5 flex items-center justify-between text-xs">
                            <span
                              className={clsx(
                                "font-medium",
                                isDanger ? "text-rose-400" : isWarning ? "text-amber-400" : "text-slate-600"
                              )}
                            >
                              {pct}% used
                            </span>
                            <span
                              className={clsx(
                                "font-semibold",
                                isDanger
                                  ? "text-rose-400"
                                  : isWarning
                                  ? "text-amber-400"
                                  : "text-slate-400"
                              )}
                            >
                              {remaining >= 0
                                ? `${currency(remaining)} left`
                                : `${currency(Math.abs(remaining))} over`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Account health */}
              <div
                className="rounded-2xl border border-white/[0.08] bg-[#0d1117] p-5 animate-page"
                style={{ animationDelay: "180ms" }}
              >
                <div className="mb-3 flex items-center gap-2">
                  <Shield size={13} className="text-slate-600" />
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    Account Health
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Two-Factor Auth", status: "Enabled",    ok: true },
                    { label: "Linked Banks",    status: "3 accounts", ok: true },
                    { label: "Last login",      status: "Just now",   ok: true },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3"
                    >
                      <div className="text-sm font-medium text-slate-300">{item.label}</div>
                      <Badge category={item.ok ? "Income" : "Bills"}>{item.status}</Badge>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mt-1 w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-2 text-xs font-semibold text-slate-600 transition hover:bg-white/[0.06] hover:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    Manage security settings
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-2 pb-2 text-center text-xs text-slate-700">
            Ledgerly Demo • Frontend only with mock data • No real financial data used
          </footer>
        </main>
      </div>
    </div>
  );
}
