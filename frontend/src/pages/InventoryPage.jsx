import React, {useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";

/**
 * InventoryPage
 *
 * ERP-style inventory list with responsive UI.
 * Updates in this version:
 * - Solid background (gradient removed).
 * - Mobile card list (< md) and desktop table (>= md) with the same features.
 *
 * Features:
 * - Search, filter by category/UoM, sortable columns.
 * - Row selection with select-all-on-page.
 * - CSV export and print-friendly view.
 * - Pagination.
 * - Clicking a row/card opens /inventory/:itemId.
 */
export default function InventoryPage() {
    const navigate = useNavigate();

    // Mock data (one row per item) — includes category
    const data = [
        {
            item: "Assembly Kit 10",
            itemId: "ITM-010",
            category: "Assemblies",
            uom: "kit",
            onHand: 5,
            allocated: 1,
            reorderPt: 0,
            hold: false
        },
        {
            item: "Blue Paint (RAL5010)",
            itemId: "ITM-008",
            category: "Paints",
            uom: "L",
            onHand: 12,
            allocated: 2,
            reorderPt: 8,
            hold: true
        },
        {
            item: "Chain Bracket",
            itemId: "ITM-005",
            category: "Hardware",
            uom: "pcs",
            onHand: 1320,
            allocated: 800,
            reorderPt: 100,
            hold: false
        },
        {
            item: "Front Assembly",
            itemId: "ITM-006",
            category: "Assemblies",
            uom: "ea",
            onHand: 208,
            allocated: 230,
            reorderPt: 30,
            hold: false
        },
        {
            item: "Large Widget",
            itemId: "ITM-002",
            category: "Components",
            uom: "pcs",
            onHand: 310,
            allocated: 600,
            reorderPt: 150,
            hold: false
        },
        {
            item: "Lion Bracket",
            itemId: "ITM-004",
            category: "Hardware",
            uom: "pcs",
            onHand: 350,
            allocated: 200,
            reorderPt: 100,
            hold: false
        },
        {
            item: "Plastic Case",
            itemId: "ITM-003",
            category: "Components",
            uom: "pcs",
            onHand: 1350,
            allocated: 330,
            reorderPt: 200,
            hold: false
        },
        {
            item: "Screws M3×8",
            itemId: "ITM-009",
            category: "Fasteners",
            uom: "ea",
            onHand: 1500,
            allocated: 300,
            reorderPt: 1000,
            hold: false
        },
    ];

    // State
    const [query, setQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [uomFilter, setUomFilter] = useState("all");
    const [sort, setSort] = useState({key: "itemId", dir: "asc"});
    const [selected, setSelected] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    // Options for filters (aligned with ItemsPage style)
    const categories = useMemo(() => ["all", ...Array.from(new Set(data.map(d => d.category))).sort((a, b) => a.localeCompare(b))], [data]);
    const uoms = useMemo(() => ["all", ...Array.from(new Set(data.map(d => d.uom))).sort((a, b) => a.localeCompare(b))], [data]);

    // Derived rows
    const filtered = useMemo(() => {
        let rows = data.map((r) => ({...r, available: r.onHand - r.allocated}));

        if (categoryFilter !== "all") rows = rows.filter(r => r.category === categoryFilter);
        if (uomFilter !== "all") rows = rows.filter(r => r.uom === uomFilter);

        if (query) {
            const q = query.toLowerCase();
            rows = rows.filter((r) => r.item.toLowerCase().includes(q) || r.itemId.toLowerCase().includes(q));
        }

        const {key, dir} = sort;
        rows = [...rows].sort((a, b) => {
            const av = a[key], bv = b[key];
            const cmp = ["onHand", "allocated", "available", "reorderPt"].includes(key)
                ? av - bv
                : String(av).localeCompare(String(bv), undefined, {numeric: true, sensitivity: "base"});
            return dir === "asc" ? cmp : -cmp;
        });

        return rows;
    }, [data, query, categoryFilter, uomFilter, sort]);

    // Paging
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageStart = (page - 1) * pageSize;
    const paged = filtered.slice(pageStart, pageStart + pageSize);

    // Selection
    const rowId = (r) => r.itemId;
    const toggleOne = (id) => setSelected((s) => ({...s, [id]: !s[id]}));
    const selectedIds = Object.keys(selected).filter((k) => selected[k]);
    const selectedCount = selectedIds.length;
    const allOnPageSelected = paged.length > 0 && paged.every((r) => selected[rowId(r)]);
    const toggleAll = () => {
        const next = {...selected};
        if (allOnPageSelected) paged.forEach((r) => delete next[rowId(r)]);
        else paged.forEach((r) => (next[rowId(r)] = true));
        setSelected(next);
    };

    // Navigation helpers
    const goToDetails = (id) => navigate(`/inventory/${encodeURIComponent(id)}`);
    const stopRowNav = (e) => e.stopPropagation();

    // ---------- Export helpers ----------
    const rowsForExport = () => (selectedCount ? filtered.filter((r) => selectedIds.includes(r.itemId)) : filtered);

    const toCSV = (dataRows) => {
        const headers = ["Item ID", "Item", "Category", "UoM", "On hand", "Allocated", "Available", "Reorder pt"];
        const escape = (v) => {
            const s = String(v ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        };
        const lines = [headers.join(",")];
        dataRows.forEach((r) => {
            lines.push(
                [
                    escape(r.itemId),
                    escape(r.item),
                    escape(r.category),
                    escape(r.uom),
                    escape(r.onHand),
                    escape(r.allocated),
                    escape(r.available),
                    escape(r.reorderPt),
                ].join(",")
            );
        });
        return lines.join("\n");
    };

    const downloadBlob = (blob, filename) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        const csv = toCSV(rowsForExport());
        downloadBlob(
            new Blob(["\ufeff" + csv], {type: "text/csv;charset=utf-8;"}),
            `inventory_${new Date().toISOString().slice(0, 10)}.csv`
        );
    };

    const handlePrint = () => {
        const dataRows = rowsForExport();
        const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Inventory Export</title>
<style>
  @media print { @page { size: A4 landscape; margin: 12mm; } }
  body{ font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#0f172a; }
  h1{ font-size:20px; margin:0 0 12px; }
  .meta{ font-size:12px; color:#475569; margin-bottom:12px; }
  table{ width:100%; border-collapse:collapse; font-size:12px; }
  th,td{ border:1px solid #cbd5e1; padding:6px 8px; text-align:left; }
  th{ background:#f1f5f9; }
  td.num{ text-align:right; }
  td.mono{ font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
</style>
</head>
<body>
<h1>Inventory</h1>
<div class="meta">Exported ${new Date().toLocaleString()} • ${dataRows.length} rows ${selectedCount ? "(selection)" : "(filtered)"}</div>
<table>
  <thead>
    <tr>
      <th>Item ID</th><th>Item</th><th>Category</th><th>UoM</th><th>On hand</th><th>Allocated</th><th>Available</th><th>Reorder pt</th>
    </tr>
  </thead>
  <tbody>
    ${dataRows
            .map(
                (r) => `<tr>
          <td class="mono">${r.itemId}</td>
          <td>${r.item}</td>
          <td>${r.category ?? ""}</td>
          <td>${r.uom}</td>
          <td class="num">${r.onHand}</td>
          <td class="num">${r.allocated}</td>
          <td class="num">${r.available}</td>
          <td class="num">${r.reorderPt}</td>
        </tr>`
            )
            .join("")}
  </tbody>
</table>
<script>window.onload = () => { window.print(); setTimeout(() => window.close(), 250); };</script>
</body>
</html>`;
        const w = window.open("", "_blank");
        if (!w) return;
        w.document.open();
        w.document.write(html);
        w.document.close();
    };

    // Table header cell (sortable)
    const th = (label, key, right = false) => (
        <th
            onClick={() => {
                setSort((s) => ({key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc"}));
                setPage(1);
            }}
            className={`px-4 py-3 font-semibold text-gray-300 select-none cursor-pointer ${right ? "text-right" : "text-left"}`}
        >
      <span className="inline-flex items-center gap-1">
        {label}
          {sort.key === key && <span className="text-gray-500">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </span>
        </th>
    );

    return (
        <div className="min-h-[calc(100vh-140px)] bg-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto px-4 pt-8 pb-5">
                <div className="flex items-start md:items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Inventory</h1>
                        <p className="mt-1 md:mt-2 text-gray-400 text-sm md:text-base">Quick view of item stock
                            levels.</p>
                    </div>
                    <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                        <button
                            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                            onClick={() => navigate("/inventory/transfer")}
                        >
                            Transfer
                        </button>
                        <button
                            className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                            onClick={() => navigate("/inventory/adjust")}
                        >
                            Adjust
                        </button>
                        <button
                            className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                            onClick={() => navigate("/inventory/receive")}
                        >
                            Receive
                        </button>
                        <button
                            className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">
                            Import CSV
                        </button>
                    </div>
                </div>
            </header>

            {/* Filters / Toolbar */}
            <div className="mx-auto px-4 pb-4">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                            {/* Category */}
                            <select
                                value={categoryFilter}
                                onChange={(e) => {
                                    setCategoryFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                title="Filter by category"
                            >
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c === "all" ? "All Categories" : c}
                                    </option>
                                ))}
                            </select>

                            {/* UoM */}
                            <select
                                value={uomFilter}
                                onChange={(e) => {
                                    setUomFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                title="Filter by unit of measure"
                            >
                                {uoms.map((u) => (
                                    <option key={u} value={u}>
                                        {u === "all" ? "All UoM" : u}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search */}
                        <div className="relative flex-1">
                            <input
                                placeholder="Search Item or Item ID…"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full rounded-lg bg-gray-800 border border-white/10 pl-3 pr-10 py-2 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">⌕</span>
                        </div>

                        {/* Bulk actions */}
                        <div className="flex items-center gap-2 md:ml-auto">
                            <button
                                onClick={handleExportCSV}
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700"
                                title={`Export ${selectedCount ? "selected" : "filtered"} rows to CSV`}
                            >
                                Export CSV
                            </button>
                            <button
                                onClick={handlePrint}
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700"
                                title="Open print dialog (save as PDF)"
                            >
                                Print / PDF
                            </button>
                            <button
                                disabled={!selectedCount}
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm disabled:opacity-40"
                                title={selectedCount ? `Delete ${selectedCount} selected` : "Select rows to delete"}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* List/Table */}
            <section className="mx-auto px-4 pb-12">
                {/* Mobile card list */}
                <div className="md:hidden">
                    {/* Select-all toolbar for mobile */}
                    <div className="mb-2 flex items-center justify-between">
                        <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                            <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll}
                                   onClick={stopRowNav}/>
                            <span>Select all on page</span>
                        </label>
                        <span className="text-xs text-gray-400">
              {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(filtered.length, pageStart + pageSize)} of {filtered.length}
            </span>
                    </div>

                    <div className="space-y-2">
                        {paged.map((r) => {
                            const id = rowId(r);
                            const available = r.onHand - r.allocated;
                            const availClass =
                                available < 0 ? "text-red-300"
                                    : available <= (r.reorderPt || 0) ? "text-yellow-300"
                                        : "text-gray-200";
                            return (
                                <div
                                    key={id}
                                    className="rounded-xl border border-white/10 bg-gray-900/60 p-3 active:bg-gray-800/40"
                                    onClick={() => goToDetails(id)}
                                    title="Open Inventory Details"
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            checked={!!selected[id]}
                                            onChange={() => toggleOne(id)}
                                            onClick={stopRowNav}
                                            className="mt-1"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="font-mono text-white text-sm">
                                                    <span className="underline decoration-dotted">{r.itemId}</span>
                                                </div>
                                                {r.hold && (
                                                    <span
                                                        className="px-2 py-0.5 text-[10px] rounded-full bg-yellow-600/30 text-yellow-300 whitespace-nowrap">
                            Hold
                          </span>
                                                )}
                                            </div>
                                            <div className="mt-1 text-gray-200 text-sm line-clamp-2">{r.item}</div>
                                            <div
                                                className="mt-1 text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                                                <span className="truncate">{r.category}</span>
                                                <span>•</span>
                                                <span>{r.uom}</span>
                                                <span>•</span>
                                                <span className="truncate">Reorder {r.reorderPt}</span>
                                            </div>
                                            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                                                <div className="rounded-lg border border-white/10 bg-gray-800/40 p-2">
                                                    <div className="text-gray-400">On hand</div>
                                                    <div className="font-medium text-gray-200">{r.onHand}</div>
                                                </div>
                                                <div className="rounded-lg border border-white/10 bg-gray-800/40 p-2">
                                                    <div className="text-gray-400">Allocated</div>
                                                    <div className="font-medium text-gray-200">{r.allocated}</div>
                                                </div>
                                                <div className="rounded-lg border border-white/10 bg-gray-800/40 p-2">
                                                    <div className="text-gray-400">Available</div>
                                                    <div className={`font-medium ${availClass}`}>{available}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {paged.length === 0 && (
                            <div
                                className="rounded-xl border border-white/10 bg-gray-900/60 p-6 text-center text-gray-400">
                                No inventory items found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto border border-white/10 rounded-xl bg-gray-900/60">
                    <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-gray-900/80">
                        <tr>
                            <th className="px-4 py-3">
                                <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll}
                                       onClick={stopRowNav}/>
                            </th>
                            {th("Item ID", "itemId")}
                            {th("Item", "item")}
                            {th("Category", "category")}
                            {th("UoM", "uom")}
                            {th("On hand", "onHand", true)}
                            {th("Allocated", "allocated", true)}
                            {th("Available", "available", true)}
                            {th("Reorder pt", "reorderPt", true)}
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
                                <tr
                                    key={id}
                                    className="hover:bg-gray-800/40 transition cursor-pointer"
                                    onClick={() => goToDetails(id)}
                                    title="Open Inventory Details"
                                >
                                    <td className="px-4 py-3" onClick={stopRowNav}>
                                        <input type="checkbox" checked={!!selected[id]} onChange={() => toggleOne(id)}/>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-white">
                                        <span className="underline decoration-dotted">{r.itemId}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-200">{r.item}</td>
                                    <td className="px-4 py-3 text-gray-400">{r.category}</td>
                                    <td className="px-4 py-3 text-gray-400">{r.uom}</td>
                                    <td className="px-4 py-3 text-right text-gray-200">{r.onHand}</td>
                                    <td className="px-4 py-3 text-right text-gray-200">{r.allocated}</td>
                                    <td className={`px-4 py-3 text-right ${availClass}`}>{r.available}</td>
                                    <td className="px-4 py-3 text-right text-gray-200">{r.reorderPt}</td>
                                </tr>
                            );
                        })}
                        {paged.length === 0 && (
                            <tr>
                                <td className="px-4 py-6 text-center text-gray-400" colSpan={9}>
                                    No inventory items found.
                                </td>
                            </tr>
                        )}
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
                                <option key={n} value={n}>{n}</option>
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
        </div>
    );
}

export {InventoryPage};
