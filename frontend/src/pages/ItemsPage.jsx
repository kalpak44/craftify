import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuthFetch} from "../hooks/useAuthFetch";
import {listItems, listAllItems, getItem, deleteItem, exportItemsCsv, importItemsCsv} from "../api/items";
import {listCategories} from "../api/categories";
import {createInventoryFromItem} from "../api/inventory";

/**
 * ItemsPage
 *
 * ERP-style Items list built with React + Tailwind (raw JS).
 *
 * Update in this version:
 * - Per-row desktop/menu actions use an ellipsis "…" trigger with dropdown (desktop) and bottom sheet (mobile).
 * - Actions include: "Open details", "Search in Inventory", "Create Inventory" (Active only), and "Delete".
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
    // Backend-backed data
    const [rows, setRows] = useState([]);
    const [query, setQuery] = useState("");
    const [queryDebounced, setQueryDebounced] = useState("");
    const [status, setStatus] = useState("all");
    const [category, setCategory] = useState("all");
    const [uom, setUom] = useState("all");
    const [sort, setSort] = useState({key: "updatedAt", dir: "desc"});
    const [selected, setSelected] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    // Server paging
    const [serverTotalElements, setServerTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [summary, setSummary] = useState({
        total: 0,
        draft: 0,
        active: 0,
        hold: 0,
        discontinued: 0,
    });
    const [categoryOptions, setCategoryOptions] = useState(["all"]);

    // Bulk deletion modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Single-row deletion modal
    const [deleteOneId, setDeleteOneId] = useState(null);
    const [createInvForItem, setCreateInvForItem] = useState(null);
    const [createInvAvailable, setCreateInvAvailable] = useState("");
    const [createInvMode, setCreateInvMode] = useState("add");
    const [creatingInventory, setCreatingInventory] = useState(false);

    // Reload tick to refetch after mutations
    const [reloadTick, setReloadTick] = useState(0);

    // Desktop dropdown menu: { id, x, y } or null
    const [menu, setMenu] = useState(null);
    const menuRef = useRef(null);

    // Mobile action sheet: id or null
    const [sheetId, setSheetId] = useState(null);
    const importInputRef = useRef(null);
    const [importResultModal, setImportResultModal] = useState(null);
    const [feedbackModal, setFeedbackModal] = useState(null);
    const [importingCsv, setImportingCsv] = useState(false);

    const navigate = useNavigate();
    const authFetch = useAuthFetch();
    const itemCode = (item) => item?.code || item?.id;

    // Options (category uses categoryName, uom uses uomBase)
    const categories = categoryOptions;
    const uoms = useMemo(() => ["all", ...new Set(rows.map((d) => d.uomBase).filter(Boolean))], [rows]);

    // Debounce search input for server queries
    useEffect(() => {
        const t = setTimeout(() => setQueryDebounced(query.trim()), 250);
        return () => clearTimeout(t);
    }, [query]);

    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const res = await listCategories(authFetch, {page: 0, size: 200, sort: "name,asc"});
                if (ignore) return;
                const names = (res?.content || []).map((c) => c?.name).filter(Boolean);
                setCategoryOptions(["all", ...names]);
            } catch (_) {
                if (!ignore) {
                    setCategoryOptions(["all"]);
                }
            }
        })();
        return () => {
            ignore = true;
        };
    }, [authFetch, reloadTick]);

    // Fetch all filtered rows from backend when sort/query/filters change (debounced)
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                setLoading(true);
                setError("");
                const serverSortKey =
                    sort.key === "id"
                        ? "code"
                        : sort.key === "name"
                            ? "name"
                            : sort.key === "updatedAt"
                                ? "updatedAt"
                                : "name";
                const allRows = await listAllItems(authFetch, {
                    sort: `${serverSortKey},${sort.dir}`,
                    q: queryDebounced || undefined,
                    status: status !== "all" ? status : undefined,
                    categoryName: category !== "all" ? category : undefined,
                    uom: uom !== "all" ? uom : undefined,
                });
                if (ignore) return;
                setRows(Array.isArray(allRows) ? allRows : []);
                setServerTotalElements(Array.isArray(allRows) ? allRows.length : 0);
            } catch (e) {
                if (!ignore) setError(e?.message || "Failed to load items");
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [authFetch, sort, queryDebounced, status, category, uom, reloadTick]);

    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const [tot, draft, active, hold, discontinued] = await Promise.all([
                    listItems(authFetch, {
                        page: 0,
                        size: 1,
                        q: queryDebounced || undefined,
                        categoryName: category !== "all" ? category : undefined,
                        uom: uom !== "all" ? uom : undefined,
                    }),
                    listItems(authFetch, {
                        page: 0,
                        size: 1,
                        q: queryDebounced || undefined,
                        status: "Draft",
                        categoryName: category !== "all" ? category : undefined,
                        uom: uom !== "all" ? uom : undefined,
                    }),
                    listItems(authFetch, {
                        page: 0,
                        size: 1,
                        q: queryDebounced || undefined,
                        status: "Active",
                        categoryName: category !== "all" ? category : undefined,
                        uom: uom !== "all" ? uom : undefined,
                    }),
                    listItems(authFetch, {
                        page: 0,
                        size: 1,
                        q: queryDebounced || undefined,
                        status: "Hold",
                        categoryName: category !== "all" ? category : undefined,
                        uom: uom !== "all" ? uom : undefined,
                    }),
                    listItems(authFetch, {
                        page: 0,
                        size: 1,
                        q: queryDebounced || undefined,
                        status: "Discontinued",
                        categoryName: category !== "all" ? category : undefined,
                        uom: uom !== "all" ? uom : undefined,
                    }),
                ]);
                if (ignore) return;
                setSummary({
                    total: tot?.totalElements || 0,
                    draft: draft?.totalElements || 0,
                    active: active?.totalElements || 0,
                    hold: hold?.totalElements || 0,
                    discontinued: discontinued?.totalElements || 0,
                });
            } catch (_) {
                if (!ignore) {
                    setSummary({total: serverTotalElements, draft: 0, active: 0, hold: 0, discontinued: 0});
                }
            }
        })();
        return () => {
            ignore = true;
        };
    }, [authFetch, queryDebounced, category, uom, reloadTick, serverTotalElements]);

    // Sort current page rows for column toggles.
    const filtered = useMemo(() => {
        let data = rows;
        const {key, dir} = sort;
        data = [...data].sort((a, b) => {
            const av = a[key];
            const bv = b[key];
            const cmp =
                typeof av === "number" && typeof bv === "number"
                    ? av - bv
                    : String(av ?? "").localeCompare(String(bv ?? ""), undefined, {numeric: true, sensitivity: "base"});
            return dir === "asc" ? cmp : -cmp;
        });
        return data;
    }, [rows, sort]);

    // Paging (client-side over all rows fetched from backend)
    const totalPages = Math.max(1, Math.ceil(filtered.length / Math.max(1, pageSize)));
    const paged = filtered.slice((page - 1) * pageSize, ((page - 1) * pageSize) + pageSize);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    // Selection
    const selectedIds = Object.keys(selected).filter((k) => selected[k]);
    const selectedCount = selectedIds.length;
    const rowById = useMemo(() => new Map(rows.map((r) => [itemCode(r), r])), [rows]);

    const allOnPageSelected = paged.length > 0 && paged.every((r) => selected[itemCode(r)]);
    const toggleAll = () => {
        const next = {...selected};
        if (allOnPageSelected) {
            paged.forEach((r) => delete next[itemCode(r)]);
        } else {
            paged.forEach((r) => (next[itemCode(r)] = true));
        }
        setSelected(next);
    };
    const toggleOne = (id) => setSelected((s) => ({...s, [id]: !s[id]}));

    // ---------- Export helpers ----------
    const rowsForExport = () => (selectedCount ? filtered.filter((r) => selectedIds.includes(itemCode(r))) : filtered);

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

    const handleExportCSV = async () => {
        try {
            const {blob, filename} = await exportItemsCsv(authFetch, {
                ids: selectedCount ? selectedIds : undefined,
                q: selectedCount ? undefined : (queryDebounced || undefined),
                status: selectedCount ? undefined : (status !== "all" ? status : undefined),
                categoryName: selectedCount ? undefined : (category !== "all" ? category : undefined),
                uom: selectedCount ? undefined : (uom !== "all" ? uom : undefined),
            });
            downloadBlob(blob, filename);
        } catch (e) {
            setFeedbackModal({
                title: "Items export failed",
                lines: [e?.message || "Failed to export CSV"],
            });
        }
    };

    const handleImportPick = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setImportingCsv(true);
            setLoading(true);
            const result = await importItemsCsv(authFetch, file, "upsert");
            const errorCount = result?.errors?.length || 0;
            const headErrors = (result?.errors || [])
                .slice(0, 5)
                .map((x) => `row ${x.row}: ${x.field} - ${x.message}`);
            setImportResultModal({
                title: "Items import completed",
                created: result?.created || 0,
                updated: result?.updated || 0,
                errors: errorCount,
                headErrors,
            });
            setReloadTick((t) => t + 1);
        } catch (err) {
            setImportResultModal({
                title: "Items import failed",
                created: 0,
                updated: 0,
                errors: null,
                headErrors: [err?.message || "Failed to import CSV"],
            });
        } finally {
            e.target.value = "";
            setLoading(false);
            setImportingCsv(false);
        }
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
          <td>${itemCode(r)}</td>
          <td>${r.name}</td>
          <td>${r.status}</td>
          <td>${r.categoryName ?? ""}</td>
          <td>${r.uomBase ?? ""}</td>
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
            className={`px-4 py-3 font-semibold text-slate-700 dark:text-gray-300 select-none cursor-pointer ${alignRight ? "text-right" : "text-left"}`}
        >
      <span className="inline-flex items-center gap-1">
        {label}
          {sort.key === key && <span className="text-slate-600 dark:text-gray-500">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </span>
        </th>
    );

    // Delete (bulk)
    const openDeleteModal = () => {
        if (!selectedCount) return;
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!selectedCount) {
            setShowDeleteModal(false);
            return;
        }
        try {
            setLoading(true);
            const results = await Promise.allSettled(
                selectedIds.map(async (id) => {
                    const detail = await getItem(authFetch, id);
                    await deleteItem(authFetch, id, detail.version);
                })
            );
            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length) {
                const reasons = failures
                    .slice(0, 5)
                    .map((f) => f?.reason?.message)
                    .filter(Boolean);
                setFeedbackModal({
                    title: "Items deletion incomplete",
                    lines: [
                        `Failed to delete ${failures.length} of ${selectedCount} items.`,
                        ...reasons,
                    ],
                });
            }
            setSelected({});
            setShowDeleteModal(false);
            setReloadTick((t) => t + 1);
        } catch (e) {
            setFeedbackModal({
                title: "Items deletion failed",
                lines: [e?.message || "Failed to delete items"],
            });
        } finally {
            setLoading(false);
        }
    };

    // Delete single row
    const confirmDeleteOne = async () => {
        if (!deleteOneId) return;
        try {
            setLoading(true);
            const detail = await getItem(authFetch, deleteOneId);
            await deleteItem(authFetch, deleteOneId, detail.version);
            setSelected((s) => {
                const next = {...s};
                delete next[deleteOneId];
                return next;
            });
            setDeleteOneId(null);
            setReloadTick((t) => t + 1);
        } catch (e) {
            setFeedbackModal({
                title: "Item deletion failed",
                lines: [e?.message || "Failed to delete item"],
            });
        } finally {
            setLoading(false);
        }
    };

    // Navigate
    const goToEdit = (id) => navigate(`/items/${encodeURIComponent(id)}/edit`);

    // Resolve a stable item code before inventory creation.
    // Some API deployments may return/use different identifiers in list endpoints.
    const resolveItemCodeForInventory = async (itemIdentifier) => {
        const fallback = String(itemIdentifier || "").trim();
        if (!fallback) return "";
        try {
            const detail = await getItem(authFetch, fallback);
            return String(detail?.code || detail?.id || fallback).trim();
        } catch (_) {
            return fallback;
        }
    };

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
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-gray-800"
                onClick={(e) => {
                    e.stopPropagation();
                    goToEdit(id);
                    onDone?.();
                }}
            >
                Open details
            </button>
            <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-gray-800"
                onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/inventory?query=${encodeURIComponent(id)}`);
                    onDone?.();
                }}
            >
                Search in Inventory
            </button>
            {rowById.get(id)?.status === "Active" && (
                <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-gray-800"
                    onClick={(e) => {
                        e.stopPropagation();
                        const row = rowById.get(id);
                        setCreateInvForItem({id, name: row?.name || ""});
                        setCreateInvAvailable("");
                        setCreateInvMode("add");
                        onDone?.();
                    }}
                >
                    Create Inventory
                </button>
            )}
            <div className="my-1 border-t border-slate-200 dark:border-white/10" />
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
        <div className="min-h-full text-slate-900 dark:text-gray-200">
            {/* Header */}
            <header className="mx-auto px-4 pt-8 pb-5">
                <div className="flex items-start md:items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Items</h1>
                        <p className="mt-1 md:mt-2 text-slate-500 dark:text-gray-400 text-sm md:text-base">Search, filter, and manage SKUs.</p>
                    </div>
                    <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                        <button
                            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                            onClick={() => navigate("/items/new")}
                        >
                            + New Item
                        </button>
                    </div>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-3">
                        <div className="text-xs text-slate-500 dark:text-gray-400">Total Items</div>
                        <div className="text-lg font-semibold text-slate-900 dark:text-white">{summary.total}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-3">
                        <div className="text-xs text-slate-500 dark:text-gray-400">Draft</div>
                        <div className="text-lg font-semibold text-blue-300">{summary.draft}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-3">
                        <div className="text-xs text-slate-500 dark:text-gray-400">Active</div>
                        <div className="text-lg font-semibold text-green-400">{summary.active}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-3">
                        <div className="text-xs text-slate-500 dark:text-gray-400">Hold</div>
                        <div className="text-lg font-semibold text-yellow-400">{summary.hold}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-3">
                        <div className="text-xs text-slate-500 dark:text-gray-400">Discontinued</div>
                        <div className="text-lg font-semibold text-slate-700 dark:text-gray-300">{summary.discontinued}</div>
                    </div>
                </div>
            </header>

            {/* Filters / Toolbar */}
            <div className="mx-auto px-4 pb-4">
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
                            <select
                                value={category}
                                onChange={(e) => {
                                    setCategory(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
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
                                className="rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                            >
                                <option value="all">All Statuses</option>
                                <option value="Draft">Draft</option>
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
                                className="rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm col-span-2 sm:col-span-1"
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
                                className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 pl-3 pr-10 py-2 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-gray-500">⌕</span>
                        </div>

                        {/* Bulk actions */}
                        <div className="flex items-center gap-2 md:ml-auto">
                            <input
                                ref={importInputRef}
                                type="file"
                                accept=".csv,text/csv"
                                onChange={handleImportPick}
                                className="hidden"
                            />
                            <button
                                onClick={() => importInputRef.current?.click()}
                                disabled={importingCsv}
                                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 text-sm hover:bg-slate-200 dark:hover:bg-gray-700 disabled:opacity-50"
                            >
                                {importingCsv ? "Importing..." : "Import CSV"}
                            </button>
                            <button
                                onClick={handleExportCSV}
                                disabled={importingCsv}
                                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 text-sm hover:bg-slate-200 dark:hover:bg-gray-700"
                                title={`Export ${selectedCount ? "selected" : "filtered"} rows to CSV`}
                            >
                                Export CSV
                            </button>
                            <button
                                onClick={handlePrint}
                                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 text-sm hover:bg-slate-200 dark:hover:bg-gray-700"
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
                {loading && <div className="mt-2 text-xs text-blue-300">Loading…</div>}
                {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
            </div>

            {/* List/Table */}
            <section className="mx-auto px-4 pb-12">
                {/* Mobile card list */}
                <div className="md:hidden">
                    {/* Select-all toolbar for mobile */}
                    <div className="mb-2 flex items-center justify-between">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300">
                            <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} onClick={stopRowNav}/>
                            <span>Select all on page</span>
                        </label>
                        <span className="text-xs text-slate-500 dark:text-gray-400">
              {paged.length === 0 ? 0 : ((page - 1) * pageSize + 1)}–{((page - 1) * pageSize) + paged.length} of {serverTotalElements}
            </span>
                    </div>

                    <div className="space-y-2">
                        {paged.map((item) => (
                            <div
                                key={itemCode(item)}
                                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-3 active:bg-slate-100/60 dark:active:bg-gray-800/40"
                                onClick={() => goToEdit(itemCode(item))}
                                title="Open Edit"
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={!!selected[itemCode(item)]}
                                        onChange={() => toggleOne(itemCode(item))}
                                        onClick={stopRowNav}
                                        className="mt-1"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="font-mono text-slate-900 dark:text-white text-sm">
                                                <span className="underline decoration-dotted">{itemCode(item)}</span>
                                            </div>
                                            {/* Mobile actions trigger */}
                                            <button
                                                className="shrink-0 px-2 py-1 rounded-md hover:bg-slate-100/70 dark:hover:bg-gray-800/60 text-slate-700 dark:text-gray-300"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSheetId(itemCode(item));
                                                }}
                                                aria-label="Actions"
                                                title="Actions"
                                            >
                                                …
                                            </button>
                                        </div>
                                        <div className="mt-1 text-slate-900 dark:text-gray-200 text-sm line-clamp-2">{item.name}</div>
                                        <div className="mt-1 text-xs text-slate-500 dark:text-gray-400 flex items-center gap-2">
                                            <span className="truncate">{item.categoryName || ""}</span>
                                            <span>•</span>
                                            <span>{item.uomBase || ""}</span>
                                            <span className={`ml-auto px-2 py-0.5 text-[10px] rounded-full whitespace-nowrap ${
                                                item.status === "Active" ? "bg-green-600/30 text-green-400"
                                                    : item.status === "Hold" ? "bg-yellow-600/30 text-yellow-400"
                                                        : "bg-gray-600/30 text-slate-500 dark:text-gray-400"}`}>
                        {item.status}
                      </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {paged.length === 0 && (
                            <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-6 text-center text-slate-500 dark:text-gray-400">
                                No items found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-gray-900/60">
                    <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-slate-100/80 dark:bg-gray-900/80">
                        <tr>
                            <th className="px-4 py-3">
                                <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} onClick={stopRowNav}/>
                            </th>
                            {th("ID", "id")}
                            {th("Product name", "name")}
                            {th("Status", "status")}
                            {th("Category", "categoryName")}
                            {th("UoM", "uomBase")}
                            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-gray-300 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                        {paged.map((item) => (
                            <tr
                                key={itemCode(item)}
                                className="hover:bg-slate-100/60 dark:hover:bg-gray-800/40 transition cursor-pointer"
                                onClick={() => goToEdit(itemCode(item))}
                                title="Open Edit"
                            >
                                <td className="px-4 py-3" onClick={stopRowNav}>
                                    <input type="checkbox" checked={!!selected[itemCode(item)]} onChange={() => toggleOne(itemCode(item))}/>
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-900 dark:text-white">
                                    <span className="underline decoration-dotted">{itemCode(item)}</span>
                                </td>
                                <td className="px-4 py-3 text-slate-900 dark:text-gray-200">{item.name}</td>
                                <td className="px-4 py-3">
                  <span
                      className={`px-2 py-1 text-xs rounded-full ${
                          item.status === "Active"
                              ? "bg-green-600/30 text-green-400"
                              : item.status === "Hold"
                                  ? "bg-yellow-600/30 text-yellow-400"
                                  : "bg-gray-600/30 text-slate-500 dark:text-gray-400"
                      }`}
                  >
                    {item.status}
                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-500 dark:text-gray-400">{item.categoryName || ""}</td>
                                <td className="px-4 py-3 text-slate-500 dark:text-gray-400">{item.uomBase || ""}</td>
                                <td className="px-4 py-3 text-right" onClick={stopRowNav}>
                                    {/* Desktop actions trigger */}
                                    <button
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-100/70 dark:hover:bg-gray-800/60 text-slate-700 dark:text-gray-300"
                                        aria-label="Actions"
                                        title="Actions"
                                        onClick={(e) => openDesktopMenu(e, itemCode(item))}
                                    >
                                        …
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paged.length === 0 && (
                            <tr>
                                <td className="px-4 py-6 text-center text-slate-500 dark:text-gray-400" colSpan={7}>
                                    No items found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-slate-500 dark:text-gray-400">
                    <div className="flex items-center gap-2 flex-wrap">
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
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                        <span className="hidden sm:inline">•</span>
                        <span>
              Showing <span className="text-slate-700 dark:text-gray-300">{paged.length === 0 ? 0 : ((page - 1) * pageSize + 1)}</span>–
              <span className="text-slate-700 dark:text-gray-300">{((page - 1) * pageSize) + paged.length}</span> of
              <span className="text-slate-700 dark:text-gray-300"> {serverTotalElements}</span>
            </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1 rounded bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <span className="px-2">
              {page} / {totalPages}
            </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="px-3 py-1 rounded bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 disabled:opacity-40"
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
                    className="fixed z-50 min-w-[200px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-2xl"
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
                    <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 p-2 pt-3 shadow-2xl">
                        <div className="mx-auto h-1 w-10 rounded-full bg-white/20 mb-1.5" />
                        <div className="px-2 pb-2">
                            <div className="text-xs text-slate-500 dark:text-gray-400 mb-2 px-1">Actions for <span className="font-mono text-slate-700 dark:text-gray-300">{sheetId}</span></div>
                            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 divide-y divide-white/10">
                                <MenuItems id={sheetId} onDone={() => setSheetId(null)} />
                            </div>
                            <button
                                className="mt-2 w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-gray-700 text-sm"
                                onClick={() => setSheetId(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Inventory Modal */}
            {createInvForItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setCreateInvForItem(null)} />
                    <div className="relative z-10 w-[92%] sm:w-[80%] max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 p-5 shadow-xl">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create inventory item</h2>
                        <p className="mt-2 text-sm text-slate-700 dark:text-gray-300">
                            Item: <span className="font-mono text-slate-900 dark:text-white">{createInvForItem.id}</span>
                            {createInvForItem.name ? <span> - {createInvForItem.name}</span> : null}
                        </p>
                        <div className="mt-4">
                            <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Availability</label>
                            <input
                                inputMode="decimal"
                                value={createInvAvailable}
                                onChange={(e) => setCreateInvAvailable(e.target.value)}
                                className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm text-right font-mono tabular-nums"
                                placeholder="0"
                            />
                        </div>
                        <div className="mt-3">
                            <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">If inventory already exists</label>
                            <select
                                value={createInvMode}
                                onChange={(e) => setCreateInvMode(e.target.value)}
                                className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                            >
                                <option value="add">Add to existing availability</option>
                                <option value="override">Override availability</option>
                            </select>
                        </div>
                        <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
                            <button
                                onClick={() => setCreateInvForItem(null)}
                                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-gray-700 text-sm"
                                disabled={creatingInventory}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    const n = Number(String(createInvAvailable).trim());
                                    if (!Number.isFinite(n)) {
                                        setFeedbackModal({
                                            title: "Invalid availability",
                                            lines: ["Please enter a valid availability."],
                                        });
                                        return;
                                    }
                                    try {
                                        setCreatingInventory(true);
                                        const requestedId = String(createInvForItem.id || "").trim();
                                        const canonicalCode = await resolveItemCodeForInventory(requestedId);
                                        let created;
                                        try {
                                            created = await createInventoryFromItem(authFetch, canonicalCode, n, createInvMode);
                                        } catch (e) {
                                            if (e?.message === "Item not found." && canonicalCode !== requestedId) {
                                                created = await createInventoryFromItem(authFetch, requestedId, n, createInvMode);
                                            } else {
                                                throw e;
                                            }
                                        }
                                        setCreateInvForItem(null);
                                        navigate(`/inventory/${encodeURIComponent(created.code)}/edit`);
                                    } catch (e) {
                                        setFeedbackModal({
                                            title: "Create inventory failed",
                                            lines: [e?.message || "Failed to create inventory item"],
                                        });
                                    } finally {
                                        setCreatingInventory(false);
                                    }
                                }}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
                                disabled={creatingInventory}
                            >
                                {creatingInventory ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deletion Confirmation Modal (Bulk) */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setShowDeleteModal(false)}/>
                    <div className="relative z-10 w-[92%] sm:w-[80%] max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 p-5 shadow-xl">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Confirm deletion</h2>
                        <p className="mt-2 text-sm text-slate-700 dark:text-gray-300">
                            You are about to delete <span className="font-medium text-slate-900 dark:text-white">{selectedCount}</span>{" "}
                            {selectedCount === 1 ? "item" : "items"}. This action cannot be undone.
                        </p>
                        <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-gray-700 text-sm"
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
                    <div className="relative z-10 w-[92%] sm:w-[80%] max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 p-5 shadow-xl">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Delete item</h2>
                        <p className="mt-2 text-sm text-slate-700 dark:text-gray-300">
                            You are about to delete <span className="font-mono text-slate-900 dark:text-white">{deleteOneId}</span>. This action cannot be undone.
                        </p>
                        <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2">
                            <button
                                onClick={() => setDeleteOneId(null)}
                                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-gray-700 text-sm"
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

            {importResultModal && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/55" onClick={() => setImportResultModal(null)}/>
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div
                            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 p-5 shadow-2xl">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{importResultModal.title}</h2>
                            <div className="mt-3 text-sm text-slate-600 dark:text-gray-400 space-y-1">
                                <div>Created: <span className="text-slate-900 dark:text-gray-200">{importResultModal.created}</span></div>
                                <div>Updated: <span className="text-slate-900 dark:text-gray-200">{importResultModal.updated}</span></div>
                                {importResultModal.errors != null && (
                                    <div>Errors: <span className="text-slate-900 dark:text-gray-200">{importResultModal.errors}</span></div>
                                )}
                            </div>
                            {Array.isArray(importResultModal.headErrors) && importResultModal.headErrors.length > 0 && (
                                <div className="mt-3 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 p-3">
                                    <div className="text-xs font-semibold text-slate-700 dark:text-gray-300 mb-1">Details</div>
                                    <div className="text-xs text-slate-600 dark:text-gray-400 space-y-1 max-h-40 overflow-auto">
                                        {importResultModal.headErrors.map((line, idx) => (
                                            <div key={`${idx}-${line}`}>{line}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="mt-4 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => setImportResultModal(null)}
                                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {feedbackModal && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/55" onClick={() => setFeedbackModal(null)}/>
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div
                            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 p-5 shadow-2xl">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{feedbackModal.title}</h2>
                            {Array.isArray(feedbackModal.lines) && feedbackModal.lines.length > 0 && (
                                <div className="mt-3 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 p-3">
                                    <div className="text-xs text-slate-600 dark:text-gray-400 space-y-1 max-h-52 overflow-auto">
                                        {feedbackModal.lines.map((line, idx) => (
                                            <div key={`${idx}-${line}`}>{line}</div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="mt-4 flex items-center justify-end gap-2">
                                <button
                                    onClick={() => setFeedbackModal(null)}
                                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                                >
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
