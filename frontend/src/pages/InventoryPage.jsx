import React, {useEffect, useMemo, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {useAuthFetch} from "../hooks/useAuthFetch";
import {listAllInventory, deleteInventory} from "../api/inventory";

export default function InventoryPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const authFetch = useAuthFetch();

    const params = new URLSearchParams(location.search);
    const [query, setQuery] = useState(params.get("query") || "");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [uomFilter, setUomFilter] = useState("all");
    const [sort, setSort] = useState({key: "code", dir: "asc"});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [rows, setRows] = useState([]);
    const [selected, setSelected] = useState({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteOneCode, setDeleteOneCode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [menu, setMenu] = useState(null);
    const [sheetCode, setSheetCode] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                setLoading(true);
                setError("");
                const data = await listAllInventory(authFetch, {sort: "code,asc"});
                if (!ignore) setRows(Array.isArray(data) ? data : []);
            } catch (e) {
                if (!ignore) setError(e?.message || "Failed to load inventory.");
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [authFetch]);

    const categories = useMemo(
        () => ["all", ...Array.from(new Set(rows.map((r) => r.categoryName).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
        [rows]
    );
    const uoms = useMemo(
        () => ["all", ...Array.from(new Set(rows.map((r) => r.uom).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
        [rows]
    );

    const filtered = useMemo(() => {
        let data = rows.slice();
        if (categoryFilter !== "all") data = data.filter((r) => r.categoryName === categoryFilter);
        if (uomFilter !== "all") data = data.filter((r) => r.uom === uomFilter);
        if (query.trim()) {
            const q = query.trim().toLowerCase();
            data = data.filter((r) =>
                String(r.code || "").toLowerCase().includes(q)
                || String(r.itemId || "").toLowerCase().includes(q)
                || String(r.itemName || "").toLowerCase().includes(q)
            );
        }
        const {key, dir} = sort;
        data.sort((a, b) => {
            const av = a?.[key];
            const bv = b?.[key];
            const cmp = key === "available"
                ? Number(av || 0) - Number(bv || 0)
                : String(av || "").localeCompare(String(bv || ""), undefined, {numeric: true, sensitivity: "base"});
            return dir === "asc" ? cmp : -cmp;
        });
        return data;
    }, [rows, categoryFilter, uomFilter, query, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / Math.max(1, pageSize)));
    const paged = filtered.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const selectedCodes = Object.keys(selected).filter((k) => selected[k]);
    const allOnPageSelected = paged.length > 0 && paged.every((r) => selected[r.code]);
    const selectedCount = selectedCodes.length;

    const summary = useMemo(() => {
        const total = rows.length;
        const detached = rows.filter((r) => r.categoryDetached).length;
        const withDefaultCategory = rows.filter((r) => !r.categoryDetached).length;
        const categoriesCount = new Set(rows.map((r) => r.categoryName).filter(Boolean)).size;
        const lowOrNegative = rows.filter((r) => Number(r.available) <= 0).length;
        return {total, detached, withDefaultCategory, categoriesCount, lowOrNegative};
    }, [rows]);

    const toggleSort = (key) => {
        setSort((s) => (s.key === key ? {key, dir: s.dir === "asc" ? "desc" : "asc"} : {key, dir: "asc"}));
    };

    const toggleAll = () => {
        const next = {...selected};
        if (allOnPageSelected) {
            paged.forEach((r) => delete next[r.code]);
        } else {
            paged.forEach((r) => {
                next[r.code] = true;
            });
        }
        setSelected(next);
    };

    const toggleOne = (code) => setSelected((s) => ({...s, [code]: !s[code]}));

    const reloadRows = async () => {
        const data = await listAllInventory(authFetch, {sort: "code,asc"});
        setRows(Array.isArray(data) ? data : []);
    };

    const removeOne = async (code) => {
        await deleteInventory(authFetch, code);
        await reloadRows();
        setSelected((s) => {
            const next = {...s};
            delete next[code];
            return next;
        });
    };

    const removeSelected = async () => {
        if (!selectedCodes.length) return;
        await Promise.all(selectedCodes.map((code) => deleteInventory(authFetch, code)));
        await reloadRows();
        setSelected({});
    };

    const rowsForExport = () => (selectedCount ? filtered.filter((r) => selectedCodes.includes(r.code)) : filtered);

    const toCSV = (data) => {
        const headers = ["Code", "Item Ref", "Item Name", "Category", "UoM", "Available"];
        const escape = (v) => {
            const s = String(v ?? "");
            if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
            return s;
        };
        const lines = [headers.join(",")];
        data.forEach((r) => {
            lines.push([
                escape(r.code),
                escape(r.itemId),
                escape(r.itemName),
                escape(r.categoryName),
                escape(r.uom),
                escape(r.available),
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
        downloadBlob(
            new Blob(["\ufeff" + csv], {type: "text/csv;charset=utf-8;"}),
            `inventory_${new Date().toISOString().slice(0, 10)}.csv`
        );
    };

    const handlePrint = () => {
        const data = rowsForExport();
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
</style>
</head>
<body>
<h1>Inventory</h1>
<div class="meta">Exported ${new Date().toLocaleString()} • ${data.length} rows ${selectedCount ? "(selection)" : "(filtered)"}</div>
<table>
  <thead>
    <tr>
      <th>Code</th><th>Item Ref</th><th>Item Name</th><th>Category</th><th>UoM</th><th>Available</th>
    </tr>
  </thead>
  <tbody>
    ${data.map((r) => `
      <tr>
        <td>${r.code}</td>
        <td>${r.itemId}</td>
        <td>${r.itemName}</td>
        <td>${r.categoryName}</td>
        <td>${r.uom}</td>
        <td class="num">${r.available}</td>
      </tr>
    `).join("")}
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
            onClick={() => toggleSort(key)}
            className={`px-4 py-3 font-semibold text-slate-700 dark:text-gray-300 select-none cursor-pointer ${alignRight ? "text-right" : "text-left"}`}
        >
      <span className="inline-flex items-center gap-1">
        {label}
          {sort.key === key && <span className="text-slate-600 dark:text-gray-500">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </span>
        </th>
    );

    const goToEdit = (code) => navigate(`/inventory/${encodeURIComponent(code)}/edit`);
    const stopRowNav = (e) => e.stopPropagation();

    const openDesktopMenu = (e, code) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        setMenu({
            code,
            x: Math.max(8, rect.right - 196),
            y: rect.bottom + 8,
        });
    };

    const closeDesktopMenu = () => setMenu(null);

    useEffect(() => {
        const onDocClick = (ev) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(ev.target)) {
                closeDesktopMenu();
            }
        };
        const onEsc = (ev) => {
            if (ev.key === "Escape") {
                closeDesktopMenu();
                setSheetCode(null);
            }
        };
        if (menu) {
            document.addEventListener("mousedown", onDocClick);
            document.addEventListener("keydown", onEsc);
        }
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onEsc);
        };
    }, [menu]);

    const MenuItems = ({code, onDone}) => (
        <>
            <button
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-slate-100 dark:hover:bg-gray-800 text-slate-900 dark:text-gray-200"
                onClick={() => {
                    goToEdit(code);
                    onDone();
                }}
            >
                Open details
            </button>
            <button
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-500/10 text-red-700 dark:text-red-400"
                onClick={() => {
                    setDeleteOneCode(code);
                    onDone();
                }}
            >
                Delete
            </button>
        </>
    );

    return (
        <div className="min-h-full text-slate-900 dark:text-gray-200">
            <header className="mx-auto px-4 pt-8 pb-5">
                <div className="flex items-start md:items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Inventory</h1>
                        <p className="mt-1 md:mt-2 text-slate-500 dark:text-gray-400 text-sm md:text-base">
                            Inventory records linked to Items with category override support.
                        </p>
                        {loading && <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">Loading...</p>}
                        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
                    </div>
                    <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => navigate("/inventory/new")}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                        >
                            + New Inventory
                        </button>
                    </div>
                </div>
            </header>

            <div className="mx-auto px-4 pb-4">
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                            <select
                                value={categoryFilter}
                                onChange={(e) => {
                                    setCategoryFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                            >
                                {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>)}
                            </select>
                            <select
                                value={uomFilter}
                                onChange={(e) => {
                                    setUomFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                            >
                                {uoms.map((u) => <option key={u} value={u}>{u === "all" ? "All UoM" : u}</option>)}
                            </select>
                        </div>

                        <div className="relative flex-1">
                            <input
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setPage(1);
                                }}
                                placeholder="Search code, item ref, item name..."
                                className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 pl-3 pr-10 py-2 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-gray-500">⌕</span>
                        </div>

                        <div className="flex items-center gap-2 md:ml-auto">
                            <button
                                onClick={handleExportCSV}
                                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 text-sm hover:bg-slate-200 dark:hover:bg-gray-700"
                            >
                                Export CSV
                            </button>
                            <button
                                onClick={handlePrint}
                                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 text-sm hover:bg-slate-200 dark:hover:bg-gray-700"
                            >
                                Print / PDF
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                disabled={!selectedCount}
                                className="px-3 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm disabled:opacity-40"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <section className="mx-auto px-4 pb-12">
                <div className="md:hidden">
                    <div className="mb-2 flex items-center justify-between">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300">
                            <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll}/>
                            <span>Select all on page</span>
                        </label>
                        <span className="text-xs text-slate-500 dark:text-gray-400">
              {paged.length === 0 ? 0 : ((page - 1) * pageSize + 1)}-{((page - 1) * pageSize) + paged.length} of {filtered.length}
            </span>
                    </div>

                    <div className="space-y-2">
                        {paged.map((r) => (
                            <div
                                key={r.code}
                                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-3 active:bg-slate-100/60 dark:active:bg-gray-800/40"
                                onClick={() => goToEdit(r.code)}
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={!!selected[r.code]}
                                        onChange={() => toggleOne(r.code)}
                                        onClick={stopRowNav}
                                        className="mt-1"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="font-mono text-slate-900 dark:text-white text-sm">
                                                <span className="underline decoration-dotted">{r.code}</span>
                                            </div>
                                            <button
                                                className="shrink-0 px-2 py-1 rounded-md hover:bg-slate-100/70 dark:hover:bg-gray-800/60 text-slate-700 dark:text-gray-300"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSheetCode(r.code);
                                                }}
                                                aria-label="Actions"
                                                title="Actions"
                                            >
                                                …
                                            </button>
                                        </div>
                                        <div className="mt-1 text-slate-900 dark:text-gray-200 text-sm line-clamp-2">
                                            {r.itemId} - {r.itemName}
                                        </div>
                                        <div
                                            className="mt-1 text-xs text-slate-500 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                                            <span>{r.categoryName}</span>
                                            <span>•</span>
                                            <span>{r.uom}</span>
                                            <span>•</span>
                                            <span className="font-mono">Available: {r.available}</span>
                                            {r.categoryDetached && (
                                                <>
                                                    <span>•</span>
                                                    <span
                                                        className="px-2 py-0.5 text-[10px] rounded-full bg-blue-600/30 text-blue-300 whitespace-nowrap">
                            Detached
                          </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {paged.length === 0 && (
                            <div
                                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-6 text-center text-slate-500 dark:text-gray-400">
                                No inventory items found.
                            </div>
                        )}
                    </div>
                </div>

                <div
                    className="hidden md:block overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-gray-900/60">
                    <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-slate-100/80 dark:bg-gray-900/80">
                        <tr>
                            <th className="px-4 py-3">
                                <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll}/>
                            </th>
                            {th("Code", "code")}
                            {th("Item Ref", "itemId")}
                            {th("Item Name", "itemName")}
                            {th("Category", "categoryName")}
                            {th("UoM", "uom")}
                            {th("Available", "available", true)}
                            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-gray-300 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                        {paged.map((r) => (
                            <tr
                                key={r.code}
                                className="hover:bg-slate-100/60 dark:hover:bg-gray-800/40 transition cursor-pointer"
                                onClick={() => goToEdit(r.code)}
                            >
                                <td className="px-4 py-3" onClick={stopRowNav}>
                                    <input type="checkbox" checked={!!selected[r.code]} onChange={() => toggleOne(r.code)}/>
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-900 dark:text-white">
                                    <span className="underline decoration-dotted">{r.code}</span>
                                </td>
                                <td className="px-4 py-3 text-slate-500 dark:text-gray-400">{r.itemId}</td>
                                <td className="px-4 py-3 text-slate-900 dark:text-gray-200">{r.itemName}</td>
                                <td className="px-4 py-3 text-slate-500 dark:text-gray-400">
                                    <div className="inline-flex items-center gap-2">
                                        <span>{r.categoryName}</span>
                                        {r.categoryDetached && (
                                            <span
                                                className="px-2 py-0.5 text-[10px] rounded-full bg-blue-600/30 text-blue-300">Detached</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-slate-500 dark:text-gray-400">{r.uom}</td>
                                <td className="px-4 py-3 text-right text-slate-900 dark:text-gray-200 font-mono">{r.available}</td>
                                <td className="px-4 py-3 text-right" onClick={stopRowNav}>
                                    <button
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-100/70 dark:hover:bg-gray-800/60 text-slate-700 dark:text-gray-300"
                                        aria-label="Actions"
                                        title="Actions"
                                        onClick={(e) => openDesktopMenu(e, r.code)}
                                    >
                                        …
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paged.length === 0 && (
                            <tr>
                                <td className="px-4 py-6 text-center text-slate-500 dark:text-gray-400" colSpan={8}>
                                    No inventory items found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div
                    className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-slate-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                        <span>Rows per page</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }}
                            className="rounded bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-2 py-1"
                        >
                            {[8, 16, 24].map((n) => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                        <span className="hidden sm:inline">•</span>
                        <span>
              Showing <span className="text-slate-700 dark:text-gray-300">{paged.length === 0 ? 0 : ((page - 1) * pageSize + 1)}</span>-
              <span className="text-slate-700 dark:text-gray-300">{((page - 1) * pageSize) + paged.length}</span> of
              <span className="text-slate-700 dark:text-gray-300"> {filtered.length}</span>
            </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-3 py-1 rounded bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <span className="px-2">{page} / {totalPages}</span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-3 py-1 rounded bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>

            {menu && (
                <div
                    ref={menuRef}
                    className="fixed z-50 min-w-[200px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-2xl"
                    style={{left: `${menu.x}px`, top: `${menu.y}px`}}
                    onClick={stopRowNav}
                >
                    <MenuItems code={menu.code} onDone={closeDesktopMenu}/>
                </div>
            )}

            {sheetCode && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setSheetCode(null)}/>
                    <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 p-2 pt-3 shadow-2xl">
                        <div className="mx-auto h-1 w-10 rounded-full bg-white/20 mb-1.5"/>
                        <div className="px-2 pb-2">
                            <div className="text-xs text-slate-500 dark:text-gray-400 mb-2 px-1">
                                Actions for <span className="font-mono text-slate-700 dark:text-gray-300">{sheetCode}</span>
                            </div>
                            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 divide-y divide-white/10">
                                <MenuItems code={sheetCode} onDone={() => setSheetCode(null)}/>
                            </div>
                            <button
                                className="mt-2 w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-gray-700 text-sm"
                                onClick={() => setSheetCode(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/55" onClick={() => setShowDeleteModal(false)}/>
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div
                            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 p-5 shadow-2xl">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Delete inventory items</h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">
                                Delete {selectedCount} selected inventory record(s)?
                            </p>
                            <div className="mt-4 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        removeSelected().catch((e) => setError(e?.message || "Failed to delete selected records."));
                                        setShowDeleteModal(false);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {deleteOneCode && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/55" onClick={() => setDeleteOneCode(null)}/>
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div
                            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 p-5 shadow-2xl">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Delete inventory item</h2>
                            <p className="mt-2 text-sm text-slate-600 dark:text-gray-400">
                                Delete inventory record &quot;{deleteOneCode}&quot;?
                            </p>
                            <div className="mt-4 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => setDeleteOneCode(null)}
                                    className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        removeOne(deleteOneCode).catch((e) => setError(e?.message || "Failed to delete inventory record."));
                                        setDeleteOneCode(null);
                                    }}
                                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export {InventoryPage};
