import React, {useEffect, useMemo, useRef, useState} from "react";

/* ---------------- Mock data (12 months) ---------------- */
const RAW = [
    {m: "2024-03", throughput: 820, otif: 91, turns: 4.2, woAgingDays: 7.2, scrapCost: 920},
    {m: "2024-04", throughput: 905, otif: 92, turns: 4.4, woAgingDays: 7.0, scrapCost: 880},
    {m: "2024-05", throughput: 980, otif: 89, turns: 4.6, woAgingDays: 7.6, scrapCost: 1020},
    {m: "2024-06", throughput: 1040, otif: 90, turns: 4.8, woAgingDays: 7.4, scrapCost: 970},
    {m: "2024-07", throughput: 1085, otif: 93, turns: 5.0, woAgingDays: 6.9, scrapCost: 860},
    {m: "2024-08", throughput: 1120, otif: 92, turns: 5.1, woAgingDays: 6.8, scrapCost: 840},
    {m: "2024-09", throughput: 1060, otif: 88, turns: 4.7, woAgingDays: 7.8, scrapCost: 1100},
    {m: "2024-10", throughput: 1140, otif: 90, turns: 5.2, woAgingDays: 7.1, scrapCost: 930},
    {m: "2024-11", throughput: 1180, otif: 94, turns: 5.4, woAgingDays: 6.5, scrapCost: 780},
    {m: "2024-12", throughput: 1210, otif: 95, turns: 5.6, woAgingDays: 6.1, scrapCost: 720},
    {m: "2025-01", throughput: 1160, otif: 92, turns: 5.3, woAgingDays: 6.7, scrapCost: 860},
    {m: "2025-02", throughput: 1240, otif: 96, turns: 5.8, woAgingDays: 5.9, scrapCost: 690},
];

const METRICS = [
    {key: "throughput", label: "Throughput (units)", unit: "", chart: "bar"},
    {key: "otif", label: "OTIF %", unit: "%", chart: "line"},
    {key: "turns", label: "Inventory Turns", unit: "", chart: "line"},
    {key: "woAgingDays", label: "WO Aging (days)", unit: " d", chart: "line", lowerIsBetter: true},
    {key: "scrapCost", label: "Scrap Cost (€)", unit: "€", chart: "bar", lowerIsBetter: true},
];

const TARGETS = {
    otif: 95,           // want >= 95%
    turns: 5,           // want >= 5
    woAgingDays: 6,     // want <= 6
    scrapCost: 700,     // want <= 700
    // throughput: (no global target in mock)
};

export default function DashboardPage() {
    const [metric, setMetric] = useState(() => localStorage.getItem("dash:metric") || "throughput");
    const [windowSize, setWindowSize] = useState(() => Number(localStorage.getItem("dash:window")) || 12);
    const [hoverIndex, setHoverIndex] = useState(null);

    useEffect(() => {
        localStorage.setItem("dash:metric", metric);
    }, [metric]);
    useEffect(() => {
        localStorage.setItem("dash:window", String(windowSize));
    }, [windowSize]);

    const rows = useMemo(() => RAW.slice(-windowSize), [windowSize]);

    // KPIs (based on current window)
    const last = rows[rows.length - 1] || {};
    const prev = rows[rows.length - 2] || {};
    const kpi = (k, fmt = (v) => v, invert = false) => ({
        label: METRICS.find(m => m.key === k).label.split(" ")[0],
        value: fmt(last[k]),
        delta: deltaPct(prev[k], last[k]),
        invert
    });
    const KPIS = [
        kpi("throughput", v => fmtNum(v)),
        kpi("otif", v => `${v}%`),
        kpi("turns", v => v),
        kpi("woAgingDays", v => `${v} d`, true),
        kpi("scrapCost", v => `€${fmtNum(v)}`, true),
    ];

    // Insights for selected metric
    const insights = useMemo(() => buildInsights(rows, metric), [rows, metric]);

    // Keyboard scrub (←/→) across chart/table
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "ArrowRight") setHoverIndex(i => (i === null ? rows.length - 1 : Math.min(rows.length - 1, i + 1)));
            if (e.key === "ArrowLeft") setHoverIndex(i => (i === null ? rows.length - 1 : Math.max(0, i - 1)));
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [rows.length]);

    return (
        <div className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200 min-h-screen">
            {/* Header */}
            <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
                        <p className="mt-1 text-slate-400">Live KPIs and insights for operations & inventory.</p>
                    </div>
                </div>
            </header>

            {/* KPI Row */}
            <section className="mx-auto max-w-6xl px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {KPIS.map((k, i) => (
                    <KpiTile key={i} {...k} spark={RAW.slice(-windowSize).map(r => pickNumeric(k.label, r))}/>
                ))}
            </section>

            {/* Controls */}
            <div className="mx-auto max-w-6xl px-4 pt-6">
                <div
                    className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 flex flex-wrap items-center gap-2 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_8px_30px_rgba(0,0,0,0.25)]">
                    <div className="flex flex-wrap gap-2">
                        {METRICS.map(m => (
                            <button key={m.key} onClick={() => setMetric(m.key)}
                                    className={`px-3 py-1.5 rounded-lg text-sm border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                                        metric === m.key
                                            ? "bg-blue-600 text-white border-blue-500 shadow hover:bg-blue-500"
                                            : "bg-slate-800/70 text-slate-300 border-white/10 hover:bg-slate-700"
                                    }`}>
                                {m.label}
                            </button>
                        ))}
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-slate-400">Window</span>
                        <select
                            value={windowSize}
                            onChange={(e) => setWindowSize(Number(e.target.value))}
                            className="rounded-lg bg-slate-800 border border-white/10 px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                        >
                            {[6, 9, 12].map(n => <option key={n} value={n}>{n} months</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Chart + Table + Insights */}
            <section className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Chart */}
                <div
                    className="xl:col-span-2 rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_20px_50px_rgba(0,0,0,0.3)]">
                    <MetricChart
                        rows={rows}
                        metric={metric}
                        config={METRICS.find(m => m.key === metric)}
                        target={TARGETS[metric]}
                        hoverIndex={hoverIndex}
                        setHoverIndex={setHoverIndex}
                    />
                    {typeof TARGETS[metric] !== "undefined" && (
                        <div className="text-xs text-slate-500 mt-2">
                            Target: <span
                            className="text-slate-300">{TARGETS[metric]}{(METRICS.find(m => m.key === metric) || {}).unit || ""}</span>
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-6">

                    {/* Table (Ticker) */}
                    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 overflow-hidden">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-white font-semibold text-base">Monthly Breakdown</h3>
                            <TickerControls/>
                        </div>
                        <BreakdownTicker
                            rows={rows}
                            metric={metric}
                            hoverIndex={hoverIndex}
                            setHoverIndex={setHoverIndex}
                            visibleCount={8}
                            intervalMs={2500}
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

/* ---------------- Components ---------------- */

function KpiTile({label, value, delta, invert, spark}) {
    const good = invert ? delta < 0 : delta > 0;
    const bad = invert ? delta > 0 : delta < 0;
    const cls = good ? "text-emerald-400" : bad ? "text-red-400" : "text-slate-400";
    return (
        <div className="rounded-xl bg-slate-900/60 border border-white/10 p-4 relative overflow-hidden group">
            {/* soft glow */}
            <div
                className="pointer-events-none absolute -inset-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{background: "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(59,130,246,0.08), transparent 40%)"}}/>
            <div className="text-xs text-slate-400">{label}</div>
            <div className="mt-1 text-2xl font-semibold text-slate-100">{value}</div>
            <div className={`mt-1 text-xs ${cls}`}>{delta > 0 ? "+" : ""}{round1(delta)}% vs prev mo</div>
            {spark && <Sparkline values={spark}/>}
        </div>
    );
}

function Sparkline({values}) {
    if (!values || values.length < 2) return null;
    const w = 120, h = 30, pad = 2;
    const min = Math.min(...values), max = Math.max(...values);
    const xs = values.map((_, i) => pad + i * (w - pad * 2) / (values.length - 1));
    const ys = values.map(v => pad + (h - pad * 2) * (1 - (v - min) / (max - min || 1)));
    const d = xs.map((x, i) => (i === 0 ? "M" : "L") + x + "," + ys[i]).join(" ");
    return (
        <svg width={w} height={h} className="mt-2 block">
            <defs>
                <linearGradient id="sparkGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.6"/>
                    <stop offset="100%" stopColor="#93c5fd" stopOpacity="0"/>
                </linearGradient>
            </defs>
            <path d={d} fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-300/80"/>
        </svg>
    );
}

function MetricChart({rows, metric, config, target, hoverIndex, setHoverIndex}) {
    const ref = useRef(null);
    const [w, setW] = useState(600);
    const h = 320; // increased height for better balance with right-side elements
    const pad = {l: 36, r: 16, t: 14, b: 44}; // adjust bottom padding for labels


    useEffect(() => {
        const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
        if (ref.current) ro.observe(ref.current);
        return () => ro.disconnect();
    }, []);


    const vals = rows.map(r => r[metric]);
    const max = Math.max(...vals, 1);
    const min = config.chart === "line" ? Math.min(...vals) : 0;


    const x = (i) => pad.l + i * (w - pad.l - pad.r) / Math.max(1, rows.length - 1);
    const y = (v) => pad.t + (h - pad.t - pad.b) * (1 - (v - min) / (max - min || 1));

    // Moving average (3-mo)
    const ma = movingAverage(vals, 3);

    // anomaly = > 1σ from mean
    const mean = avg(vals);
    const sd = Math.sqrt(avg(vals.map(v => (v - mean) * (v - mean))) || 0);
    const isOutlier = (v) => Math.abs(v - mean) > sd;

    const hi = hoverIndex ?? rows.length - 1;
    const hvX = x(hi);
    const hvY = y(vals[hi]);

    // axes ticks (months)
    const ticks = rows.map((r, i) => ({i, label: shortMon(r.m)}));

    return (
        <div ref={ref} className="relative">
            <svg width="100%" height={h}
                 onMouseMove={(e) => {
                     const rect = e.currentTarget.getBoundingClientRect();
                     const relX = e.clientX - rect.left - pad.l;
                     const step = (w - pad.l - pad.r) / Math.max(1, rows.length - 1);
                     setHoverIndex(Math.min(rows.length - 1, Math.max(0, Math.round(relX / step))));
                 }}
                 onMouseLeave={() => setHoverIndex(null)}>

                {/* background gradient */}
                <defs>
                    <linearGradient id="fillLine" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.25"/>
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity="0"/>
                    </linearGradient>
                </defs>

                {/* X grid */}
                {ticks.map(t => (
                    <line key={t.i} x1={x(t.i)} x2={x(t.i)} y1={pad.t} y2={h - pad.b}
                          stroke="currentColor" className="text-slate-800"/>
                ))}

                {/* Target line */}
                {typeof target !== "undefined" && (
                    <g>
                        <line x1={pad.l} x2={w - pad.r} y1={y(target)} y2={y(target)}
                              stroke="#22c55e" strokeDasharray="4,4"/>
                        <text x={w - pad.r} y={y(target) - 6} textAnchor="end"
                              className="fill-emerald-400 text-[10px]">target {target}{config.unit || ""}</text>
                    </g>
                )}

                {/* Bars or line */}
                {config.chart === "bar" ? (
                    rows.map((r, i) => {
                        const bw = (w - pad.l - pad.r) / rows.length - 8;
                        return (
                            <g key={i}>
                                <rect x={x(i) - bw / 2} y={y(vals[i])}
                                      width={bw} height={h - pad.b - y(vals[i]) + pad.t}
                                      fill="#60a5fa" opacity={hoverIndex === null || hoverIndex === i ? 1 : 0.45}
                                      rx="4"/>
                                {isOutlier(vals[i]) && (
                                    <circle cx={x(i)} cy={y(vals[i]) - 6} r="4" fill="#f59e0b"/>
                                )}
                            </g>
                        );
                    })
                ) : (
                    <>
                        <path d={vals.map((v, i) => (i === 0 ? "M" : "L") + x(i) + "," + y(v)).join(" ")}
                              stroke="#60a5fa" fill="none" strokeWidth="2"/>
                        {/* light fill under line */}
                        <path d={`M${x(0)},${y(vals[0])} ` +
                            vals.slice(1).map((v, i) => `L${x(i + 1)},${y(v)}`).join(" ") +
                            ` L${x(rows.length - 1)},${h - pad.b} L${x(0)},${h - pad.b} Z`}
                              fill="url(#fillLine)"/>
                        {/* outliers */}
                        {rows.map((r, i) => isOutlier(vals[i]) && (
                            <circle key={i} cx={x(i)} cy={y(vals[i])} r="4" fill="#f59e0b"/>
                        ))}
                    </>
                )}

                {/* Moving average */}
                <path d={ma.map((v, i) => (i === 0 ? "M" : "L") + x(i) + "," + y(v)).join(" ")}
                      stroke="#94a3b8" fill="none" strokeDasharray="4,4"/>

                {/* Hover line + dot */}
                <line x1={hvX} x2={hvX} y1={pad.t} y2={h - pad.b}
                      stroke="#64748b" strokeDasharray="3,3"/>
                <circle cx={hvX} cy={hvY} r="4" fill="#60a5fa"/>

                {/* X labels */}
                {ticks.map(t => (
                    <text key={"t" + t.i} x={x(t.i)} y={h - 10} textAnchor="middle"
                          className="fill-slate-400 text-[10px]">{t.label}</text>
                ))}

                {/* Y min/max labels */}
                <text x={pad.l - 6} y={y(max)} textAnchor="end"
                      className="fill-slate-500 text-[10px]">{fmtNum(max)}</text>
                <text x={pad.l - 6} y={y(min)} textAnchor="end"
                      className="fill-slate-500 text-[10px]">{fmtNum(min)}</text>
            </svg>

            {/* Tooltip */}
            {rows[hi] && (
                <div
                    className="absolute -translate-x-1/2 bg-slate-900/95 border border-white/10 rounded px-2 py-1 text-xs shadow-lg"
                    style={{left: hvX, top: hvY - 30}}>
                    <div className="font-semibold">{fmtMonth(rows[hi].m)}</div>
                    <div>{fmtNum(vals[hi])}{config.unit || ""}</div>
                </div>
            )}
        </div>
    );
}

/** Ticker controls visual only (dummy btns for now, place for future hooks) **/
function TickerControls() {
    return (
        <div className="flex items-center gap-1 text-slate-400 text-xs">
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-white/10">Auto</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 border border-white/10">Hover to pause</span>
        </div>
    );
}

/** Monthly Breakdown as an infinite vertical ticker (auto-scroll). **/
function BreakdownTicker({rows, metric, hoverIndex, setHoverIndex, visibleCount = 8, intervalMs = 2500}) {
    const [start, setStart] = useState(Math.max(0, rows.length - visibleCount)); // show newest chunk by default
    const [paused, setPaused] = useState(false);

    // duplicate array to allow seamless wrap-around
    const doubled = useMemo(() => rows.concat(rows), [rows]);

    // auto-advance
    useEffect(() => {
        if (paused || rows.length <= visibleCount) return;
        const id = setInterval(() => setStart(s => (s + 1) % rows.length), intervalMs);
        return () => clearInterval(id);
    }, [paused, rows.length, visibleCount, intervalMs]);

    const slice = doubled.slice(start, start + visibleCount);

    return (
        <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
            <table className="min-w-full text-sm">
                <thead className="bg-slate-800/60 text-slate-400 sticky top-0 z-10">
                <tr>
                    <th className="px-3 py-2 text-left">Month</th>
                    <th className="px-3 py-2 text-right">Throughput</th>
                    <th className="px-3 py-2 text-right">OTIF %</th>
                    <th className="px-3 py-2 text-right">Turns</th>
                    <th className="px-3 py-2 text-right">WO Aging</th>
                    <th className="px-3 py-2 text-right">Scrap €</th>
                    <th className="px-3 py-2 text-right">Δ {METRICS.find(m => m.key === metric).label.split(" ")[0]}</th>
                </tr>
                </thead>
            </table>

            {/* viewport with smooth vertical slide */}
            <div className="overflow-hidden" style={{height: `${visibleCount * 44}px`}}>
                <table className="min-w-full text-sm">
                    <tbody
                        className="divide-y divide-slate-800 transition-transform duration-500"
                        style={{transform: `translateY(0)`}}
                    >
                    {slice.map((r, idx) => {
                        // idx within original rows array
                        const i = (start + idx) % rows.length;
                        const prev = rows[i - 1 < 0 ? rows.length - 1 : i - 1];
                        const d = prev ? r[metric] - prev[metric] : 0;
                        const cfg = METRICS.find(m => m.key === metric);
                        const good = (cfg.lowerIsBetter ? d < 0 : d > 0);
                        const bad = (cfg.lowerIsBetter ? d > 0 : d < 0);
                        return (
                            <tr key={`${r.m}-${idx}`}
                                className={`hover:bg-slate-800/40 ${hoverIndex === i ? "bg-slate-800/60" : ""}`}
                                onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
                                <td className="px-3 py-2">{fmtMonth(r.m)}</td>
                                <td className="px-3 py-2 text-right">{fmtNum(r.throughput)}</td>
                                <td className="px-3 py-2 text-right">{r.otif}%</td>
                                <td className="px-3 py-2 text-right">{r.turns}</td>
                                <td className="px-3 py-2 text-right">{r.woAgingDays}</td>
                                <td className="px-3 py-2 text-right">€{fmtNum(r.scrapCost)}</td>
                                <td className={`px-3 py-2 text-right ${good ? "text-emerald-400" : bad ? "text-red-400" : "text-slate-400"}`}>
                                    {i === 0 ? "—" : (d > 0 ? "+" : "") + round1(d) + (cfg.unit || "")}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

/* ---------------- Utils ---------------- */
function fmtNum(n) {
    return (Number(n) || 0).toLocaleString();
}

function fmtMonth(m) {
    const [y, mm] = m.split("-");
    return new Date(+y, +mm - 1, 1).toLocaleString(undefined, {month: "short", year: "numeric"});
}

function shortMon(m) {
    const [y, mm] = m.split("-");
    return new Date(+y, +mm - 1, 1).toLocaleString(undefined, {month: "short"});
}

function round1(n) {
    return Math.round((Number(n) || 0) * 10) / 10;
}

function deltaPct(prev, curr) {
    if (!prev) return 0;
    return ((curr - prev) / prev) * 100;
}

function avg(arr) {
    return arr.reduce((s, v) => s + (Number(v) || 0), 0) / (arr.length || 1);
}

function movingAverage(arr, w) {
    if (!arr || !arr.length) return [];
    const out = [];
    for (let i = 0; i < arr.length; i++) {
        const start = Math.max(0, i - w + 1);
        const window = arr.slice(start, i + 1);
        out.push(window.reduce((s, v) => s + v, 0) / window.length);
    }
    return out;
}

function buildInsights(rows, key) {
    if (!rows.length) return {slope: 0, best: {m: "", v: 0}, worst: {m: "", v: 0}, outliers: []};
    const vals = rows.map(r => r[key]);
    const xs = rows.map((_, i) => i);
    // linear regression slope
    const xBar = avg(xs), yBar = avg(vals);
    const num = xs.reduce((s, x, i) => s + (x - xBar) * (vals[i] - yBar), 0);
    const den = xs.reduce((s, x) => s + (x - xBar) * (x - xBar), 0) || 1;
    const slope = num / den; // per step (≈ per month)

    const bestIdx = vals.indexOf(Math.max(...vals));
    const worstIdx = vals.indexOf(Math.min(...vals));
    const mean = yBar;
    const sd = Math.sqrt(avg(vals.map(v => (v - mean) * (v - mean))) || 0);
    const outliers = rows.filter(r => Math.abs(r[key] - mean) > sd);

    return {
        slope,
        best: {m: rows[bestIdx].m, v: vals[bestIdx]},
        worst: {m: rows[worstIdx].m, v: vals[worstIdx]},
        outliers
    };
}

// for KPI sparklines: pick a matching field by label prefix
function pickNumeric(label, row) {
    if (label.startsWith("Throughput")) return row.throughput;
    if (label.startsWith("OTIF")) return row.otif;
    if (label.startsWith("Turns")) return row.turns;
    if (label.startsWith("WO")) return row.woAgingDays;
    if (label.startsWith("Scrap")) return row.scrapCost;
    return 0;
}

// bonus: cursor glows in KPI tiles
if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', (e) => {
        document.querySelectorAll('[class*=group]')?.forEach(el => {
            const r = el.getBoundingClientRect();
            el.style.setProperty('--x', `${e.clientX - r.left}px`);
            el.style.setProperty('--y', `${e.clientY - r.top}px`);
        });
    });
}
