import { useMemo, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = "Income" | "Bills" | "Food" | "Shopping" | "Transfers";
type Account = "Checking" | "Savings" | "Card";

interface Txn {
  id: string;
  merchant: string;
  category: Category;
  amount: number; // positive = income, negative = expense
  date: string;
  account: Account;
}

interface Budget {
  name: string;
  used: number;
  limit: number;
  icon: string;
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
  { id: "t1", merchant: "Payroll Deposit", category: "Income", amount: 3450.0, date: "2026-04-12", account: "Checking" },
  { id: "t2", merchant: "Monthly Rent", category: "Bills", amount: -1850.0, date: "2026-04-01", account: "Checking" },
  { id: "t3", merchant: "Whole Foods Market", category: "Food", amount: -132.54, date: "2026-04-10", account: "Card" },
  { id: "t4", merchant: "Blue Bottle Coffee", category: "Food", amount: -8.75, date: "2026-04-13", account: "Card" },
  { id: "t5", merchant: "Transfer to Savings", category: "Transfers", amount: -500.0, date: "2026-04-08", account: "Checking" },
  { id: "t6", merchant: "Savings Interest", category: "Income", amount: 14.22, date: "2026-04-02", account: "Savings" },
  { id: "t7", merchant: "Netflix Subscription", category: "Bills", amount: -17.99, date: "2026-04-05", account: "Card" },
  { id: "t8", merchant: "Amazon Purchase", category: "Shopping", amount: -89.49, date: "2026-04-09", account: "Card" },
];

const BUDGETS: Budget[] = [
  { name: "Food & Dining", used: 312, limit: 500, icon: "🍽️" },
  { name: "Shopping", used: 220, limit: 350, icon: "🛍️" },
  { name: "Bills & Utilities", used: 1868, limit: 2000, icon: "🧾" },
];

const SPARKLINES: Record<string, number[]> = {
  netWorth: [22, 24, 24, 26, 25, 28, 30, 31, 35, 34, 38, 40],
  income: [10, 12, 12, 13, 15, 15, 16, 16, 18, 18, 19, 20],
  spending: [18, 18, 17, 17, 16, 15, 15, 14, 14, 14, 13, 12],
};

// ─── Sparkline SVG ────────────────────────────────────────────────────────────
function Sparkline({ points }: { points: number[] }) {
  const d = useMemo(() => {
    const w = 120, h = 36, pad = 3;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const rng = Math.max(1e-6, max - min);
    return points
      .map((p, i) => {
        const x = pad + (i * (w - pad * 2)) / (points.length - 1);
        const y = pad + (1 - (p - min) / rng) * (h - pad * 2);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
  }, [points]);

  return (
    <svg width="120" height="36" viewBox="0 0 120 36" aria-hidden="true">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={d}
        className="text-indigo-300/80"
      />
    </svg>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, danger }: { value: number; danger?: boolean }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10">
      <div
        className={clsx(
          "h-1.5 rounded-full transition-all duration-500",
          danger && pct >= 90
            ? "bg-gradient-to-r from-rose-400 to-orange-400"
            : "bg-gradient-to-r from-indigo-400 to-emerald-400"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  Income: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  Bills: "text-rose-300 bg-rose-500/10 border-rose-500/20",
  Food: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  Shopping: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  Transfers: "text-sky-300 bg-sky-500/10 border-sky-500/20",
};

function Badge({ children, category }: { children: React.ReactNode; category?: Category }) {
  const color = category ? CATEGORY_COLORS[category] : "text-slate-300 bg-white/5 border-white/10";
  return (
    <span className={clsx("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", color)}>
      {children}
    </span>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  title, value, delta, trend, spark,
}: {
  title: string;
  value: string;
  delta: string;
  trend: "up" | "down" | "flat";
  spark: number[];
}) {
  const tone =
    trend === "up" ? "text-emerald-300" :
    trend === "down" ? "text-rose-300" :
    "text-slate-400";

  const arrow = trend === "up" ? "↑" : trend === "down" ? "↓" : "→";

  return (
    <div className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</div>
          <div className="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-50">{value}</div>
          <div className={clsx("mt-1.5 flex items-center gap-1 text-xs font-medium", tone)}>
            <span>{arrow}</span>
            <span>{delta}</span>
          </div>
        </div>
        <div className="mt-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          <Sparkline points={spark} />
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { k: "Overview", label: "Snapshot", icon: "◈" },
  { k: "Transactions", label: "All activity", icon: "⇄" },
  { k: "Budgets", label: "Spending targets", icon: "◎" },
  { k: "Investments", label: "Holdings", icon: "▦" },
  { k: "Reports", label: "Insights", icon: "▤" },
];

function Sidebar({ active, onChange }: { active: string; onChange: (k: string) => void }) {
  return (
    <aside className="hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md lg:flex">
      {/* Logo */}
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 text-sm font-bold text-white shadow-lg">
            L
          </div>
          <div className="text-base font-semibold tracking-tight text-slate-50">Ledgerly</div>
        </div>
        <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-300">
          Pro
        </span>
      </div>

      {/* Nav */}
      <nav className="mt-6 flex-1 space-y-1">
        {NAV_ITEMS.map((it) => {
          const isActive = active === it.k;
          return (
            <button
              key={it.k}
              onClick={() => onChange(it.k)}
              className={clsx(
                "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all",
                isActive
                  ? "bg-gradient-to-r from-indigo-500/20 to-emerald-500/10 ring-1 ring-white/10 text-slate-50"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              )}
            >
              <span
                className={clsx(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-xl border text-sm transition",
                  isActive
                    ? "border-indigo-500/30 bg-indigo-500/20 text-indigo-300"
                    : "border-white/10 bg-white/5 text-slate-400"
                )}
              >
                {it.icon}
              </span>
              <div>
                <div className="text-sm font-medium leading-tight">{it.k}</div>
                <div className="text-xs text-slate-500 leading-tight">{it.label}</div>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Quick actions */}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quick Actions</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {["Add income", "Pay bill", "Transfer", "Export"].map((label) => (
            <button
              key={label}
              className="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs text-slate-300 hover:bg-white/10 hover:text-slate-100 transition"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* User */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500/40 to-emerald-500/30 text-sm font-bold text-slate-100 ring-1 ring-white/10">
          AK
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-slate-200">Anish K</div>
          <div className="truncate text-xs text-slate-500">anish@ledgerly.io</div>
        </div>
      </div>
    </aside>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [active, setActive] = useState("Overview");

  const totals = useMemo(() => {
    const income = TRANSACTIONS.filter((t) => t.amount > 0).reduce((a, b) => a + b.amount, 0);
    const expenseAbs = Math.abs(TRANSACTIONS.filter((t) => t.amount < 0).reduce((a, b) => a + b.amount, 0));
    const net = income - expenseAbs;
    return { income, expenseAbs, net };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_1200px_600px_at_20%_0%,rgba(99,102,241,0.22),transparent_65%),radial-gradient(ellipse_900px_500px_at_90%_10%,rgba(16,185,129,0.16),transparent_60%),radial-gradient(ellipse_800px_500px_at_50%_110%,rgba(244,63,94,0.12),transparent_60%)] p-4">
      <div className="mx-auto flex max-w-[1400px] gap-4">
        <Sidebar active={active} onChange={setActive} />

        <main className="flex min-w-0 flex-1 flex-col gap-4">
          {/* Top bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-3.5 backdrop-blur-md">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Finance Dashboard</div>
              <div className="mt-0.5 text-lg font-semibold tracking-tight text-slate-50">{active}</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 md:flex">
                <span className="text-slate-500">⌕</span>
                <input
                  className="w-48 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  placeholder="Search transactions…"
                />
              </div>
              <button className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-slate-100 transition">
                + New
              </button>
              <button className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-slate-100 transition">
                🔔
              </button>
            </div>
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Left / main column */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              {/* KPI cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                  title="Net Worth"
                  value={currency(48230.12)}
                  delta="2.4% this month"
                  trend="up"
                  spark={SPARKLINES.netWorth}
                />
                <StatCard
                  title="Income"
                  value={currency(totals.income)}
                  delta="3.1% vs last month"
                  trend="up"
                  spark={SPARKLINES.income}
                />
                <StatCard
                  title="Spending"
                  value={currency(totals.expenseAbs)}
                  delta="1.8% vs last month"
                  trend="down"
                  spark={SPARKLINES.spending}
                />
              </div>

              {/* Cashflow */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Cashflow</div>
                    <div className="mt-1.5 text-2xl font-semibold tracking-tight text-slate-50">
                      {currency(totals.net)}
                      <span className="ml-2 text-sm font-medium text-slate-400">net this month</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>Apr 2026</Badge>
                    <Badge>All accounts</Badge>
                    <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition">
                      View report →
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    { label: "Checking", balance: 6240.55, pct: 68, note: "68% of monthly target" },
                    { label: "Savings", balance: 18300.12, pct: 82, note: "82% of savings goal" },
                    { label: "Investments", balance: 23689.45, pct: 54, note: "54% portfolio allocated" },
                  ].map((acct) => (
                    <div key={acct.label} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{acct.label}</div>
                      <div className="mt-1.5 text-xl font-semibold text-slate-50">{currency(acct.balance)}</div>
                      <div className="mt-3">
                        <ProgressBar value={acct.pct} />
                        <div className="mt-1.5 text-xs text-slate-500">{acct.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transactions */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Recent Activity</div>
                    <div className="mt-0.5 text-base font-semibold text-slate-50">Transactions</div>
                  </div>
                  <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10 transition">
                    See all →
                  </button>
                </div>

                <div className="mt-4 divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/10">
                  {TRANSACTIONS.map((t) => (
                    <div
                      key={t.id}
                      className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/20 px-4 py-3.5 hover:bg-slate-950/40 transition"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={clsx(
                            "grid h-9 w-9 shrink-0 place-items-center rounded-xl border text-sm",
                            t.amount >= 0
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                              : "border-white/10 bg-white/5 text-slate-400"
                          )}
                        >
                          {t.amount >= 0 ? "↓" : "↑"}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-200">{t.merchant}</div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                            <Badge category={t.category}>{t.category}</Badge>
                            <span>·</span>
                            <span>{t.account}</span>
                            <span>·</span>
                            <span>{t.date}</span>
                          </div>
                        </div>
                      </div>
                      <div
                        className={clsx(
                          "text-sm font-semibold tabular-nums",
                          t.amount >= 0 ? "text-emerald-300" : "text-slate-200"
                        )}
                      >
                        {t.amount >= 0 ? "+" : ""}
                        {currency(t.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              {/* Card summary */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Cards</div>

                <div className="mt-3 rounded-2xl bg-gradient-to-br from-indigo-600/40 via-indigo-500/20 to-emerald-500/20 p-5 ring-1 ring-white/10 shadow-xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs font-medium text-slate-400">Platinum</div>
                      <div className="mt-0.5 text-sm font-semibold text-slate-200">Visa</div>
                    </div>
                    <div className="text-xs text-slate-400 tabular-nums">•••• 1842</div>
                  </div>
                  <div className="mt-6 text-3xl font-bold tabular-nums tracking-tight text-slate-50">
                    {currency(1284.19)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">Current balance</div>
                  <div className="mt-4 h-px bg-white/10" />
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                    <span>Anish Kumar</span>
                    <span>04 / 29</span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  {[
                    { label: "Utilization", value: "24%" },
                    { label: "Due date", value: "Apr 28" },
                    { label: "Credit limit", value: currency(5000) },
                    { label: "Rewards pts", value: "3,420" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                      <div className="text-xs text-slate-500">{stat.label}</div>
                      <div className="mt-1 text-base font-semibold text-slate-100">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budgets */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Budgets</div>
                  <button className="text-xs text-indigo-400 hover:text-indigo-300 transition">Edit</button>
                </div>
                <div className="mt-3 space-y-3">
                  {BUDGETS.map((b) => {
                    const pct = Math.round((b.used / b.limit) * 100);
                    return (
                      <div key={b.name} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{b.icon}</span>
                            <div className="text-sm font-medium text-slate-200">{b.name}</div>
                          </div>
                          <div className="text-xs tabular-nums text-slate-500">
                            {currency(b.used)} / {currency(b.limit)}
                          </div>
                        </div>
                        <div className="mt-3">
                          <ProgressBar value={pct} danger />
                          <div className="mt-1.5 flex items-center justify-between text-xs text-slate-500">
                            <span>{pct}% used</span>
                            <span>{currency(b.limit - b.used)} left</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Security / Account health */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-500">Account Health</div>
                <div className="mt-3 space-y-3">
                  {[
                    { label: "Two-Factor Auth", status: "Enabled", ok: true },
                    { label: "Linked Banks", status: "3 accounts", ok: true },
                    { label: "Last login", status: "Just now", ok: true },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3"
                    >
                      <div className="text-sm text-slate-300">{item.label}</div>
                      <Badge category={item.ok ? "Income" : "Bills"}>{item.status}</Badge>
                    </div>
                  ))}
                  <button className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 py-2 text-xs text-slate-400 hover:bg-white/10 hover:text-slate-200 transition">
                    Manage security settings
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-2 pb-2 text-center text-xs text-slate-600">
            Ledgerly Demo • Frontend only with mock data • No real financial data used
          </footer>
        </main>
      </div>
    </div>
  );
}
