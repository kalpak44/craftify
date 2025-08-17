import React, {useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";

/**
 * InventoryPage — styles aligned with WorkOrdersPage
 * - Filters (Location, Status) + search
 * - Sortable table, selection, bulk actions
 * - Pagination identical to WorkOrdersPage
 */

export default function InventoryPage() {
    const navigate = useNavigate();

    // Mock data (one row per item/location/bin/lot)
    const data = [
        {
            item: "Assembly Kit 10",
            itemId: "ITM-010",
            uom: "kit",
            location: "Main WH",
            bin: "KIT-1",
            lot: "",
            onHand: 5,
            allocated: 1,
            reorderPt: 0,
            hold: false
        },
        {
            item: "Blue Paint (RAL5010)",
            itemId: "ITM-008",
            uom: "L",
            location: "Chem Store",
            bin: "PA-1",
            lot: "P-2025-02",
            onHand: 12,
            allocated: 2,
            reorderPt: 8,
            hold: true
        },
        {
            item: "Chain Bracket",
            itemId: "ITM-005",
            uom: "pcs",
            location: "Main WH",
            bin: "D1",
            lot: "CB-0101",
            onHand: 1320,
            allocated: 800,
            reorderPt: 100,
            hold: false
        },
        {
            item: "Front Assembly",
            itemId: "ITM-006",
            uom: "ea",
            location: "Main WH",
            bin: "A1",
            lot: "",
            onHand: 208,
            allocated: 230,
            reorderPt: 30,
            hold: false
        },
        {
            item: "Large Widget",
            itemId: "ITM-002",
            uom: "pcs",
            location: "Main WH",
            bin: "B4",
            lot: "LW-2502",
            onHand: 310,
            allocated: 600,
            reorderPt: 150,
            hold: false
        },
        {
            item: "Lion Bracket",
            itemId: "ITM-004",
            uom: "pcs",
            location: "Main WH",
            bin: "D3",
            lot: "",
            onHand: 350,
            allocated: 200,
            reorderPt: 100,
            hold: false
        },
        {
            item: "Plastic Case",
            itemId: "ITM-003",
            uom: "pcs",
            location: "Main WH",
            bin: "C2",
            lot: "",
            onHand: 1350,
            allocated: 330,
            reorderPt: 200,
            hold: false
        },
        {
            item: "Screws M3×8",
            itemId: "ITM-009",
            uom: "ea",
            location: "Main WH",
            bin: "H8",
            lot: "",
            onHand: 1500,
            allocated: 300,
            reorderPt: 1000,
            hold: false
        },
    ];

    // State
    const [query, setQuery] = useState("");
    const [location, setLocation] = useState("all");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState({key: "item", dir: "asc"});
    const [selected, setSelected] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    // Helpers
    const computeStatus = (r) => {
        if (r.hold) return "Hold";
        if (r.onHand <= 0) return "Out";
        if (r.reorderPt && r.onHand <= r.reorderPt) return "Low";
        return "In Stock";
    };

    const STATUS_CLS = {
        "In Stock": "bg-green-600/30 text-green-400",
        Low: "bg-yellow-600/30 text-yellow-400",
        Out: "bg-red-600/30 text-red-300",
        Hold: "bg-gray-600/30 text-gray-400",
    };
    const pill = (value) => (
        <span className={`px-2 py-1 text-xs rounded-full ${STATUS_CLS[value] || ""}`}>{value}</span>
    );

    // Derived rows
    const filtered = useMemo(() => {
        let rows = data.map((r) => ({
            ...r,
            available: r.onHand - r.allocated,
            invStatus: computeStatus(r),
        }));

        if (query) {
            const q = query.toLowerCase();
            rows = rows.filter(
                (r) =>
                    r.item.toLowerCase().includes(q) ||
                    r.itemId.toLowerCase().includes(q) ||
                    (r.lot || "").toLowerCase().includes(q) ||
                    (r.bin || "").toLowerCase().includes(q)
            );
        }
        if (location !== "all") rows = rows.filter((r) => r.location === location);
        if (status !== "all") rows = rows.filter((r) => r.invStatus === status);

        const {key, dir} = sort;
        rows = [...rows].sort((a, b) => {
            const av = a[key],
                bv = b[key];
            const cmp = ["onHand", "allocated", "available", "reorderPt"].includes(key)
                ? av - bv
                : String(av).localeCompare(String(bv), undefined, {numeric: true});
            return dir === "asc" ? cmp : -cmp;
        });
        return rows;
    }, [data, query, location, status, sort]);

    // Paging
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageStart = (page - 1) * pageSize;
    const paged = filtered.slice(pageStart, pageStart + pageSize);

    // Selection
    const rowId = (r) => `${r.itemId}|${r.location}|${r.bin}|${r.lot || "-"}`;
    const toggleOne = (id) => setSelected((s) => ({...s, [id]: !s[id]}));
    const allOnPageSelected = paged.length > 0 && paged.every((r) => selected[rowId(r)]);
    const toggleAll = () => {
        const next = {...selected};
        if (allOnPageSelected) paged.forEach((r) => delete next[rowId(r)]);
        else paged.forEach((r) => (next[rowId(r)] = true));
        setSelected(next);
    };
    const selectedCount = Object.values(selected).filter(Boolean).length;

    // Table header cell (same as WorkOrdersPage)
    const th = (label, key, right = false) => (
        <th
            onClick={() =>
                setSort((s) => ({key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc"}))
            }
            className={`px-4 py-3 font-semibold text-gray-300 select-none cursor-pointer ${
                right ? "text-right" : "text-left"
            }`}
        >
      <span className="inline-flex items-center gap-1">
        {label}
          {sort.key === key && (
              <span className="text-gray-500">{sort.dir === "asc" ? "▲" : "▼"}</span>
          )}
      </span>
        </th>
    );

    const locations = ["Main WH", "Chem Store", "Yard", "Electronics"];

    return (
        <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Inventory</h1>
                        <p className="mt-2 text-gray-400">Search, filter, and manage stock across locations.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                            onClick={() => navigate("/inventory/transfer")}
                        >
                            Transfer
                        </button>
                        <button
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                            onClick={() => navigate("/inventory/adjust")}
                        >
                            Adjust
                        </button>
                        <button
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                            onClick={() => navigate("/inventory/receive")}>
                            Receive
                        </button>
                    </div>
                </div>
            </header>

            {/* Toolbar (same card styles) */}
            <div className="mx-auto max-w-6xl px-4 pb-4">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <select
                            value={location}
                            onChange={(e) => {
                                setLocation(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                        >
                            <option value="all">All Locations</option>
                            {locations.map((l) => (
                                <option key={l} value={l}>
                                    {l}
                                </option>
                            ))}
                        </select>

                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                        >
                            <option value="all">All Statuses</option>
                            {["In Stock", "Low", "Out", "Hold"].map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>

                        <div className="relative flex-1">
                            <input
                                placeholder="Search Item, Item ID, Lot/Serial, or Bin…"
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
                        </div>
                    </div>
                </div>
            </div>

            {/* Table (identical structure/borders to WO page) */}
            <section className="mx-auto max-w-6xl px-4 pb-12">
                <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/60">
                    <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-gray-900/80">
                        <tr>
                            <th className="px-4 py-3">
                                <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll}/>
                            </th>
                            {th("Item", "item")}
                            {th("Item ID", "itemId")}
                            {th("Location", "location")}
                            {th("Bin", "bin")}
                            {th("Lot/Serial", "lot")}
                            {th("UoM", "uom")}
                            {th("On hand", "onHand", true)}
                            {th("Allocated", "allocated", true)}
                            {th("Available", "available", true)}
                            {th("Reorder pt", "reorderPt", true)}
                            {th("Status", "invStatus")}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                        {paged.map((r) => {
                            const id = rowId(r);
                            const availClass =
                                r.available < 0
                                    ? "text-red-300"
                                    : r.available <= (r.reorderPt || 0)
                                        ? "text-yellow-300"
                                        : "text-gray-200";
                            return (
                                <tr key={id} className="hover:bg-gray-800/40 transition">
                                    <td className="px-4 py-3">
                                        <input type="checkbox" checked={!!selected[id]} onChange={() => toggleOne(id)}/>
                                    </td>
                                    <td className="px-4 py-3 text-gray-200">{r.item}</td>
                                    <td className="px-4 py-3 text-gray-400">{r.itemId}</td>
                                    <td className="px-4 py-3 text-gray-400">{r.location}</td>
                                    <td className="px-4 py-3 text-gray-400">{r.bin}</td>
                                    <td className="px-4 py-3 text-gray-400">{r.lot || "—"}</td>
                                    <td className="px-4 py-3 text-gray-400">{r.uom}</td>
                                    <td className="px-4 py-3 text-right text-gray-200">{r.onHand}</td>
                                    <td className="px-4 py-3 text-right text-gray-200">{r.allocated}</td>
                                    <td className={`px-4 py-3 text-right ${availClass}`}>{r.available}</td>
                                    <td className="px-4 py-3 text-right text-gray-200">{r.reorderPt}</td>
                                    <td className="px-4 py-3">{pill(r.invStatus)}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination — copied from WorkOrdersPage */}
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

export {InventoryPage};
