// InventoryBatchesPage.jsx
import React, {useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";

export default function InventoryBatchesPage() {
    const navigate = useNavigate();
    const {routeItemId} = useParams();

    // Mock item dictionary so header and table show the same item fields on every row
    const items = {
        "ITM-002": {name: "Large Widget", uom: "pcs"},
        "ITM-003": {name: "Plastic Case", uom: "pcs"},
        "ITM-004": {name: "Lion Bracket", uom: "pcs"},
        "ITM-005": {name: "Chain Bracket", uom: "pcs"},
        "ITM-006": {name: "Front Assembly", uom: "ea"},
        "ITM-008": {name: "Blue Paint (RAL5010)", uom: "L"},
        "ITM-009": {name: "Screws M3×8", uom: "ea"},
        "ITM-010": {name: "Assembly Kit 10", uom: "kit"},
    };

    // Choose current item info (fallback if route missing/unknown)
    const itemInfo = items[routeItemId] || {name: "Unknown Item", uom: "ea"};
    const itemId = routeItemId || "ITM-000";

    // Mocked batches — all rows share same Item ID/Name/UoM
    const batches = [
        {batchId: "B-0001", expiration: "2025-10-31", batchSize: 120, allocated: 40},
        {batchId: "B-0002", expiration: "2025-12-15", batchSize: 80, allocated: 10},
        {batchId: "B-0003", expiration: "2026-02-01", batchSize: 50, allocated: 0},
        {batchId: "B-0004", expiration: "2026-05-20", batchSize: 200, allocated: 120},
        {batchId: "B-0005", expiration: "2026-08-30", batchSize: 60, allocated: 5},
    ].map((b) => ({
        ...b,
        itemId,
        item: itemInfo.name,
        uom: itemInfo.uom,
        available: (b.batchSize ?? 0) - (b.allocated ?? 0),
    }));

    // State
    const [query, setQuery] = useState(""); // search by batchId only
    const [expFrom, setExpFrom] = useState(""); // YYYY-MM-DD
    const [expTo, setExpTo] = useState("");     // YYYY-MM-DD
    const [sort, setSort] = useState({key: "expiration", dir: "asc"}); // FEFO by default
    const [selected, setSelected] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    // Filtering + sorting
    const filtered = useMemo(() => {
        let rows = batches;

        // Search by Batch ID only
        if (query) {
            const q = query.toLowerCase();
            rows = rows.filter((r) => r.batchId.toLowerCase().includes(q));
        }

        // Expiration range filtering (inclusive)
        const fromTime = expFrom ? new Date(expFrom + "T00:00:00").getTime() : null;
        const toTime = expTo ? new Date(expTo + "T23:59:59.999").getTime() : null;
        if (fromTime || toTime) {
            rows = rows.filter((r) => {
                const t = new Date(r.expiration + "T12:00:00").getTime(); // noon to avoid TZ edge-cases
                if (fromTime && t < fromTime) return false;
                if (toTime && t > toTime) return false;
                return true;
            });
        }

        const {key, dir} = sort;
        rows = [...rows].sort((a, b) => {
            const av = a[key];
            const bv = b[key];

            if (["batchSize", "allocated", "available"].includes(key)) {
                const cmp = (av ?? 0) - (bv ?? 0);
                return dir === "asc" ? cmp : -cmp;
            }
            if (key === "expiration") {
                const cmp = new Date(av).getTime() - new Date(bv).getTime();
                return dir === "asc" ? cmp : -cmp;
            }
            // strings: itemId, item, uom, batchId
            const cmp = String(av).localeCompare(String(bv), undefined, {numeric: true, sensitivity: "base"});
            return dir === "asc" ? cmp : -cmp;
        });

        return rows;
    }, [batches, query, expFrom, expTo, sort]);

    // Paging
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageStart = (page - 1) * pageSize;
    const paged = filtered.slice(pageStart, pageStart + pageSize);

    // Selection
    const rowId = (r) => `${r.itemId}|${r.batchId}`;
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
    const stopRowNav = (e) => e.stopPropagation();

    // Navigation
    const goBack = () => navigate("/inventory/");
    const openBatch = (batchId) =>
        navigate(`/inventory/${encodeURIComponent(itemId)}/batches/${encodeURIComponent(batchId)}`);

    // ---------- Export helpers (aligned with InventoryPage) ----------
    const rowsForExport = () => (selectedCount ? filtered.filter((r) => selected[rowId(r)]) : filtered);

    const toCSV = (dataRows) => {
        const headers = ["Item ID", "Item", "UoM", "Batch", "Expiration", "Batch size", "Allocated", "Available"];
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
                    escape(r.uom),
                    escape(r.batchId),
                    escape(r.expiration),
                    escape(r.batchSize),
                    escape(r.allocated),
                    escape(r.available),
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
            `inventory_${itemId}_batches_${new Date().toISOString().slice(0, 10)}.csv`
        );
    };

    const handlePrint = () => {
        const dataRows = rowsForExport();
        const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Inventory Batches</title>
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
<h1>Inventory Batches • <span class="mono">${itemId}</span></h1>
<div class="meta">${itemInfo.name} — UoM: ${itemInfo.uom} • Exported ${new Date().toLocaleString()} • ${dataRows.length} rows ${selectedCount ? "(selection)" : "(filtered)"} • Filters: ${query ? "Batch ID contains \"" + query + "\"" : "none"}${(expFrom || expTo) ? " • Expiration " + (expFrom || "...") + " → " + (expTo || "...") : ""}</div>
<table>
  <thead>
    <tr>
      <th>Item ID</th><th>Item</th><th>UoM</th><th>Batch</th><th>Expiration</th><th>Batch size</th><th>Allocated</th><th>Available</th>
    </tr>
  </thead>
  <tbody>
    ${dataRows
            .map(
                (r) => `<tr>
          <td class="mono">${r.itemId}</td>
          <td>${r.item}</td>
          <td>${r.uom}</td>
          <td class="mono">${r.batchId}</td>
          <td>${r.expiration}</td>
          <td class="num">${r.batchSize}</td>
          <td class="num">${r.allocated}</td>
          <td class="num">${r.available}</td>
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

    // Table header cell (sortable) — same pattern as InventoryPage
    const th = (label, key, right = false) => (
        <th
            onClick={() => setSort((s) => ({key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc"}))}
            className={`px-4 py-3 font-semibold text-gray-300 select-none cursor-pointer ${right ? "text-right" : "text-left"}`}
        >
      <span className="inline-flex items-center gap-1">
        {label}
          {sort.key === key && <span className="text-gray-500">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </span>
        </th>
    );

    return (
        <div
            className="min-h-[calc(100vh-140px)] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header (aligned with InventoryPage) */}
            <header className="mx-auto px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Inventory • <span
                            className="font-mono">{itemId}</span></h1>
                        <p className="mt-2 text-gray-400">
                            {itemInfo.name} — UoM: {itemInfo.uom}. FEFO list of batches for this item.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                        >
                            Merge
                        </button>
                        <button
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                        >
                            Split
                        </button>
                        <button
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                            onClick={goBack}
                            title="Back to Inventory"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </header>

            {/* Toolbar (aligned with InventoryPage) */}
            <div className="mx-auto px-4 pb-4">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        {/* Search by Batch ID */}
                        <div className="relative flex-1">
                            <input
                                placeholder="Search Batch ID…"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full rounded-lg bg-gray-800 border border-white/10 pl-3 pr-10 py-2 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">⌕</span>
                        </div>

                        {/* Expiration range filters */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-400">Expiration From</label>
                            <input
                                type="date"
                                value={expFrom}
                                onChange={(e) => {
                                    setExpFrom(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-400">To</label>
                            <input
                                type="date"
                                value={expTo}
                                onChange={(e) => {
                                    setExpTo(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
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

            {/* Table (aligned with InventoryPage table styles) */}
            <section className="mx-auto px-4 pb-12">
                <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/60">
                    <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-gray-900/80">
                        <tr>
                            <th className="px-4 py-3">
                                <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll}
                                       onClick={stopRowNav}/>
                            </th>
                            {th("Item ID", "itemId")}
                            {th("Item", "item")}
                            {th("UoM", "uom")}
                            {th("Batch", "batchId")}
                            {th("Expiration", "expiration")}
                            {th("Batch size", "batchSize", true)}
                            {th("Allocated", "allocated", true)}
                            {th("Available", "available", true)}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                        {paged.map((r) => {
                            const id = rowId(r);
                            const availClass =
                                r.available < 0
                                    ? "text-red-300"
                                    : r.available <= 0
                                        ? "text-yellow-300"
                                        : "text-gray-200";
                            return (
                                <tr
                                    key={id}
                                    className="hover:bg-gray-800/40 transition cursor-pointer"
                                    onClick={() => openBatch(r.batchId)}
                                    title="Open Batch Details"
                                >
                                    <td className="px-4 py-3" onClick={stopRowNav}>
                                        <input type="checkbox" checked={!!selected[id]} onChange={() => toggleOne(id)}/>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-white">
                                        <span className="underline decoration-dotted">{r.itemId}</span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-200">{r.item}</td>
                                    <td className="px-4 py-3 text-gray-400">{r.uom}</td>
                                    <td className="px-4 py-3 font-mono text-gray-300">{r.batchId}</td>
                                    <td className="px-4 py-3 text-gray-300">{r.expiration}</td>
                                    <td className="px-4 py-3 text-right text-gray-200">{r.batchSize}</td>
                                    <td className="px-4 py-3 text-right text-gray-200">{r.allocated}</td>
                                    <td className={`px-4 py-3 text-right ${availClass}`}>{r.available}</td>
                                </tr>
                            );
                        })}
                        {paged.length === 0 && (
                            <tr>
                                <td className="px-4 py-6 text-center text-gray-400" colSpan={9}>
                                    No batches found.
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
        </div>
    );
}

export {InventoryBatchesPage};
