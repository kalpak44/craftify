import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";

/**
 * ItemsPage
 *
 * ERP-style Items list built with React + Tailwind (raw JS).
 *
 * Update in this version:
 * - Per-row desktop/menu actions use an ellipsis "…" trigger with dropdown (desktop) and bottom sheet (mobile).
 * - Actions include: "Open details", "Search in Inventory", "Search in PO", and "Delete".
 * - Removed the "Edit" option from the per-row actions menu (row/card click still opens Edit).
 *
 * Core features:
 * - Search, filters (status/category/UoM), sortable columns.
 * - Pagination with selectable rows and bulk actions.
 * - CSV export and print-friendly view.
 * - Row selection with bulk delete + confirmation modal.
 * - Clicking a row/card opens Edit view at /items/:id/edit.
 *
 * Notes:
 * - Mock data intentionally minimal (id, name, status, category, uom).
 */
export const ItemsPage = () => {
    // Mocked data (simplified)
    const initialData = [
        {id: "ITM-001", name: "Warm Yellow LED", status: "Active", category: "Component", uom: "pcs"},
        {id: "ITM-002", name: "Large Widget", status: "Active", category: "Assembly", uom: "pcs"},
        {id: "ITM-003", name: "Plastic Case", status: "Active", category: "Component", uom: "pcs"},
        {id: "ITM-004", name: "Lion Bracket", status: "Active", category: "Fabrication", uom: "pcs"},
        {id: "ITM-005", name: "Chain Bracket", status: "Active", category: "Component", uom: "pcs"},
        {id: "ITM-006", name: "Front Assembly", status: "Active", category: "Finished Good", uom: "ea"},
        {id: "ITM-007", name: "Steel Frame", status: "Active", category: "Fabrication", uom: "pcs"},
        {id: "ITM-008", name: "Blue Paint (RAL5010)", status: "Hold", category: "Consumable", uom: "L"},
        {id: "ITM-009", name: "Screws M3x8", status: "Active", category: "Hardware", uom: "ea"},
        {id: "ITM-010", name: "Assembly Kit 10", status: "Discontinued", category: "Kit", uom: "kit"}
    ];

    // State
    const [rows, setRows] = useState(initialData);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const [category, setCategory] = useState("all");
    const [uom, setUom] = useState("all");
    const [sort, setSort] = useState({key: "name", dir: "asc"});
    const [selected, setSelected] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    // Bulk deletion modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Single-row deletion modal
    const [deleteOneId, setDeleteOneId] = useState(null);

    // Desktop dropdown menu: { id, x, y } or null
    const [menu, setMenu] = useState(null);
    const menuRef = useRef(null);

    // Mobile action sheet: id or null
    const [sheetId, setSheetId] = useState(null);

    const navigate = useNavigate();

    // Options
    const categories = useMemo(() => ["all", ...new Set(rows.map((d) => d.category))], [rows]);
    const uoms = useMemo(() => ["all", ...new Set(rows.map((d) => d.uom))], [rows]);

    // Filtering + sorting
    const filtered = useMemo(() => {
        let data = rows;
        if (query) {
            const q = query.toLowerCase();
            data = data.filter((r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
        }
        if (status !== "all") data = data.filter((r) => r.status === status);
        if (category !== "all") data = data.filter((r) => r.category === category);
        if (uom !== "all") data = data.filter((r) => r.uom === uom);

        const {key, dir} = sort;
        data = [...data].sort((a, b) => {
            const av = a[key];
            const bv = b[key];
            const cmp =
                typeof av === "number" && typeof bv === "number"
                    ? av - bv
                    : String(av).localeCompare(String(bv), undefined, {numeric: true, sensitivity: "base"});
            return dir === "asc" ? cmp : -cmp;
        });
        return data;
    }, [rows, query, status, category, uom, sort]);

    // Paging
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageStart = (page - 1) * pageSize;
    const paged = filtered.slice(pageStart, pageStart + pageSize);

    // Selection
    const selectedIds = Object.keys(selected).filter((k) => selected[k]);
    const selectedCount = selectedIds.length;

    const allOnPageSelected = paged.length > 0 && paged.every((r) => selected[r.id]);
    const toggleAll = () => {
        const next = {...selected};
        if (allOnPageSelected) {
            paged.forEach((r) => delete next[r.id]);
        } else {
            paged.forEach((r) => (next[r.id] = true));
        }
        setSelected(next);
    };
    const toggleOne = (id) => setSelected((s) => ({...s, [id]: !s[id]}));

    // ---------- Export helpers ----------
    const rowsForExport = () => (selectedCount ? filtered.filter((r) => selectedIds.includes(r.id)) : filtered);

    const toCSV = (data) => {
        const headers = ["ID", "Product name", "Status", "Category", "UoM"];
        const escape = (v) => {
            const s = String(v ?? "");
            if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
            return s;
        };
        const lines = [headers.join(",")];
        data.forEach((r) => {
            lines.push([escape(r.id), escape(r.name), escape(r.status), escape(r.category), escape(r.uom)].join(","));
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
        downloadBlob(new Blob(["\ufeff" + csv], {type: "text/csv;charset=utf-8;"}), `items_${new Date()
            .toISOString()
            .slice(0, 10)}.csv`);
    };

    const handlePrint = () => {
        const data = rowsForExport();
        const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Items Export</title>
<style>
  @media print { @page { size: A4 landscape; margin: 12mm; } }
  body{ font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#0f172a; }
  h1{ font-size:20px; margin:0 0 12px; }
  .meta{ font-size:12px; color:#475569; margin-bottom:12px; }
  table{ width:100%; border-collapse:collapse; font-size:12px; }
  th,td{ border:1px solid #cbd5e1; padding:6px 8px; text-align:left; }
  th{ background:#f1f5f9; }
</style>
</head>
<body>
<h1>Items</h1>
<div class="meta">Exported ${new Date().toLocaleString()} • ${data.length} rows ${selectedCount ? "(selection)" : "(filtered)"}</div>
<table>
  <thead>
    <tr>
      <th>ID</th><th>Product name</th><th>Status</th><th>Category</th><th>UoM</th>
    </tr>
  </thead>
  <tbody>
    ${data
            .map(
                (r) => `<tr>
          <td>${r.id}</td>
          <td>${r.name}</td>
          <td>${r.status}</td>
          <td>${r.category}</td>
          <td>${r.uom}</td>
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

    const th = (label, key, alignRight = false) => (
        <th
            onClick={() => setSort((s) => ({key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc"}))}
            className={`px-4 py-3 font-semibold text-gray-300 select-none cursor-pointer ${alignRight ? "text-right" : "text-left"}`}
        >
      <span className="inline-flex items-center gap-1">
        {label}
          {sort.key === key && <span className="text-gray-500">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </span>
        </th>
    );

    // Delete (bulk)
    const openDeleteModal = () => {
        if (!selectedCount) return;
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!selectedCount) {
            setShowDeleteModal(false);
            return;
        }
        const keep = rows.filter((r) => !selectedIds.includes(r.id));
        setRows(keep);
        setSelected({});
        const newTotal = Math.max(1, Math.ceil(Math.max(0, keep.length) / pageSize));
        setPage((p) => Math.min(p, newTotal));
        setShowDeleteModal(false);
    };

    // Delete single row
    const confirmDeleteOne = () => {
        if (!deleteOneId) return;
        const keep = rows.filter((r) => r.id !== deleteOneId);
        setRows(keep);
        setSelected((s) => {
            const next = {...s};
            delete next[deleteOneId];
            return next;
        });
        const newTotal = Math.max(1, Math.ceil(Math.max(0, keep.length) / pageSize));
        setPage((p) => Math.min(p, newTotal));
        setDeleteOneId(null);
    };

    // Navigate
    const goToEdit = (id) => navigate(`/items/${encodeURIComponent(id)}/edit`);

    // Utility to stop row navigation when interacting with controls
    const stopRowNav = (e) => e.stopPropagation();

    // Desktop menu helpers
    const openDesktopMenu = (e, id) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.min(rect.left, window.innerWidth - 220);
        const y = rect.bottom + 6;
        setMenu({id, x, y});
    };
    const closeDesktopMenu = () => setMenu(null);

    useEffect(() => {
        const onDoc = (ev) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(ev.target)) {
                closeDesktopMenu();
            }
        };
        const onEsc = (ev) => {
            if (ev.key === "Escape") closeDesktopMenu();
        };
        if (menu) {
            document.addEventListener("mousedown", onDoc);
            window.addEventListener("resize", closeDesktopMenu);
            window.addEventListener("scroll", closeDesktopMenu, true);
            document.addEventListener("keydown", onEsc);
        }
        return () => {
            document.removeEventListener("mousedown", onDoc);
            window.removeEventListener("resize", closeDesktopMenu);
            window.removeEventListener("scroll", closeDesktopMenu, true);
            document.removeEventListener("keydown", onEsc);
        };
    }, [menu]);

    // Shared actions for menus (Edit removed)
    const MenuItems = ({id, onDone}) => (
        <div className="py-1">
            <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800"
                onClick={(e) => {
                    e.stopPropagation();
                    goToEdit(id);
                    onDone?.();
                }}
            >
                Open details
            </button>
            <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800"
                onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/inventory?query=${encodeURIComponent(id)}`);
                    onDone?.();
                }}
            >
                Search in Inventory
            </button>
            <div className="my-1 border-t border-white/10" />
            <button
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-950/40 hover:text-red-300"
                onClick={(e) => {
                    e.stopPropagation();
                    setDeleteOneId(id);
                    onDone?.();
                }}
            >
                Delete
            </button>
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-140px)] bg-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto px-4 pt-8 pb-5">
                <div className="flex items-start md:items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Items</h1>
                        <p className="mt-1 md:mt-2 text-gray-400 text-sm md:text-base">Search, filter, and manage SKUs.</p>
                    </div>
                    <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                        <button
                            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                            onClick={() => navigate("/items/new")}
                        >
                            + New Item
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
                            <select
                                value={category}
                                onChange={(e) => {
                                    setCategory(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                            >
                                {categories.map((c) => (
                                    <option key={c} value={c}>
                                        {c === "all" ? "All Categories" : c}
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
                                <option value="Active">Active</option>
                                <option value="Hold">Hold</option>
                                <option value="Discontinued">Discontinued</option>
                            </select>

                            <select
                                value={uom}
                                onChange={(e) => {
                                    setUom(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm col-span-2 sm:col-span-1"
                            >
                                {uoms.map((u) => (
                                    <option key={u} value={u}>
                                        {u === "all" ? "All UoM" : u}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="relative flex-1">
                            <input
                                placeholder="Search name or ID…"
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
                                onClick={openDeleteModal}
                                disabled={!selectedCount}
                                className="px-3 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm disabled:opacity-40"
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
                            <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} onClick={stopRowNav}/>
                            <span>Select all on page</span>
                        </label>
                        <span className="text-xs text-gray-400">
              {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(filtered.length, pageStart + pageSize)} of {filtered.length}
            </span>
                    </div>

                    <div className="space-y-2">
                        {paged.map((item) => (
                            <div
                                key={item.id}
                                className="rounded-xl border border-white/10 bg-gray-900/60 p-3 active:bg-gray-800/40"
                                onClick={() => goToEdit(item.id)}
                                title="Open Edit"
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={!!selected[item.id]}
                                        onChange={() => toggleOne(item.id)}
                                        onClick={stopRowNav}
                                        className="mt-1"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="font-mono text-white text-sm">
                                                <span className="underline decoration-dotted">{item.id}</span>
                                            </div>
                                            {/* Mobile actions trigger */}
                                            <button
                                                className="shrink-0 px-2 py-1 rounded-md hover:bg-gray-800/60 text-gray-300"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSheetId(item.id);
                                                }}
                                                aria-label="Actions"
                                                title="Actions"
                                            >
                                                …
                                            </button>
                                        </div>
                                        <div className="mt-1 text-gray-200 text-sm line-clamp-2">{item.name}</div>
                                        <div className="mt-1 text-xs text-gray-400 flex items-center gap-2">
                                            <span className="truncate">{item.category}</span>
                                            <span>•</span>
                                            <span>{item.uom}</span>
                                            <span className={`ml-auto px-2 py-0.5 text-[10px] rounded-full whitespace-nowrap ${
                                                item.status === "Active" ? "bg-green-600/30 text-green-400"
                                                    : item.status === "Hold" ? "bg-yellow-600/30 text-yellow-400"
                                                        : "bg-gray-600/30 text-gray-400"}`}>
                        {item.status}
                      </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {paged.length === 0 && (
                            <div className="rounded-xl border border-white/10 bg-gray-900/60 p-6 text-center text-gray-400">
                                No items found.
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
                                <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} onClick={stopRowNav}/>
                            </th>
                            {th("ID", "id")}
                            {th("Product name", "name")}
                            {th("Status", "status")}
                            {th("Category", "category")}
                            {th("UoM", "uom")}
                            <th className="px-4 py-3 font-semibold text-gray-300 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                        {paged.map((item) => (
                            <tr
                                key={item.id}
                                className="hover:bg-gray-800/40 transition cursor-pointer"
                                onClick={() => goToEdit(item.id)}
                                title="Open Edit"
                            >
                                <td className="px-4 py-3" onClick={stopRowNav}>
                                    <input type="checkbox" checked={!!selected[item.id]} onChange={() => toggleOne(item.id)}/>
                                </td>
                                <td className="px-4 py-3 font-mono text-white">
                                    <span className="underline decoration-dotted">{item.id}</span>
                                </td>
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
                                <td className="px-4 py-3 text-right" onClick={stopRowNav}>
                                    {/* Desktop actions trigger */}
                                    <button
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-800/60 text-gray-300"
                                        aria-label="Actions"
                                        title="Actions"
                                        onClick={(e) => openDesktopMenu(e, item.id)}
                                    >
                                        …
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paged.length === 0 && (
                            <tr>
                                <td className="px-4 py-6 text-center text-gray-400" colSpan={7}>
                                    No items found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-gray-400">
                    <div className="flex items-center gap-2 flex-wrap">
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

            {/* Desktop Dropdown Menu */}
            {menu && (
                <div
                    ref={menuRef}
                    className="fixed z-50 min-w-[200px] rounded-xl border border-white/10 bg-gray-900 shadow-2xl"
                    style={{left: `${menu.x}px`, top: `${menu.y}px`}}
                    onClick={(e) => e.stopPropagation()}
                >
                    <MenuItems id={menu.id} onDone={closeDesktopMenu} />
                </div>
            )}

            {/* Mobile Action Sheet */}
            {sheetId && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setSheetId(null)} />
                    <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-white/10 bg-gray-900 p-2 pt-3 shadow-2xl">
                        <div className="mx-auto h-1 w-10 rounded-full bg-white/20 mb-1.5" />
                        <div className="px-2 pb-2">
                            <div className="text-xs text-gray-400 mb-2 px-1">Actions for <span className="font-mono text-gray-300">{sheetId}</span></div>
                            <div className="rounded-xl overflow-hidden border border-white/10 divide-y divide-white/10">
                                <MenuItems id={sheetId} onDone={() => setSheetId(null)} />
                            </div>
                            <button
                                className="mt-2 w-full px-4 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm"
                                onClick={() => setSheetId(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deletion Confirmation Modal (Bulk) */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setShowDeleteModal(false)}/>
                    <div className="relative z-10 w-[92%] sm:w-[80%] max-w-md rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-xl">
                        <h2 className="text-lg font-semibold text-white">Confirm deletion</h2>
                        <p className="mt-2 text-sm text-gray-300">
                            You are about to delete <span className="font-medium text-white">{selectedCount}</span>{" "}
                            {selectedCount === 1 ? "item" : "items"}. This action cannot be undone.
                        </p>
                        <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deletion Confirmation Modal (Single) */}
            {deleteOneId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteOneId(null)} />
                    <div className="relative z-10 w-[92%] sm:w-[80%] max-w-md rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-xl">
                        <h2 className="text-lg font-semibold text-white">Delete item</h2>
                        <p className="mt-2 text-sm text-gray-300">
                            You are about to delete <span className="font-mono text-white">{deleteOneId}</span>. This action cannot be undone.
                        </p>
                        <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
                            <button
                                onClick={() => setDeleteOneId(null)}
                                className="px-4 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteOne}
                                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
