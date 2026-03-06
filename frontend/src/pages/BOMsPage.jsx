import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAuthFetch} from "../hooks/useAuthFetch";
import {listBoms, getBom, deleteBom, exportBomsCsv, importBomsCsv} from "../api/boms";

/**
 * BOMsPage
 *
 * ERP-style Bill of Materials registry built with React + Tailwind (raw JS).
 *
 * Update in this version:
 * - Added per-row actions via an ellipsis "…" trigger:
 *   - Desktop: dropdown menu anchored to the trigger.
 *   - Mobile: bottom sheet action panel.
 * - Actions kept minimal per request: "Open details" and "Delete".
 * - Added single-row deletion confirmation modal (bulk delete unchanged).
 *
 * Core features (unchanged):
 * - Search, filter by status, sortable columns, pagination.
 * - Row selection (checkboxes) with bulk delete + confirmation modal.
 * - Each row/card click navigates to /boms/:id/edit.
 *
 * Notes:
 * - Uses mocked data stored in component state for client-side ops.
 */
export const BOMsPage = () => {
    // Backend-backed data
    const [rows, setRows] = useState([]);

    const navigate = useNavigate();
    // --- State ---
    const [query, setQuery] = useState("");
    const [queryDebounced, setQueryDebounced] = useState("");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState({key: "lastUpdated", dir: "desc"});
    const [selected, setSelected] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Server paging state
    const [serverTotalPages, setServerTotalPages] = useState(1);
    const [serverTotalElements, setServerTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [importingCsv, setImportingCsv] = useState(false);
    const [exportingCsv, setExportingCsv] = useState(false);

    // Single-row deletion modal
    const [deleteOneId, setDeleteOneId] = useState(null);

    // Desktop dropdown menu anchor/state: { id, x, y } or null
    const [menu, setMenu] = useState(null);
    const menuRef = useRef(null);
    const importInputRef = useRef(null);

    // Mobile action sheet: id or null
    const [sheetId, setSheetId] = useState(null);

    // Auth + reload tick
    const authFetch = useAuthFetch();
    const [reloadTick, setReloadTick] = useState(0);

    // Debounce search
    useEffect(() => {
        const t = setTimeout(() => setQueryDebounced(query.trim()), 250);
        return () => clearTimeout(t);
    }, [query]);

    // Fetch from backend
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                setLoading(true);
                setError("");
                const serverSortKey =
                    sort.key === "id"
                        ? "id"
                        : sort.key === "productId"
                            ? "productId"
                            : sort.key === "lastUpdated"
                                ? "updatedAt"
                                : "productName";
                const res = await listBoms(authFetch, {
                    page: Math.max(0, (page || 1) - 1),
                    size: pageSize,
                    sort: `${serverSortKey},${sort.dir}`,
                    q: queryDebounced || undefined,
                    status: status !== "all" ? status : undefined,
                });
                if (ignore) return;
                // Map backend rows to UI shape
                const mapped = (res.content || []).map((b) => ({
                    id: b.id,
                    product: b.productName || "",
                    productId: b.productId || "",
                    revision: b.revision || "",
                    status: b.status || "",
                    components: typeof b.componentsCount === "number" ? b.componentsCount : 0,
                    lastUpdated: b.updatedAt ? new Date(b.updatedAt).toISOString().slice(0, 10) : "",
                }));
                setRows(mapped);
                setServerTotalPages(res.totalPages || 1);
                setServerTotalElements(typeof res.totalElements === "number" ? res.totalElements : mapped.length);
            } catch (e) {
                if (!ignore) setError(e?.message || "Failed to load BOMs");
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => {
            ignore = true;
        };
    }, [authFetch, page, pageSize, sort, queryDebounced, status, reloadTick]);

    // --- Derived rows (client-side sort as safety on current page) ---
    const filtered = useMemo(() => {
        let data = rows;
        if (queryDebounced) {
            const q = queryDebounced.toLowerCase();
            data = data.filter(
                (r) =>
                    r.id.toLowerCase().includes(q) ||
                    r.product.toLowerCase().includes(q) ||
                    r.productId.toLowerCase().includes(q)
            );
        }
        if (status !== "all") data = data.filter((r) => r.status === status);

        const {key, dir} = sort;
        data = [...data].sort((a, b) => {
            const av = a[key];
            const bv = b[key];
            const cmp = key === "components" ? (Number(av) - Number(bv)) : String(av).localeCompare(String(bv), undefined, {numeric: true});
            return dir === "asc" ? cmp : -cmp;
        });
        return data;
    }, [rows, queryDebounced, status, sort]);

    // --- Paging ---
    const totalPages = serverTotalPages || Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageStart = (page - 1) * pageSize;
    const paged = filtered.slice(pageStart, pageStart + pageSize);

    // --- Selection ---
    const selectedIds = Object.keys(selected).filter((k) => selected[k]);
    const selectedCount = selectedIds.length;

    const allOnPageSelected = paged.length > 0 && paged.every((r) => selected[r.id]);
    const toggleAll = () => {
        const next = {...selected};
        if (allOnPageSelected) paged.forEach((r) => delete next[r.id]);
        else paged.forEach((r) => (next[r.id] = true));
        setSelected(next);
    };
    const toggleOne = (id) => setSelected((s) => ({...s, [id]: !s[id]}));

    // --- Helpers ---
    const th = (label, key, right = false) => (
        <th
            onClick={() => setSort((s) => ({key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc"}))}
            className={`px-4 py-3 font-semibold text-slate-700 dark:text-gray-300 select-none cursor-pointer ${right ? "text-right" : "text-left"}`}
        >
      <span className="inline-flex items-center gap-1">
        {label}
          {sort.key === key && <span className="text-slate-600 dark:text-gray-500">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </span>
        </th>
    );

    // --- Row navigation (details) ---
    const goToDetails = (id) => navigate(`/boms/${encodeURIComponent(id)}/edit`);
    const stopRowNav = (e) => e.stopPropagation();

    // --- Delete modal control (bulk) ---
    const openDeleteModal = () => {
        if (!selectedCount) return;
        setShowDeleteModal(true);
    };
    const confirmDelete = async () => {
        try {
            if (!selectedCount) {
                setShowDeleteModal(false);
                return;
            }
            // Delete selected on server with version check
            for (const id of selectedIds) {
                try {
                    const detail = await getBom(authFetch, id);
                    await deleteBom(authFetch, id, detail.version ?? 0);
                } catch (e) {
                    // swallow per-row errors to try others; could surface a toast in real app
                    console.warn("Failed to delete BOM", id, e);
                }
            }
            setSelected({});
            setReloadTick((n) => n + 1);
        } finally {
            setShowDeleteModal(false);
        }
    };

    // --- Delete single row ---
    const confirmDeleteOne = async () => {
        if (!deleteOneId) return;
        try {
            const detail = await getBom(authFetch, deleteOneId);
            await deleteBom(authFetch, deleteOneId, detail.version ?? 0);
            setReloadTick((n) => n + 1);
        } catch (e) {
            console.warn("Failed to delete BOM", deleteOneId, e);
        } finally {
            setSelected((s) => {
                const next = {...s};
                delete next[deleteOneId];
                return next;
            });
            setDeleteOneId(null);
        }
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

    const handleExportCSV = async () => {
        try {
            setExportingCsv(true);
            const {blob, filename} = await exportBomsCsv(authFetch, {
                q: queryDebounced || undefined,
                status: status !== "all" ? status : undefined,
                ids: selectedCount ? selectedIds : undefined,
            });
            downloadBlob(blob, filename);
        } catch (e) {
            alert(e?.message || "Failed to export BOM CSV");
        } finally {
            setExportingCsv(false);
        }
    };

    const handleImportPick = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setImportingCsv(true);
            const result = await importBomsCsv(authFetch, file, "upsert");
            const errorCount = result?.errors?.length || 0;
            const headErrors = (result?.errors || [])
                .slice(0, 5)
                .map((x) => `row ${x.row}: ${x.field} - ${x.message}`)
                .join("\n");
            alert(
                `Import completed.\nCreated: ${result?.created || 0}\nUpdated: ${result?.updated || 0}\nErrors: ${errorCount}` +
                (headErrors ? `\n\n${headErrors}` : "")
            );
            setReloadTick((n) => n + 1);
        } catch (e2) {
            alert(e2?.message || "Failed to import BOM CSV");
        } finally {
            e.target.value = "";
            setImportingCsv(false);
        }
    };

    // --- Desktop menu helpers ---
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

    // --- Shared menu items (only Open details & Delete) ---
    const MenuItems = ({id, onDone}) => (
        <div className="py-1">
            <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-gray-800"
                onClick={(e) => {
                    e.stopPropagation();
                    goToDetails(id);
                    onDone?.();
                }}
            >
                Open details
            </button>
            <div className="my-1 border-t border-slate-200 dark:border-white/10"/>
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
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">BOMs</h1>
                        <p className="mt-1 md:mt-2 text-slate-500 dark:text-gray-400 text-sm md:text-base">Define and manage bill of
                            materials.</p>
                    </div>
                    <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                        <button
                            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                            onClick={() => navigate("/boms/new")}
                        >
                            + New BOM
                        </button>
                        <button
                            disabled={importingCsv || exportingCsv}
                            onClick={() => importInputRef.current?.click()}
                            className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 border border-slate-200 dark:border-white/10 rounded-lg text-sm disabled:opacity-50">
                            {importingCsv ? "Importing..." : "Import CSV"}
                        </button>
                        <input ref={importInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImportPick}/>
                    </div>
                </div>
            </header>

            {(importingCsv || exportingCsv) && (
                <div className="mx-auto px-4 pb-2">
                    <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-sm text-blue-200 flex items-center gap-2">
                        <span className="inline-block h-3.5 w-3.5 border-2 border-blue-300/40 border-t-blue-300 rounded-full animate-spin"/>
                        <span>{importingCsv ? "Importing BOM CSV..." : "Exporting BOM CSV..."}</span>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="mx-auto px-4 pb-4">
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Draft">Draft</option>
                            <option value="Hold">Hold</option>
                            <option value="Obsolite">Obsolite</option>
                        </select>

                        <div className="relative flex-1">
                            <input
                                placeholder="Search BOM ID, Product, or Item ID…"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 pl-3 pr-10 py-2 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-gray-500">⌕</span>
                        </div>

                        <div className="flex items-center gap-2 md:ml-auto">
                            <button
                                disabled={importingCsv || exportingCsv}
                                onClick={handleExportCSV}
                                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 text-sm hover:bg-slate-200 dark:hover:bg-gray-700 disabled:opacity-50">
                                {exportingCsv ? "Exporting..." : "Export CSV"}
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
                        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-gray-300">
                            <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll}
                                   onClick={stopRowNav}/>
                            <span>Select all on page</span>
                        </label>
                        <span className="text-xs text-slate-500 dark:text-gray-400">
              {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(filtered.length, pageStart + pageSize)} of {filtered.length}
            </span>
                    </div>

                    <div className="space-y-2">
                        {paged.map((bom) => (
                            <div
                                key={bom.id}
                                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-3 active:bg-slate-100/60 dark:active:bg-gray-800/40"
                                onClick={() => goToDetails(bom.id)}
                                title="Open Details"
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={!!selected[bom.id]}
                                        onChange={() => toggleOne(bom.id)}
                                        onClick={stopRowNav}
                                        className="mt-1"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="font-mono text-slate-900 dark:text-white text-sm">
                                                <span className="underline decoration-dotted">{bom.id}</span>
                                            </div>
                                            {/* Mobile actions trigger */}
                                            <button
                                                className="shrink-0 px-2 py-1 rounded-md hover:bg-slate-100/70 dark:hover:bg-gray-800/60 text-slate-700 dark:text-gray-300"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSheetId(bom.id);
                                                }}
                                                aria-label="Actions"
                                                title="Actions"
                                            >
                                                …
                                            </button>
                                        </div>
                                        <div className="mt-1 text-slate-900 dark:text-gray-200 text-sm line-clamp-2">{bom.product}</div>
                                        <div className="mt-1 text-xs text-slate-500 dark:text-gray-400 flex items-center gap-2 flex-wrap">
                                            <span className="truncate">{bom.productId}</span>
                                            <span>•</span>
                                            <span>{bom.revision}</span>
                                            <span>•</span>
                                            <span className="truncate">{bom.components} components</span>
                                            <span>•</span>
                                            <span>{bom.lastUpdated}</span>
                                            <span
                                                className={`ml-auto px-2 py-0.5 text-[10px] rounded-full whitespace-nowrap ${
                                                    bom.status === "Active" ? "bg-green-600/30 text-green-400"
                                                        : bom.status === "Draft" ? "bg-blue-600/30 text-blue-300"
                                                            : bom.status === "Hold" ? "bg-yellow-600/30 text-yellow-400"
                                                                : "bg-gray-600/30 text-slate-500 dark:text-gray-400"}`}>
                        {bom.status}
                      </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {paged.length === 0 && (
                            <div
                                className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-6 text-center text-slate-500 dark:text-gray-400">
                                No BOMs found.
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
                                <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll}
                                       onClick={stopRowNav}/>
                            </th>
                            {th("BOM ID", "id")}
                            {th("Product", "product")}
                            {th("Item ID", "productId")}
                            {th("Revision", "revision")}
                            {th("Status", "status")}
                            {th("# Components", "components", true)}
                            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-gray-300 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                        {paged.map((bom) => (
                            <tr
                                key={bom.id}
                                className="hover:bg-slate-100/60 dark:hover:bg-gray-800/40 transition cursor-pointer"
                                onClick={() => goToDetails(bom.id)}
                                title="Open Details"
                            >
                                <td className="px-4 py-3" onClick={stopRowNav}>
                                    <input type="checkbox" checked={!!selected[bom.id]}
                                           onChange={() => toggleOne(bom.id)}/>
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-900 dark:text-white">
                                    <span className="underline decoration-dotted">{bom.id}</span>
                                </td>
                                <td className="px-4 py-3 text-slate-900 dark:text-gray-200">{bom.product}</td>
                                <td className="px-4 py-3 text-slate-500 dark:text-gray-400">{bom.productId}</td>
                                <td className="px-4 py-3 text-slate-500 dark:text-gray-400">{bom.revision}</td>
                                <td className="px-4 py-3">
                  <span
                      className={`px-2 py-1 text-xs rounded-full ${
                          bom.status === "Active"
                              ? "bg-green-600/30 text-green-400"
                              : bom.status === "Draft"
                                  ? "bg-blue-600/30 text-blue-300"
                                  : bom.status === "Hold"
                                      ? "bg-yellow-600/30 text-yellow-400"
                                      : "bg-gray-600/30 text-slate-500 dark:text-gray-400"
                      }`}
                  >
                    {bom.status}
                  </span>
                                </td>
                                <td className="px-4 py-3 text-right text-slate-900 dark:text-gray-200">{bom.components}</td>
                                <td className="px-4 py-3 text-right" onClick={stopRowNav}>
                                    {/* Desktop actions trigger */}
                                    <button
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-100/70 dark:hover:bg-gray-800/60 text-slate-700 dark:text-gray-300"
                                        aria-label="Actions"
                                        title="Actions"
                                        onClick={(e) => openDesktopMenu(e, bom.id)}
                                    >
                                        …
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paged.length === 0 && (
                            <tr>
                                <td className="px-4 py-6 text-center text-slate-500 dark:text-gray-400" colSpan={8}>
                                    No BOMs found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
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
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                        <span className="hidden sm:inline">•</span>
                        <span>
              Showing <span className="text-slate-700 dark:text-gray-300">{filtered.length === 0 ? 0 : pageStart + 1}</span>–
              <span className="text-slate-700 dark:text-gray-300">{Math.min(filtered.length, pageStart + pageSize)}</span> of
              <span className="text-slate-700 dark:text-gray-300"> {filtered.length}</span>
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
                    <MenuItems id={menu.id} onDone={closeDesktopMenu}/>
                </div>
            )}

            {/* Mobile Action Sheet */}
            {sheetId && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setSheetId(null)}/>
                    <div
                        className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 p-2 pt-3 shadow-2xl">
                        <div className="mx-auto h-1 w-10 rounded-full bg-white/20 mb-1.5"/>
                        <div className="px-2 pb-2">
                            <div className="text-xs text-slate-500 dark:text-gray-400 mb-2 px-1">Actions for <span
                                className="font-mono text-slate-700 dark:text-gray-300">{sheetId}</span></div>
                            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 divide-y divide-white/10">
                                <MenuItems id={sheetId} onDone={() => setSheetId(null)}/>
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

            {/* Deletion Confirmation Modal (Bulk) */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setShowDeleteModal(false)}/>
                    <div
                        className="relative z-10 w-[92%] sm:w-[80%] max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 p-5 shadow-xl">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Confirm deletion</h2>
                        <p className="mt-2 text-sm text-slate-700 dark:text-gray-300">
                            You are about to delete <span className="font-medium text-slate-900 dark:text-white">{selectedCount}</span>{" "}
                            {selectedCount === 1 ? "BOM" : "BOMs"}. This action cannot be undone.
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
                    <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteOneId(null)}/>
                    <div
                        className="relative z-10 w-[92%] sm:w-[80%] max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 p-5 shadow-xl">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Delete BOM</h2>
                        <p className="mt-2 text-sm text-slate-700 dark:text-gray-300">
                            You are about to delete <span className="font-mono text-slate-900 dark:text-white">{deleteOneId}</span>. This
                            action cannot be undone.
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
        </div>
    );
};
