import React, {useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";

export default function PurchasingPage() {
    const navigate = useNavigate();

    const initial = [
        {
            id: "PO-5001",
            supplier: "Acme Components",
            orderDate: "2025-02-15",
            dueDate: "2025-02-22",
            status: "Open",
            currency: "EUR",
            totalCost: 6800.0,
            details: [
                {item: "Widget A", qty: 2000, price: 2.5},
                {item: "Widget B", qty: 2000, price: 1.9},
            ],
        },
        {
            id: "PO-5002",
            supplier: "NordFab Metals",
            orderDate: "2025-02-16",
            dueDate: "2025-02-25",
            status: "Approved",
            currency: "EUR",
            totalCost: 9200.0,
            details: [
                {item: "Metal Sheet", qty: 1000, price: 7.5},
                {item: "Bolts", qty: 150, price: 1.2},
            ],
        },
        {
            id: "PO-5003",
            supplier: "BrightChem",
            orderDate: "2025-02-10",
            dueDate: "2025-02-18",
            status: "Received",
            currency: "EUR",
            totalCost: 480.0,
            details: [{item: "Chemical X", qty: 120, price: 4.0}],
        },
        {
            id: "PO-5004",
            supplier: "Global Plastics Ltd.",
            orderDate: "2025-02-05",
            dueDate: "2025-02-20",
            status: "Draft",
            currency: "USD",
            totalCost: 3200.0,
            details: [
                {item: "Plastic Resin", qty: 500, price: 6.4},
                {item: "Additives", qty: 200, price: 2.0},
            ],
        },
        {
            id: "PO-5005",
            supplier: "EuroTech Fasteners",
            orderDate: "2025-02-01",
            dueDate: "2025-02-12",
            status: "Closed",
            currency: "EUR",
            totalCost: 1500.0,
            details: [
                {item: "Screws M5", qty: 5000, price: 0.25},
                {item: "Washers", qty: 5000, price: 0.05},
            ],
        },
        {
            id: "PO-5006",
            supplier: "AsiaSteel Corp",
            orderDate: "2025-02-12",
            dueDate: "2025-03-05",
            status: "Hold",
            currency: "USD",
            totalCost: 24500.0,
            details: [
                {item: "Steel Rods", qty: 700, price: 25.0},
                {item: "Plates", qty: 300, price: 40.0},
            ],
        },
        {
            id: "PO-5007",
            supplier: "EcoPackaging",
            orderDate: "2025-02-14",
            dueDate: "2025-02-28",
            status: "Cancelled",
            currency: "EUR",
            totalCost: 0.0,
            details: [{item: "Carton Boxes", qty: 0, price: 0}],
        },
        {
            id: "PO-5011",
            supplier: "GreenEnergy Solutions",
            orderDate: "2025-02-19",
            dueDate: "2025-03-10",
            status: "Draft",
            currency: "EUR",
            totalCost: 18400.0,
            details: [
                {item: "Solar Panel 300W", qty: 100, price: 150.0},
                {item: "Mounting Kit", qty: 100, price: 34.0},
            ],
        },
        {
            id: "PO-5012",
            supplier: "FoodPack Co.",
            orderDate: "2025-02-03",
            dueDate: "2025-02-10",
            status: "Cancelled",
            currency: "EUR",
            totalCost: 0.0,
            details: [{item: "Plastic Trays", qty: 0, price: 0}],
        },
        {
            id: "PO-5013",
            supplier: "AutoMech Tools",
            orderDate: "2025-02-12",
            dueDate: "2025-02-20",
            status: "Hold",
            currency: "USD",
            totalCost: 6800.0,
            details: [
                {item: "Hydraulic Pump", qty: 12, price: 400.0},
                {item: "Valve Set", qty: 40, price: 50.0},
            ],
        },
        {
            id: "PO-5014",
            supplier: "EuroChemicals",
            orderDate: "2025-02-08",
            dueDate: "2025-02-15",
            status: "Received",
            currency: "EUR",
            totalCost: 1500.0,
            details: [
                {item: "Lab Solvent A", qty: 100, price: 10.0},
                {item: "Lab Solvent B", qty: 50, price: 20.0},
            ],
        },
    ];

    const [pos] = useState(initial);
    const [expanded, setExpanded] = useState({});
    const [selected, setSelected] = useState({});
    const [query, setQuery] = useState("");
    const [supplier, setSupplier] = useState("all");
    const [status, setStatus] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [targetStatus, setTargetStatus] = useState("Open");
    const [sort, setSort] = useState({key: "orderDate", dir: "desc"});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    const suppliers = useMemo(
        () => ["all", ...Array.from(new Set(pos.map((d) => d.supplier)))],
        [pos]
    );

    const STATUSES = [
        "Draft",
        "Open",
        "Approved",
        "Received",
        "Closed",
        "Cancelled",
        "Hold",
    ];

    const STATUS_CLS = {
        Draft: "bg-blue-600/30 text-blue-300",
        Open: "bg-green-600/30 text-green-400",
        Approved: "bg-emerald-600/30 text-emerald-300",
        Received: "bg-indigo-600/30 text-indigo-300",
        Closed: "bg-gray-600/30 text-gray-400",
        Cancelled: "bg-red-600/30 text-red-300",
        Hold: "bg-yellow-600/30 text-yellow-400",
    };

    const th = (label, key, right = false) => (
        <th
            onClick={() =>
                key && setSort((s) => ({key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc"}))
            }
            className={`px-4 py-3 font-semibold text-gray-300 select-none ${
                key ? "cursor-pointer" : ""
            } ${right ? "text-right" : "text-left"}`}
        >
      <span className="inline-flex items-center gap-1">
        {label}
          {key && sort.key === key && (
              <span className="text-gray-500">{sort.dir === "asc" ? "▲" : "▼"}</span>
          )}
      </span>
        </th>
    );

    const filtered = useMemo(() => {
        let rows = [...pos];
        if (query) {
            const q = query.toLowerCase();
            rows = rows.filter(
                (r) => r.id.toLowerCase().includes(q) || r.supplier.toLowerCase().includes(q)
            );
        }
        if (supplier !== "all") rows = rows.filter((r) => r.supplier === supplier);
        if (status !== "all") rows = rows.filter((r) => r.status === status);
        if (dateFrom) rows = rows.filter((r) => r.orderDate >= dateFrom);
        if (dateTo) rows = rows.filter((r) => r.orderDate <= dateTo);

        const {key, dir} = sort;
        rows = rows.sort((a, b) => {
            const av = a[key];
            const bv = b[key];
            let res = 0;
            if (["orderDate", "dueDate"].includes(key))
                res = new Date(av).getTime() - new Date(bv).getTime();
            else if (typeof av === "number" && typeof bv === "number") res = av - bv;
            else res = String(av).localeCompare(String(bv), undefined, {numeric: true});
            return dir === "asc" ? res : -res;
        });
        return rows;
    }, [pos, query, supplier, status, dateFrom, dateTo, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageStart = (page - 1) * pageSize;
    const paged = filtered.slice(pageStart, pageStart + pageSize);

    const toggleExpand = (id) => setExpanded((s) => ({...s, [id]: !s[id]}));
    const toggleSelect = (id) => setSelected((s) => ({...s, [id]: !s[id]}));
    const allSelected = paged.length > 0 && paged.every((po) => selected[po.id]);
    const toggleAll = () => {
        const next = {...selected};
        if (allSelected) paged.forEach((po) => delete next[po.id]);
        else paged.forEach((po) => (next[po.id] = true));
        setSelected(next);
    };
    const selectedCount = Object.values(selected).filter(Boolean).length;

    const fmtCurrency = (value, currency) =>
        new Intl.NumberFormat(undefined, {style: "currency", currency}).format(value || 0);

    return (
        <div
            className="min-h-[calc(100vh-140px)] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">

            {/* Header */}
            <header className="mx-auto px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Purchasing</h1>
                        <p className="mt-2 text-gray-400">Manage purchase orders, suppliers, and approvals.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate("/purchasing/new")}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                        >
                            + New PO
                        </button>
                        <button
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">
                            Import CSV
                        </button>
                    </div>
                </div>
            </header>

            {/* Filters */}
            <div className="mx-auto px-4 pb-4">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <select
                            value={supplier}
                            onChange={(e) => {
                                setSupplier(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm min-w-[160px]"
                        >
                            {suppliers.map((s) => (
                                <option key={s} value={s}>
                                    {s === "all" ? "All Suppliers" : s}
                                </option>
                            ))}
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
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => {
                                setDateFrom(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => {
                                setDateTo(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                        />
                        <div className="relative flex-1 min-w-[200px]">
                            <input
                                placeholder="Search PO ID or Supplier…"
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
                    <div className="flex flex-wrap gap-2 items-center">
                        <select
                            value={targetStatus}
                            onChange={(e) => setTargetStatus(e.target.value)}
                            disabled={selectedCount === 0}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm disabled:opacity-40"
                        >
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>
                        <button
                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700">
                            Export CSV
                        </button>
                        <button
                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700">
                            Print / PDF
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <section className="mx-auto px-4 pb-12">
                <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/60">
                    <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-gray-900/80">
                        <tr>
                            <th className="px-4 py-3">
                                <input type="checkbox" checked={allSelected} onChange={toggleAll}/>
                            </th>
                            {th("PO ID", "id")}
                            {th("Supplier", "supplier")}
                            {th("Order Date", "orderDate")}
                            {th("Due Date", "dueDate")}
                            {th("Status", "status")}
                            {th("Total", "totalCost", true)}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                        {paged.map((po) => (
                            <React.Fragment key={po.id}>
                                <tr
                                    className={`transition cursor-pointer ${
                                        expanded[po.id] ? "bg-gray-800/70" : "hover:bg-gray-800/40"
                                    }`}
                                    onClick={() => toggleExpand(po.id)}
                                >
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={!!selected[po.id]}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={() => toggleSelect(po.id)}
                                        />
                                    </td>
                                    <td className="px-4 py-3 font-mono text-white">{po.id}</td>
                                    <td className="px-4 py-3 text-gray-200">{po.supplier}</td>
                                    <td className="px-4 py-3 text-gray-400">{po.orderDate}</td>
                                    <td className="px-4 py-3 text-gray-400">{po.dueDate}</td>
                                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${STATUS_CLS[po.status] || ""}`}>
                        {po.status}
                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-200">
                                        {fmtCurrency(po.totalCost, po.currency || "EUR")}
                                    </td>
                                </tr>
                                {expanded[po.id] && (
                                    <tr className="bg-gray-900/80 border-t border-b border-blue-500/40">
                                        <td colSpan={7} className="px-6 py-4">
                                            <div className="mb-2 flex items-center justify-between">
                                                <h4 className="text-sm font-semibold text-blue-400">
                                                    Lines for {po.id} — {po.supplier}
                                                </h4>
                                            </div>
                                            <table className="min-w-full text-sm border border-gray-700 rounded-lg">
                                                <thead className="bg-gray-800/60">
                                                <tr className="text-gray-400">
                                                    <th className="text-left px-2 py-1">Item</th>
                                                    <th className="text-right px-2 py-1">Qty</th>
                                                    <th className="text-right px-2 py-1">Price</th>
                                                    <th className="text-right px-2 py-1">Line Total</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                {po.details.map((line, i) => (
                                                    <tr key={i} className="hover:bg-gray-800/40">
                                                        <td className="px-2 py-1">{line.item}</td>
                                                        <td className="px-2 py-1 text-right">{line.qty}</td>
                                                        <td className="px-2 py-1 text-right">{fmtCurrency(line.price, po.currency)}</td>
                                                        <td className="px-2 py-1 text-right">
                                                            {fmtCurrency(line.qty * line.price, po.currency)}
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
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
              Showing {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(filtered.length, pageStart + pageSize)} of {filtered.length}
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
                        <span className="px-2">{page} / {totalPages}</span>
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
        </div>
    );
}

export {PurchasingPage};
