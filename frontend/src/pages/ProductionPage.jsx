import React, {useMemo, useState} from "react";

/**
 * ProductionPage — shop-floor execution (RAW JS)
 * - Mock work centers/shifts and per-operation dispatch rows
 * - Filters (work center, shift, status, search)
 * - KPIs (WIP, Utilization mock, Shortages)
 * - Expand rows to an operator panel (Start/Pause/Complete) + Materials
 * - Expansion uses a div-grid (no nested table) to avoid styling breaks
 * - Dark gradient background to match other pages
 */

export default function ProductionPage() {
    // ----- Mock masters -----
    const WORK_CENTERS = [
        {id: "WC-ASM", name: "Assembly Line A"},
        {id: "WC-PAI", name: "Paint Booth 1"},
        {id: "WC-QA", name: "QA Station"},
    ];
    const SHIFTS = ["All", "A (06–14)", "B (14–22)", "C (22–06)"];

    // Each row represents an OPERATION on a MO
    const initialOps = [
        {
            id: "OP-2001",
            moId: "MO-1001",
            seq: 10,
            operation: "Sub-assemble frame",
            product: "Front Assembly",
            productId: "ITM-006",
            workCenter: "WC-ASM",
            shift: "A (06–14)",
            status: "Queued",            // Queued | Running | Paused | Done
            qtyPlanned: 200,
            qtyGood: 120,
            qtyScrap: 2,
            dueTime: "2025-02-20 14:00",
            runtimeEstMin: 180,
            assignee: "—",
            materials: [
                {itemId: "ITM-007", item: "Steel Frame", req: 200, issued: 150, uom: "pcs"},
                {itemId: "ITM-009", item: "Screws M3x8", req: 1000, issued: 800, uom: "ea"},
            ],
        },
        {
            id: "OP-2002",
            moId: "MO-1004",
            seq: 20,
            operation: "Final assembly",
            product: "Large Widget",
            productId: "ITM-002",
            workCenter: "WC-ASM",
            shift: "B (14–22)",
            status: "Running",
            qtyPlanned: 120,
            qtyGood: 35,
            qtyScrap: 0,
            dueTime: "2025-02-22 18:00",
            runtimeEstMin: 240,
            assignee: "K. Adams",
            materials: [
                {itemId: "ITM-003", item: "Plastic Case", req: 120, issued: 90, uom: "pcs"},
                {itemId: "ITM-009", item: "Screws M3x8", req: 600, issued: 540, uom: "ea"},
            ],
        },
        {
            id: "OP-2003",
            moId: "MO-1006",
            seq: 30,
            operation: "Paint coat RAL5010",
            product: "Plastic Case",
            productId: "ITM-003",
            workCenter: "WC-PAI",
            shift: "A (06–14)",
            status: "Queued",
            qtyPlanned: 300,
            qtyGood: 40,
            qtyScrap: 1,
            dueTime: "2025-02-24 12:00",
            runtimeEstMin: 90,
            assignee: "—",
            materials: [
                {itemId: "ITM-008", item: "Blue Paint (RAL5010)", req: 18, issued: 10, uom: "L"},
            ],
        },
        {
            id: "OP-2004",
            moId: "MO-1002",
            seq: 40,
            operation: "Functional test",
            product: "Assembly Kit 10",
            productId: "ITM-010",
            workCenter: "WC-QA",
            shift: "A (06–14)",
            status: "Done",
            qtyPlanned: 50,
            qtyGood: 50,
            qtyScrap: 0,
            dueTime: "2025-02-05 10:00",
            runtimeEstMin: 60,
            assignee: "M. Rivera",
            materials: [],
        },
    ];

    // ----- State -----
    const [rows, setRows] = useState(initialOps);
    const [expanded, setExpanded] = useState({});
    const [center, setCenter] = useState("all");
    const [shift, setShift] = useState("All");
    const [status, setStatus] = useState("all");
    const [query, setQuery] = useState("");
    const [sort, setSort] = useState({key: "dueTime", dir: "asc"});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    const STATUSES = ["Queued", "Running", "Paused", "Done"];
    const STATUS_CLS = {
        Queued: "bg-gray-600/30 text-gray-300",
        Running: "bg-green-600/30 text-green-300",
        Paused: "bg-yellow-600/30 text-yellow-300",
        Done: "bg-indigo-600/30 text-indigo-300",
    };

    // ----- Derived -----
    const filtered = useMemo(() => {
        let r = rows.slice();
        if (center !== "all") r = r.filter(x => x.workCenter === center);
        if (shift !== "All") r = r.filter(x => x.shift === shift);
        if (status !== "all") r = r.filter(x => x.status === status);
        if (query) {
            const q = query.toLowerCase();
            r = r.filter(x =>
                x.id.toLowerCase().includes(q) ||
                x.moId.toLowerCase().includes(q) ||
                x.operation.toLowerCase().includes(q) ||
                x.product.toLowerCase().includes(q) ||
                x.productId.toLowerCase().includes(q)
            );
        }
        const {key, dir} = sort;
        r.sort((a, b) => {
            const av = a[key], bv = b[key];
            let cmp = 0;
            if (key === "dueTime") cmp = new Date(av).getTime() - new Date(bv).getTime();
            else if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
            else cmp = String(av).localeCompare(String(bv), undefined, {numeric: true});
            return dir === "asc" ? cmp : -cmp;
        });
        return r;
    }, [rows, center, shift, status, query, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageStart = (page - 1) * pageSize;
    const paged = filtered.slice(pageStart, pageStart + pageSize);

    const shortages = useMemo(
        () => filtered.reduce((s, r) => s + (r.materials || []).filter(m => (m.req || 0) > (m.issued || 0)).length, 0),
        [filtered]
    );
    const wipOps = filtered.filter(r => r.status === "Running" || r.status === "Paused").length;
    const util = useMemo(() => {
        const running = filtered.filter(r => r.status === "Running").length;
        const centersShown = center === "all" ? new Set(filtered.map(r => r.workCenter)).size : 1;
        return centersShown ? Math.round((running / Math.max(centersShown * 3, 1)) * 100) : 0; // mock
    }, [filtered, center]);

    // ----- Helpers -----
    const th = (label, key, right = false) => (
        <th
            onClick={() => key && setSort(s => ({key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc"}))}
            className={`px-4 py-3 font-semibold text-gray-300 select-none ${key ? "cursor-pointer" : ""} ${right ? "text-right" : "text-left"}`}
        >
      <span className="inline-flex items-center gap-1">
        {label}
          {key && sort.key === key && <span className="text-gray-500">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </span>
        </th>
    );

    const toggleExpand = (id) => setExpanded(s => ({...s, [id]: !s[id]}));
    const setRow = (id, patch) => setRows(rs => rs.map(r => r.id === id ? {...r, ...patch} : r));

    const handleStart = (r) => {
        if (r.status === "Done") return;
        setRow(r.id, {status: "Running", assignee: r.assignee === "—" ? "Operator 1" : r.assignee});
    };
    const handlePause = (r) => {
        if (r.status !== "Running") return;
        setRow(r.id, {status: "Paused"});
    };
    const handleComplete = (r, good, scrap) => {
        const qtyGood = Math.max(0, Math.min(r.qtyPlanned, (r.qtyGood || 0) + Number(good || 0)));
        const qtyScrap = Math.max(0, (r.qtyScrap || 0) + Number(scrap || 0));
        setRow(r.id, {qtyGood, qtyScrap, status: qtyGood >= r.qtyPlanned ? "Done" : r.status});
    };

    // ----- Render -----
    return (
        <div
            className="min-h-[calc(100vh-140px)] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header + KPIs */}
            <header className="mx-auto px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Production</h1>
                        <p className="mt-2 text-gray-400">Live dispatch across work centers, shifts, and operations.</p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
                        <div className="text-xs text-gray-400">WIP Operations</div>
                        <div className="text-2xl font-semibold text-gray-100">{wipOps}</div>
                    </div>
                    <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
                        <div className="text-xs text-gray-400">Utilization (mock)</div>
                        <div className="text-2xl font-semibold text-gray-100">{util}%</div>
                        <div className="mt-2 h-2 rounded bg-gray-800">
                            <div className="h-2 rounded bg-green-600/70" style={{width: `${util}%`}}/>
                        </div>
                    </div>
                    <div className="rounded-xl bg-gray-900/60 border border-white/10 p-4">
                        <div className="text-xs text-gray-400">Component Shortages</div>
                        <div className="text-2xl font-semibold text-gray-100">{shortages}</div>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="mx-auto px-4 pb-4">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <select
                            value={center}
                            onChange={(e) => {
                                setCenter(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm min-w-[200px]"
                        >
                            <option value="all">All Work Centers</option>
                            {WORK_CENTERS.map(wc => <option key={wc.id} value={wc.id}>{wc.id} — {wc.name}</option>)}
                        </select>

                        <select
                            value={shift}
                            onChange={(e) => {
                                setShift(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm min-w-[160px]"
                        >
                            {SHIFTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm min-w-[160px]"
                        >
                            <option value="all">All Statuses</option>
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <div className="relative flex-1 min-w-[220px]">
                            <input
                                placeholder="Search OP/MO/Operation/Product…"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full rounded-lg bg-gray-800 border border-white/10 pl-3 pr-10 py-2 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">⌕</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dispatch Table */}
            <section className="mx-auto px-4 pb-12">
                <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/60">
                    <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-gray-900/80">
                        <tr>
                            {th("OP ID", "id")}
                            {th("MO", "moId")}
                            {th("Seq", "seq", true)}
                            {th("Operation", "operation")}
                            {th("Product", "product")}
                            {th("Center", "workCenter")}
                            {th("Shift", "shift")}
                            {th("Status", "status")}
                            {th("Good", "qtyGood", true)}
                            {th("Planned", "qtyPlanned", true)}
                            {th("Due", "dueTime")}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                        {paged.map(r => {
                            const overdue = r.status !== "Done" && new Date(r.dueTime) < new Date();
                            const p = r.qtyPlanned ? Math.min(100, Math.round((r.qtyGood / r.qtyPlanned) * 100)) : 0;

                            return (
                                <React.Fragment key={r.id}>
                                    <tr
                                        className={`transition cursor-pointer ${expanded[r.id] ? "bg-gray-800/70" : "hover:bg-gray-800/40"}`}
                                        onClick={() => toggleExpand(r.id)}
                                    >
                                        <td className="px-4 py-3 font-mono text-white">{r.id}</td>
                                        <td className="px-4 py-3">{r.moId}</td>
                                        <td className="px-4 py-3 text-right text-gray-200">{r.seq}</td>
                                        <td className="px-4 py-3 text-gray-200">{r.operation}</td>
                                        <td className="px-4 py-3 text-gray-200">{r.product} <span
                                            className="text-gray-500">({r.productId})</span></td>
                                        <td className="px-4 py-3 text-gray-300">{r.workCenter}</td>
                                        <td className="px-4 py-3 text-gray-300">{r.shift}</td>
                                        <td className="px-4 py-3"><span
                                            className={`px-2 py-1 text-xs rounded-full ${STATUS_CLS[r.status]}`}>{r.status}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-200">{r.qtyGood}</td>
                                        <td className="px-4 py-3 text-right text-gray-200">{r.qtyPlanned}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`text-gray-400 ${overdue ? "text-red-300" : ""}`}>{r.dueTime}</span>
                                            <div className="mt-1 h-1.5 rounded bg-gray-800">
                                                <div className="h-1.5 rounded bg-green-600/70"
                                                     style={{width: `${p}%`}}/>
                                            </div>
                                        </td>
                                    </tr>

                                    {expanded[r.id] && (
                                        <tr className="bg-gray-900/80">
                                            <td colSpan={11} className="px-6 py-4">
                                                {/* Operator panel + Materials (div grid, keeps borders intact) */}
                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                                    <div
                                                        className="rounded-xl border border-white/10 bg-gray-900/60 p-4">
                                                        <div className="text-sm font-semibold text-white mb-2">Action
                                                        </div>
                                                        <div className="flex gap-2 flex-wrap">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleStart(r);
                                                                }}
                                                                className="px-3 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-300 border border-green-500/30 text-sm"
                                                                disabled={r.status === "Running" || r.status === "Done"}
                                                            >
                                                                Start
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePause(r);
                                                                }}
                                                                className="px-3 py-2 rounded-lg bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 border border-yellow-500/30 text-sm"
                                                                disabled={r.status !== "Running"}
                                                            >
                                                                Pause
                                                            </button>
                                                            <CompleteForm row={r} onComplete={handleComplete}/>
                                                        </div>
                                                        <div className="mt-3 text-xs text-gray-400">
                                                            Est. runtime: <span
                                                            className="text-gray-200">{r.runtimeEstMin} min</span> •
                                                            Assignee: <span
                                                            className="text-gray-200">{r.assignee}</span>
                                                        </div>
                                                    </div>

                                                    <div
                                                        className="rounded-xl border border-white/10 bg-gray-900/60 p-4 lg:col-span-2">
                                                        <div
                                                            className="text-sm font-semibold text-white mb-2">Materials
                                                        </div>
                                                        <div
                                                            className="rounded-lg border border-gray-700 overflow-hidden">
                                                            <div
                                                                className="grid grid-cols-6 bg-gray-800/60 text-gray-400 text-xs font-medium">
                                                                <div className="px-2 py-1 col-span-3">Component</div>
                                                                <div className="px-2 py-1 text-right">Req.</div>
                                                                <div className="px-2 py-1 text-right">Issued</div>
                                                                <div className="px-2 py-1 text-right">UoM</div>
                                                            </div>
                                                            {(r.materials || []).map((m, i) => {
                                                                const short = (m.req || 0) - (m.issued || 0);
                                                                return (
                                                                    <div key={i}
                                                                         className="grid grid-cols-6 text-sm hover:bg-gray-800/40">
                                                                        <div className="px-2 py-1 col-span-3">
                                                                            <div
                                                                                className="text-gray-200">{m.item}</div>
                                                                            <div
                                                                                className="text-xs text-gray-500 font-mono">{m.itemId}</div>
                                                                        </div>
                                                                        <div
                                                                            className="px-2 py-1 text-right">{m.req}</div>
                                                                        <div
                                                                            className="px-2 py-1 text-right">{m.issued}</div>
                                                                        <div
                                                                            className="px-2 py-1 text-right text-gray-400">
                                                                            {m.uom}
                                                                            {short > 0 && <span
                                                                                className="ml-2 px-1.5 py-0.5 text-[10px] rounded bg-red-600/30 text-red-300">-{short}</span>}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                            {(!r.materials || r.materials.length === 0) && (
                                                                <div className="px-2 py-2 text-sm text-gray-400">No
                                                                    materials required.</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div
                    className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                        <span>Rows per page</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }}
                            className="rounded bg-gray-800 border border-white/10 px-2 py-1"
                        >
                            {[8, 16, 24].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        <span className="hidden sm:inline">•</span>
                        <span>Showing {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(filtered.length, pageStart + pageSize)} of {filtered.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-40">Prev
                        </button>
                        <span className="px-2">{page} / {totalPages}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className="px-3 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-40">Next
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

/** Inline form (raw JS) for completing Good/Scrap */
function CompleteForm({row, onComplete}) {
    const [good, setGood] = useState("");
    const [scrap, setScrap] = useState("");
    const remaining = Math.max(0, (row.qtyPlanned || 0) - (row.qtyGood || 0));
    const goodNum = Number(good || 0);
    const scrapNum = Number(scrap || 0);
    const disable = row.status === "Done" || goodNum < 0 || scrapNum < 0 || goodNum > remaining;

    return (
        <div className="flex items-center gap-2">
            <input
                value={good}
                onChange={(e) => setGood(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="Good"
                className="w-24 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                inputMode="numeric"
            />
            <input
                value={scrap}
                onChange={(e) => setScrap(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="Scrap"
                className="w-24 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                inputMode="numeric"
            />
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onComplete(row, goodNum, scrapNum);
                    setGood("");
                    setScrap("");
                }}
                disabled={disable}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-40"
                title={disable ? `Remaining ${remaining}` : "Complete quantity"}
            >
                Complete
            </button>
            <span className="text-xs text-gray-500">Remain: {remaining}</span>
        </div>
    );
}
