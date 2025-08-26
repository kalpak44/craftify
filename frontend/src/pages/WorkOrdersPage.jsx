import React, {useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";

export const WorkOrdersPage = () => {
    const initialData = [
        {
            id: "WO-1001",
            product: "Front Assembly",
            itemId: "ITM-006",
            qty: 50,
            status: "Open",
            priority: "High",
            due: "2025-02-25",
            updated: "2025-02-18"
        },
        {
            id: "WO-1002",
            product: "Large Widget",
            itemId: "ITM-002",
            qty: 120,
            status: "In Progress",
            priority: "Rush",
            due: "2025-02-22",
            updated: "2025-02-19"
        },
        {
            id: "WO-1003",
            product: "Plastic Case",
            itemId: "ITM-003",
            qty: 500,
            status: "Completed",
            priority: "Low",
            due: "2025-02-10",
            updated: "2025-02-11"
        },
        {
            id: "WO-1004",
            product: "Chain Bracket",
            itemId: "ITM-005",
            qty: 800,
            status: "Open",
            priority: "Medium",
            due: "2025-03-01",
            updated: "2025-02-17"
        },
        {
            id: "WO-1005",
            product: "Lion Bracket",
            itemId: "ITM-004",
            qty: 200,
            status: "Hold",
            priority: "High",
            due: "2025-02-28",
            updated: "2025-02-18"
        },
        {
            id: "WO-1006",
            product: "Screws M3×8",
            itemId: "ITM-009",
            qty: 3000,
            status: "Cancelled",
            priority: "Low",
            due: "2025-02-20",
            updated: "2025-02-12"
        },
        {
            id: "WO-1007",
            product: "Steel Frame",
            itemId: "ITM-007",
            qty: 90,
            status: "In Progress",
            priority: "High",
            due: "2025-02-26",
            updated: "2025-02-19"
        },
        {
            id: "WO-1008",
            product: "Blue Paint Pack",
            itemId: "ITM-008",
            qty: 30,
            status: "Open",
            priority: "Medium",
            due: "2025-02-24",
            updated: "2025-02-18"
        },
        {
            id: "WO-1009",
            product: "Assembly Kit 10",
            itemId: "ITM-010",
            qty: 12,
            status: "Completed",
            priority: "Low",
            due: "2024-12-05",
            updated: "2024-12-06"
        },
        {
            id: "WO-1010",
            product: "Warm Yellow LED",
            itemId: "ITM-001",
            qty: 400,
            status: "Open",
            priority: "Rush",
            due: "2025-02-21",
            updated: "2025-02-19"
        },
    ];

    const STATUSES = ["Open", "In Progress", "Hold", "Completed", "Cancelled"];

    const navigate = useNavigate();

    // --- State
    const [rows, setRows] = useState(initialData); // make data mutable for Kanban drag updates
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState({key: "id", dir: "asc"});
    const [selected, setSelected] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [view, setView] = useState("table"); // "table" | "kanban"
    const [dragOverCol, setDragOverCol] = useState(null); // for kanban column highlight

    // --- Derived
    const filtered = useMemo(() => {
        let data = rows;
        if (query) {
            const q = query.toLowerCase();
            data = data.filter(
                (r) =>
                    r.id.toLowerCase().includes(q) ||
                    r.product.toLowerCase().includes(q) ||
                    r.itemId.toLowerCase().includes(q)
            );
        }
        if (status !== "all") data = data.filter((r) => r.status === status);

        const {key, dir} = sort;
        data = [...data].sort((a, b) => {
            const av = a[key],
                bv = b[key];
            const cmp =
                key === "qty"
                    ? av - bv
                    : String(av).localeCompare(String(bv), undefined, {numeric: true});
            return dir === "asc" ? cmp : -cmp;
        });
        return data;
    }, [rows, query, status, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageStart = (page - 1) * pageSize;
    const paged = filtered.slice(pageStart, pageStart + pageSize);

    const toggleOne = (id) =>
        setSelected((s) => ({...s, [id]: !s[id]}));
    const allOnPageSelected =
        (view === "table"
            ? paged.length > 0 && paged.every((r) => selected[r.id])
            : filtered.length > 0 && filtered.every((r) => selected[r.id]));
    const toggleAll = () => {
        const scope = view === "table" ? paged : filtered;
        const next = {...selected};
        if (allOnPageSelected) scope.forEach((r) => delete next[r.id]);
        else scope.forEach((r) => (next[r.id] = true));
        setSelected(next);
    };
    const selectedCount = Object.values(selected).filter(Boolean).length;

    const th = (label, key, right = false) => (
        <th
            onClick={() =>
                setSort((s) => ({
                    key,
                    dir: s.key === key && s.dir === "asc" ? "desc" : "asc",
                }))
            }
            className={`px-4 py-3 font-semibold text-gray-300 select-none cursor-pointer ${
                right ? "text-right" : "text-left"
            }`}
        >
      <span className="inline-flex items-center gap-1">
        {label}
          {sort.key === key && (
              <span className="text-gray-500">
            {sort.dir === "asc" ? "▲" : "▼"}
          </span>
          )}
      </span>
        </th>
    );

    const pill = (value, map) => (
        <span
            className={`px-2 py-1 text-xs rounded-full ${
                map[value] || "bg-gray-600/30 text-gray-300"
            }`}
        >
      {value}
    </span>
    );

    const STATUS_CLS = {
        Open: "bg-blue-600/30 text-blue-300",
        "In Progress": "bg-indigo-600/30 text-indigo-300",
        Completed: "bg-green-600/30 text-green-400",
        Hold: "bg-yellow-600/30 text-yellow-400",
        Cancelled: "bg-gray-600/30 text-gray-400",
    };
    const PRIORITY_CLS = {
        Low: "bg-gray-600/30 text-gray-300",
        Medium: "bg-sky-600/30 text-sky-300",
        High: "bg-orange-600/30 text-orange-300",
        Rush: "bg-red-600/30 text-red-300",
    };
    const PRIORITY_BORDER = {
        Low: "border-l-gray-500",
        Medium: "border-l-sky-500",
        High: "border-l-orange-500",
        Rush: "border-l-red-500",
    };
    const PRIORITY_DOT = {
        Low: "bg-gray-400",
        Medium: "bg-sky-400",
        High: "bg-orange-400",
        Rush: "bg-red-400",
    };

    // --- Kanban helpers (HTML5 drag & drop, raw JS)
    const onDragStart = (e, woId) => {
        e.dataTransfer.setData("text/plain", woId);
        e.dataTransfer.effectAllowed = "move";
    };
    const onDragOver = (e, col) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverCol !== col) setDragOverCol(col);
    };
    const onDragLeave = () => {
        setDragOverCol(null);
    };
    const onDrop = (e, newStatus) => {
        e.preventDefault();
        const woId = e.dataTransfer.getData("text/plain");
        setRows((old) =>
            old.map((r) =>
                r.id === woId
                    ? {
                        ...r,
                        status: newStatus,
                        updated: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
                    }
                    : r
            )
        );
        setDragOverCol(null);
    };

    const Column = ({title, items}) => (
        <div
            className={`flex flex-col rounded-xl border border-white/10 bg-gray-900/60 min-h-[500px] ${
                dragOverCol === title ? "ring-2 ring-blue-500/60" : ""
            }`}
            onDragOver={(e) => onDragOver(e, title)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, title)}
            role="list"
            aria-label={`${title} column`}
        >
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/60">
                <div className="flex items-center gap-2">
          <span
              className={`h-2.5 w-2.5 rounded-full ${
                  title === "Open"
                      ? "bg-blue-400"
                      : title === "In Progress"
                          ? "bg-indigo-400"
                          : title === "Completed"
                              ? "bg-green-400"
                              : title === "Hold"
                                  ? "bg-yellow-400"
                                  : "bg-gray-400"
              }`}
          />
                    <h3 className="font-semibold text-gray-200">{title}</h3>
                </div>
                <span className="text-xs text-gray-400">{items.length}</span>
            </div>
            <div className="flex flex-col gap-3 p-3">
                {items.map((wo) => (
                    <div
                        key={wo.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, wo.id)}
                        className={`group border-l-4 ${PRIORITY_BORDER[wo.priority]} rounded-lg bg-gray-800/70 border border-gray-800/80 hover:bg-gray-800 transition shadow-sm`}
                        role="listitem"
                    >
                        <div className="flex items-start gap-2 p-3">
                            <input
                                type="checkbox"
                                checked={!!selected[wo.id]}
                                onChange={() => toggleOne(wo.id)}
                                className="mt-0.5"
                                aria-label={`Select ${wo.id}`}
                            />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-white">{wo.id}</span>
                                        <span className="text-xs text-gray-500">•</span>
                                        <span className="text-sm text-gray-300">{wo.product}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                    <span
                        className={`h-2 w-2 rounded-full ${PRIORITY_DOT[wo.priority]}`}
                        title={`Priority: ${wo.priority}`}
                    />
                                        {pill(wo.priority, PRIORITY_CLS)}
                                    </div>
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-400">
                                    <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-gray-900/60 border border-white/10 text-gray-300">
                      {wo.itemId}
                    </span>
                                        <span>Qty: <span className="text-gray-300">{wo.qty}</span></span>
                                    </div>
                                    <div className="text-right">
                                        Due <span className="text-gray-300">{wo.due}</span>
                                    </div>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                                    <div className="inline-flex items-center gap-1">
                                        Status: {pill(wo.status, STATUS_CLS)}
                                    </div>
                                    <div>Updated {wo.updated}</div>
                                </div>
                            </div>
                        </div>

                        {/* Ticket toolbox (applicable tools) */}
                        <div className="px-3 pb-3">
                            <div className="flex items-center gap-2">
                                <button
                                    className="px-2.5 py-1 rounded bg-gray-900/60 border border-white/10 text-xs hover:bg-gray-800">
                                    View
                                </button>
                                <button
                                    className="px-2.5 py-1 rounded bg-gray-900/60 border border-white/10 text-xs hover:bg-gray-800">
                                    Edit
                                </button>
                                <button
                                    className="px-2.5 py-1 rounded bg-gray-900/60 border border-white/10 text-xs hover:bg-gray-800">
                                    Print
                                </button>
                                <button
                                    className="px-2.5 py-1 rounded bg-gray-900/60 border border-white/10 text-xs hover:bg-gray-800">
                                    Label
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="text-sm text-gray-500 px-2 py-4 text-center">
                        No tickets here.
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div
            className="min-h-[calc(100vh-140px)] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Work Orders</h1>
                        <p className="mt-2 text-gray-400">Issue, track, and complete production orders.</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        {/* View switcher (styled to match header controls) */}
                        <select
                            value={view}
                            onChange={(e) => setView(e.target.value)}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                            aria-label="View mode"
                            title="Switch between Table and Kanban view"
                        >
                            <option value="table">Table View</option>
                            <option value="kanban">Kanban View</option>
                        </select>

                        <button
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                            onClick={() => navigate("/work-orders/new")}
                        >
                            + New Work Order
                        </button>
                        <button
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">
                            Import CSV
                        </button>
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className="mx-auto max-w-6xl px-4 pb-4">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                        >
                            <option value="all">All Statuses</option>
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>

                        <div className="relative flex-1">
                            <input
                                placeholder="Search WO ID, Product, or Item ID…"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full rounded-lg bg-gray-800 border border-white/10 pl-3 pr-10 py-2 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">⌕</span>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700">
                                Export CSV
                            </button>
                            <button
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700">
                                Print / PDF
                            </button>
                            <button
                                disabled={!selectedCount}
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm disabled:opacity-40"
                            >
                                Delete
                            </button>
                            <span className="text-xs text-gray-500">
                {selectedCount ? `${selectedCount} selected` : ""}
              </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            {view === "table" ? (
                <section className="mx-auto max-w-6xl px-4 pb-12">
                    <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/60">
                        <table className="min-w-full divide-y divide-gray-800 text-sm">
                            <thead className="bg-gray-900/80">
                            <tr>
                                <th className="px-4 py-3">
                                    <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll}/>
                                </th>
                                {th("WO ID", "id")}
                                {th("Product", "product")}
                                {th("Item ID", "itemId")}
                                {th("Qty", "qty", true)}
                                {th("Status", "status")}
                                {th("Priority", "priority")}
                                {th("Due Date", "due")}
                                {th("Last Updated", "updated")}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                            {paged.map((wo) => (
                                <tr key={wo.id} className="hover:bg-gray-800/40 transition">
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={!!selected[wo.id]}
                                            onChange={() => toggleOne(wo.id)}
                                        />
                                    </td>
                                    <td className="px-4 py-3 font-mono text-white">{wo.id}</td>
                                    <td className="px-4 py-3 text-gray-200">{wo.product}</td>
                                    <td className="px-4 py-3 text-gray-400">{wo.itemId}</td>
                                    <td className="px-4 py-3 text-right text-gray-200">{wo.qty}</td>
                                    <td className="px-4 py-3">{pill(wo.status, STATUS_CLS)}</td>
                                    <td className="px-4 py-3">{pill(wo.priority, PRIORITY_CLS)}</td>
                                    <td className="px-4 py-3 text-gray-400">{wo.due}</td>
                                    <td className="px-4 py-3 text-gray-400">{wo.updated}</td>
                                </tr>
                            ))}
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
                                {[8, 16, 24].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                            <span className="hidden sm:inline">•</span>
                            <span>
                Showing <span className="text-gray-300">{filtered.length === 0 ? 0 : pageStart + 1}</span>–
                <span className="text-gray-300">{Math.min(filtered.length, pageStart + pageSize)}</span> of
                <span className="text-gray-300"> {filtered.length}</span>
              </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-40"
                            >
                                Prev
                            </button>
                            <span className="px-2">
                {page} / {totalPages}
              </span>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="px-3 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>
            ) : (
                // --- Kanban View ---
                <section className="mx-auto w-full px-4 pb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                        {STATUSES.map((s) => (
                            <Column
                                key={s}
                                title={s}
                                items={filtered.filter((r) => r.status === s)}
                            />
                        ))}
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                        Tip: Drag tickets between columns to change status. Ticket color indicates priority.
                    </div>
                </section>
            )}
        </div>
    );
};

export default WorkOrdersPage;
