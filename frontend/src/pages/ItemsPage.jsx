import React, { useState, useMemo } from "react";

/**
 * ItemsPage — ERP-style list with filters, search, table, and pagination.
 * Tailwind-only, self-contained with mocked data.
 * Now includes: CSV/Excel export + Print/PDF-friendly view.
 */
export const ItemsPage = () => {
    // Mocked data
    const data = [
        { id: "ITM-001", name: "Warm Yellow LED", status: "Active", category: "Component", uom: "pcs", onHand: 3150, allocated: 1000, reorder: 500 },
        { id: "ITM-002", name: "Large Widget", status: "Active", category: "Assembly", uom: "pcs", onHand: 310, allocated: 600, reorder: 150 },
        { id: "ITM-003", name: "Plastic Case", status: "Active", category: "Component", uom: "pcs", onHand: 1350, allocated: 330, reorder: 200 },
        { id: "ITM-004", name: "Lion Bracket", status: "Active", category: "Fabrication", uom: "pcs", onHand: 350, allocated: 200, reorder: 100 },
        { id: "ITM-005", name: "Chain Bracket", status: "Active", category: "Component", uom: "pcs", onHand: 1320, allocated: 800, reorder: 100 },
        { id: "ITM-006", name: "Front Assembly", status: "Active", category: "Finished Good", uom: "ea", onHand: 208, allocated: 230, reorder: 30 },
        { id: "ITM-007", name: "Steel Frame", status: "Active", category: "Fabrication", uom: "pcs", onHand: 1700, allocated: 230, reorder: 400 },
        { id: "ITM-008", name: "Blue Paint (RAL5010)", status: "Hold", category: "Consumable", uom: "L", onHand: 12, allocated: 2, reorder: 8 },
        { id: "ITM-009", name: "Screws M3x8", status: "Active", category: "Hardware", uom: "ea", onHand: 1500, allocated: 300, reorder: 1000 },
        { id: "ITM-010", name: "Assembly Kit 10", status: "Discontinued", category: "Kit", uom: "kit", onHand: 5, allocated: 1, reorder: 0 },
    ];

    // State
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const [category, setCategory] = useState("all");
    const [uom, setUom] = useState("all");
    const [sort, setSort] = useState({ key: "name", dir: "asc" });
    const [selected, setSelected] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    // Options
    const categories = useMemo(() => ["all", ...new Set(data.map((d) => d.category))], []);
    const uoms = useMemo(() => ["all", ...new Set(data.map((d) => d.uom))], []);

    // Filtering + sorting
    const filtered = useMemo(() => {
        let rows = data;
        if (query) {
            const q = query.toLowerCase();
            rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
        }
        if (status !== "all") rows = rows.filter((r) => r.status === status);
        if (category !== "all") rows = rows.filter((r) => r.category === category);
        if (uom !== "all") rows = rows.filter((r) => r.uom === uom);

        const { key, dir } = sort;
        rows = [...rows].sort((a, b) => {
            const av = a[key];
            const bv = b[key];
            const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
            return dir === "asc" ? cmp : -cmp;
        });
        return rows;
    }, [query, status, category, uom, sort]);

    // Paging
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageStart = (page - 1) * pageSize;
    const paged = filtered.slice(pageStart, pageStart + pageSize);

    // Selection
    const allOnPageSelected = paged.length > 0 && paged.every((r) => selected[r.id]);
    const toggleAll = () => {
        const next = { ...selected };
        if (allOnPageSelected) {
            paged.forEach((r) => delete next[r.id]);
        } else {
            paged.forEach((r) => (next[r.id] = true));
        }
        setSelected(next);
    };
    const toggleOne = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));
    const selectedCount = Object.values(selected).filter(Boolean).length;

    const th = (label, key, alignRight = false) => (
        <th
            onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))}
            className={`px-4 py-3 font-semibold text-gray-300 select-none cursor-pointer ${alignRight ? "text-right" : "text-left"}`}
        >
      <span className="inline-flex items-center gap-1">
        {label}
          {sort.key === key && <span className="text-gray-500">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </span>
        </th>
    );

    // ---------- Export helpers ----------
    const rowsForExport = () => {
        const selectedIds = Object.keys(selected).filter((k) => selected[k]);
        const base = selectedIds.length ? filtered.filter((r) => selectedIds.includes(r.id)) : filtered;
        return base;
    };

    const toCSV = (rows) => {
        const headers = ["ID", "Product name", "Status", "Category", "UoM", "On hand", "Allocated", "Reorder pt"];
        const escape = (v) => {
            const s = String(v ?? "");
            if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
            return s;
        };
        const lines = [headers.join(",")];
        rows.forEach((r) => {
            lines.push([
                escape(r.id),
                escape(r.name),
                escape(r.status),
                escape(r.category),
                escape(r.uom),
                r.onHand,
                r.allocated,
                r.reorder,
            ].join(","));
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
        downloadBlob(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }), `items_${new Date().toISOString().slice(0,10)}.csv`);
    };

    // Excel-friendly (CSV). Most users open CSV in Excel; set .xlsx-like mime not needed here.
    const handleExportExcel = () => {
        const csv = toCSV(rowsForExport());
        downloadBlob(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" }), `items_${new Date().toISOString().slice(0,10)}.xls`);
    };

    const handlePrint = () => {
        const rows = rowsForExport();
        const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Items Export</title>
<style>
  @media print { @page { size: A4 landscape; margin: 12mm; } }
  body{ font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#0f172a; }
  h1{ font-size:20px; margin:0 0 12px; }
  .meta{ font-size:12px; color:#475569; margin-bottom:12px; }
  table{ width:100%; border-collapse:collapse; font-size:12px; }
  th,td{ border:1px solid #cbd5e1; padding:6px 8px; text-align:left; }
  th{ background:#f1f5f9; }
  td.num{ text-align:right; }
</style>
</head>
<body>
<h1>Items</h1>
<div class="meta">Exported ${new Date().toLocaleString()} • ${rows.length} rows ${selectedCount ? "(selection)" : "(filtered)"}</div>
<table>
  <thead>
    <tr>
      <th>ID</th><th>Product name</th><th>Status</th><th>Category</th><th>UoM</th><th>On hand</th><th>Allocated</th><th>Reorder pt</th>
    </tr>
  </thead>
  <tbody>
    ${rows
            .map(
                (r) => `<tr>
          <td>${r.id}</td>
          <td>${r.name}</td>
          <td>${r.status}</td>
          <td>${r.category}</td>
          <td>${r.uom}</td>
          <td class="num">${r.onHand}</td>
          <td class="num">${r.allocated}</td>
          <td class="num">${r.reorder}</td>
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

    return (
        <div className="min-h-[calc(100vh-140px)] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Items</h1>
                        <p className="mt-2 text-gray-400">Search, filter, and manage SKUs.</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">+ New Item</button>
                        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">Import CSV</button>
                    </div>
                </div>
            </header>

            {/* Filters / Toolbar */}
            <div className="mx-auto max-w-6xl px-4 pb-4">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <select
                            value={category}
                            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                        >
                            {categories.map((c) => (
                                <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
                            ))}
                        </select>

                        <select
                            value={status}
                            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Hold">Hold</option>
                            <option value="Discontinued">Discontinued</option>
                        </select>

                        <select
                            value={uom}
                            onChange={(e) => { setUom(e.target.value); setPage(1); }}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                        >
                            {uoms.map((u) => (
                                <option key={u} value={u}>{u === "all" ? "All UoM" : u}</option>
                            ))}
                        </select>

                        <div className="relative flex-1">
                            <input
                                placeholder="Search name or ID…"
                                value={query}
                                onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                                className="w-full rounded-lg bg-gray-800 border border-white/10 pl-3 pr-10 py-2 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">⌕</span>
                        </div>

                        {/* Bulk actions */}
                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                onClick={handleExportCSV}
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700"
                                title={`Export ${selectedCount ? "selected" : "filtered"} rows to CSV`}
                            >
                                Export CSV
                            </button>
                            <button
                                onClick={handleExportExcel}
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700"
                                title={`Export ${selectedCount ? "selected" : "filtered"} rows to Excel (CSV)`}
                            >
                                Excel (CSV)
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
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <section className="mx-auto max-w-6xl px-4 pb-12">
                <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/60">
                    <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-gray-900/80">
                        <tr>
                            <th className="px-4 py-3">
                                <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} />
                            </th>
                            {th("ID", "id")}
                            {th("Product name", "name")}
                            {th("Status", "status")}
                            {th("Category", "category")}
                            {th("UoM", "uom")}
                            {th("On hand", "onHand", true)}
                            {th("Allocated", "allocated", true)}
                            {th("Reorder pt", "reorder", true)}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                        {paged.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-800/40 transition">
                                <td className="px-4 py-3">
                                    <input type="checkbox" checked={!!selected[item.id]} onChange={() => toggleOne(item.id)} />
                                </td>
                                <td className="px-4 py-3 font-mono text-white">{item.id}</td>
                                <td className="px-4 py-3 text-gray-200">{item.name}</td>
                                <td className="px-4 py-3">
                    <span
                        className={`px-2 py-1 text-xs rounded-full ${
                            item.status === "Active"
                                ? "bg-green-600/30 text-green-400"
                                : item.status === "Hold"
                                    ? "bg-yellow-600/30 text-yellow-400"
                                    : "bg-gray-600/30 text-gray-400"
                        }`}
                    >
                      {item.status}
                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-400">{item.category}</td>
                                <td className="px-4 py-3 text-gray-400">{item.uom}</td>
                                <td className="px-4 py-3 text-right text-gray-200">{item.onHand}</td>
                                <td className="px-4 py-3 text-right text-gray-200">{item.allocated}</td>
                                <td className="px-4 py-3 text-right text-gray-200">{item.reorder}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-gray-400">
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
};