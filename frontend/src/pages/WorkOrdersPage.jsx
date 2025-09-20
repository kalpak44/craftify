import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";

/**
 * WorkOrdersPage
 *
 * ERP-style Work Orders registry built with React + Tailwind (raw JS).
 *
 * Update in this version:
 * - Per-row actions switched to an ellipsis "…" trigger with dropdown (desktop) and bottom sheet (mobile).
 * - Actions include: "Details", "Operations", and "Delete".
 * - Added single-row deletion confirmation modal (bulk delete remains).
 * - Underlined ID styling on rows for consistency across pages.
 *
 * Core features:
 * - Search, filters (status/assignee/priority), sortable columns.
 * - Pagination with selection, bulk delete + confirmation modal.
 * - Clicking a row/card opens Edit view at /work-orders/:id/edit.
 */
export const WorkOrdersPage = () => {
    const initialData = [
        {
            id: "WO-1001",
            product: "Front Assembly",
            itemId: "ITM-006",
            assignee: "Alice Chen",
            status: "Open",
            priority: "High",
            due: "2025-02-25",
            updated: "2025-02-18"
        },
        {
            id: "WO-1002",
            product: "Large Widget",
            itemId: "ITM-002",
            assignee: "Bob Martin",
            status: "In Progress",
            priority: "Rush",
            due: "2025-02-22",
            updated: "2025-02-19"
        },
        {
            id: "WO-1003",
            product: "Plastic Case",
            itemId: "ITM-003",
            assignee: "Carla Diaz",
            status: "Completed",
            priority: "Low",
            due: "2025-02-10",
            updated: "2025-02-11"
        },
        {
            id: "WO-1004",
            product: "Chain Bracket",
            itemId: "ITM-005",
            assignee: "Deepak Rao",
            status: "Open",
            priority: "Medium",
            due: "2025-03-01",
            updated: "2025-02-17"
        },
        {
            id: "WO-1005",
            product: "Lion Bracket",
            itemId: "ITM-004",
            assignee: "Alice Chen",
            status: "Hold",
            priority: "High",
            due: "2025-02-28",
            updated: "2025-02-18"
        },
        {
            id: "WO-1006",
            product: "Screws M3×8",
            itemId: "ITM-009",
            assignee: "Bob Martin",
            status: "Cancelled",
            priority: "Low",
            due: "2025-02-20",
            updated: "2025-02-12"
        },
        {
            id: "WO-1007",
            product: "Steel Frame",
            itemId: "ITM-007",
            assignee: "Carla Diaz",
            status: "In Progress",
            priority: "High",
            due: "2025-02-26",
            updated: "2025-02-19"
        },
        {
            id: "WO-1008",
            product: "Blue Paint Pack",
            itemId: "ITM-008",
            assignee: "Deepak Rao",
            status: "Open",
            priority: "Medium",
            due: "2025-02-24",
            updated: "2025-02-18"
        },
        {
            id: "WO-1009",
            product: "Assembly Kit 10",
            itemId: "ITM-010",
            assignee: "Alice Chen",
            status: "Completed",
            priority: "Low",
            due: "2024-12-05",
            updated: "2024-12-06"
        },
        {
            id: "WO-1010",
            product: "Warm Yellow LED",
            itemId: "ITM-001",
            assignee: "Bob Martin",
            status: "Open",
            priority: "Rush",
            due: "2025-02-21",
            updated: "2025-02-19"
        }
    ];

    const STATUSES = ["Open", "In Progress", "Hold", "Completed", "Cancelled"];
    const PRIORITIES = ["Low", "Medium", "High", "Rush"];

    const navigate = useNavigate();

    // --- State
    const [rows, setRows] = useState(initialData);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const [assignee, setAssignee] = useState("all");
    const [priority, setPriority] = useState("all");
    const [sort, setSort] = useState({key: "id", dir: "asc"});
    const [selected, setSelected] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Single-row delete
    const [deleteOneId, setDeleteOneId] = useState(null);

    // Desktop menu
    const [menu, setMenu] = useState(null); // { id, x, y }
    const menuRef = useRef(null);

    // Mobile action sheet
    const [sheetId, setSheetId] = useState(null);

    // --- Derived
    const assignees = useMemo(() => Array.from(new Set(rows.map((r) => r.assignee))).sort(), [rows]);

    const filtered = useMemo(() => {
        let data = rows;

        if (query) {
            const q = query.toLowerCase();
            data = data.filter(
                (r) => r.id.toLowerCase().includes(q) || r.product.toLowerCase().includes(q) || r.itemId.toLowerCase().includes(q)
            );
        }
        if (status !== "all") data = data.filter((r) => r.status === status);
        if (assignee !== "all") data = data.filter((r) => r.assignee === assignee);
        if (priority !== "all") data = data.filter((r) => r.priority === priority);

        const {key, dir} = sort;
        data = [...data].sort((a, b) => {
            const av = a[key];
            const bv = b[key];
            const cmp = String(av).localeCompare(String(bv), undefined, {numeric: true});
            return dir === "asc" ? cmp : -cmp;
        });

        return data;
    }, [rows, query, status, assignee, priority, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageStart = (page - 1) * pageSize;
    const paged = filtered.slice(pageStart, pageStart + pageSize);

    const toggleOne = (id) => setSelected((s) => ({...s, [id]: !s[id]}));
    const allOnPageSelected = paged.length > 0 && paged.every((r) => selected[r.id]);
    const toggleAll = () => {
        const next = {...selected};
        if (allOnPageSelected) paged.forEach((r) => delete next[r.id]);
        else paged.forEach((r) => (next[r.id] = true));
        setSelected(next);
    };
    const selectedIds = Object.keys(selected).filter((k) => selected[k]);
    const selectedCount = selectedIds.length;

    const th = (label, key, right = false) => (
        <th
            onClick={() =>
                setSort((s) => ({
                    key,
                    dir: s.key === key && s.dir === "asc" ? "desc" : "asc"
                }))
            }
            className={`px-4 py-3 font-semibold text-gray-300 select-none cursor-pointer ${right ? "text-right" : "text-left"}`}
        >
      <span className="inline-flex items-center gap-1">
        {label}
          {sort.key === key && <span className="text-gray-500">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </span>
        </th>
    );

    const pill = (value, map) => (
        <span
            className={`px-2 py-1 text-xs rounded-full ${map[value] || "bg-gray-600/30 text-gray-300"}`}>{value}</span>
    );

    const STATUS_CLS = {
        Open: "bg-blue-600/30 text-blue-300",
        "In Progress": "bg-indigo-600/30 text-indigo-300",
        Completed: "bg-green-600/30 text-green-400",
        Hold: "bg-yellow-600/30 text-yellow-400",
        Cancelled: "bg-gray-600/30 text-gray-400"
    };
    const PRIORITY_CLS = {
        Low: "bg-gray-600/30 text-gray-300",
        Medium: "bg-sky-600/30 text-sky-300",
        High: "bg-orange-600/30 text-orange-300",
        Rush: "bg-red-600/30 text-red-300"
    };

    // --- Row navigation helpers
    const handleRowClick = (woId) => navigate(`/work-orders/${woId}/edit`);
    const stop = (e) => e.stopPropagation();

    // --- Delete (bulk)
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
        const newTotal = Math.max(1, Math.ceil(keep.length / pageSize));
        setPage((p) => Math.min(p, newTotal));
        setShowDeleteModal(false);
    };

    // --- Delete (single)
    const confirmDeleteOne = () => {
        if (!deleteOneId) return;
        const keep = rows.filter((r) => r.id !== deleteOneId);
        setRows(keep);
        setSelected((s) => {
            const next = {...s};
            delete next[deleteOneId];
            return next;
        });
        const newTotal = Math.max(1, Math.ceil(keep.length / pageSize));
        setPage((p) => Math.min(p, newTotal));
        setDeleteOneId(null);
    };

    // --- Desktop menu helpers
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

    // --- Shared per-row actions
    const MenuItems = ({id, onDone}) => (
        <div className="py-1">
            <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800"
                onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/work-orders/${id}/edit`);
                    onDone?.();
                }}
            >
                Open details
            </button>
            <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800"
                onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/work-orders/${id}/operations`);
                    onDone?.();
                }}
            >
                Operations
            </button>
            <div className="my-1 border-t border-white/10"/>
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
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Work Orders</h1>
                        <p className="mt-1 md:mt-2 text-gray-400 text-sm md:text-base">Issue, track, and complete work
                            orders.</p>
                    </div>
                    <div className="flex gap-2 md:gap-3 items-center w-full sm:w-auto">
                        <button
                            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                            onClick={() => navigate("/work-orders/new")}
                        >
                            + New Work Order
                        </button>
                        <button
                            className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">
                            Import CSV
                        </button>
                    </div>
                </div>
            </header>

            {/* Toolbar with filters */}
            <div className="mx-auto px-4 pb-4">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
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
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>

                            <select
                                value={assignee}
                                onChange={(e) => {
                                    setAssignee(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                            >
                                <option value="all">All Assignees</option>
                                {assignees.map((a) => (
                                    <option key={a} value={a}>{a}</option>
                                ))}
                            </select>

                            <select
                                value={priority}
                                onChange={(e) => {
                                    setPriority(e.target.value);
                                    setPage(1);
                                }}
                                className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm col-span-2 sm:col-span-1"
                            >
                                <option value="all">All Priorities</option>
                                {PRIORITIES.map((p) => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

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

                        <div className="flex items-center gap-2 md:ml-auto">
                            <button
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700">
                                Export CSV
                            </button>
                            <button
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700">
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
                            <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} onClick={stop}/>
                            <span>Select all on page</span>
                        </label>
                        <span className="text-xs text-gray-400">
              {filtered.length === 0 ? 0 : pageStart + 1}–{Math.min(filtered.length, pageStart + pageSize)} of {filtered.length}
            </span>
                    </div>

                    <div className="space-y-2">
                        {paged.map((wo) => (
                            <div
                                key={wo.id}
                                className="rounded-xl border border-white/10 bg-gray-900/60 p-3 active:bg-gray-800/40"
                                onClick={() => handleRowClick(wo.id)}
                                title="Open Edit"
                            >
                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={!!selected[wo.id]}
                                        onChange={() => toggleOne(wo.id)}
                                        onClick={stop}
                                        className="mt-1"
                                        aria-label={`Select ${wo.id}`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div
                                                className="font-mono text-white text-sm underline decoration-dotted">{wo.id}</div>
                                            {/* Mobile actions trigger */}
                                            <button
                                                className="shrink-0 px-2 py-1 rounded-md hover:bg-gray-800/60 text-gray-300"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSheetId(wo.id);
                                                }}
                                                aria-label="Actions"
                                                title="Actions"
                                            >
                                                …
                                            </button>
                                        </div>
                                        <div className="mt-1 text-gray-200 text-sm line-clamp-2">{wo.product}</div>
                                        <div className="mt-1 text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                                            <span className="truncate">{wo.itemId}</span>
                                            <span>•</span>
                                            <span className="truncate">{wo.assignee}</span>
                                            <span>•</span>
                                            <span>Due {wo.due}</span>
                                            <span>•</span>
                                            <span>Upd. {wo.updated}</span>
                                            <span className="ml-auto inline-flex items-center gap-1">
                        {pill(wo.status, STATUS_CLS)}
                                                {pill(wo.priority, PRIORITY_CLS)}
                      </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {paged.length === 0 && (
                            <div
                                className="rounded-xl border border-white/10 bg-gray-900/60 p-6 text-center text-gray-500">
                                No work orders found.
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
                                <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} onClick={stop}/>
                            </th>
                            {th("WO ID", "id")}
                            {th("Product", "product")}
                            {th("Item ID", "itemId")}
                            {th("Assignee", "assignee")}
                            {th("Status", "status")}
                            {th("Priority", "priority")}
                            {th("Due Date", "due")}
                            {th("Last Updated", "updated")}
                            <th className="px-4 py-3 text-right font-semibold text-gray-300">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                        {paged.map((wo) => (
                            <tr
                                key={wo.id}
                                className="hover:bg-gray-800/40 transition cursor-pointer"
                                onClick={() => handleRowClick(wo.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") handleRowClick(wo.id);
                                }}
                                aria-label={`Open edit page for ${wo.id}`}
                            >
                                <td className="px-4 py-3" onClick={stop}>
                                    <input
                                        type="checkbox"
                                        checked={!!selected[wo.id]}
                                        onChange={() => toggleOne(wo.id)}
                                        aria-label={`Select ${wo.id}`}
                                    />
                                </td>
                                <td className="px-4 py-3 font-mono text-white">
                                    <span className="underline decoration-dotted">{wo.id}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-200">{wo.product}</td>
                                <td className="px-4 py-3 text-gray-400">{wo.itemId}</td>
                                <td className="px-4 py-3 text-gray-200">{wo.assignee}</td>
                                <td className="px-4 py-3">{pill(wo.status, STATUS_CLS)}</td>
                                <td className="px-4 py-3">{pill(wo.priority, PRIORITY_CLS)}</td>
                                <td className="px-4 py-3 text-gray-400">{wo.due}</td>
                                <td className="px-4 py-3 text-gray-400">{wo.updated}</td>
                                <td className="px-4 py-3 text-right" onClick={stop}>
                                    {/* Desktop actions trigger */}
                                    <button
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-gray-800/60 text-gray-300"
                                        aria-label="Actions"
                                        title="Actions"
                                        onClick={(e) => openDesktopMenu(e, wo.id)}
                                    >
                                        …
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paged.length === 0 && (
                            <tr>
                                <td className="px-4 py-6 text-center text-gray-500" colSpan={10}>
                                    No work orders found.
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

            {/* Desktop Dropdown Menu */}
            {menu && (
                <div
                    ref={menuRef}
                    className="fixed z-50 min-w-[200px] rounded-xl border border-white/10 bg-gray-900 shadow-2xl"
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
                        className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-white/10 bg-gray-900 p-2 pt-3 shadow-2xl">
                        <div className="mx-auto h-1 w-10 rounded-full bg-white/20 mb-1.5"/>
                        <div className="px-2 pb-2">
                            <div className="text-xs text-gray-400 mb-2 px-1">Actions for <span
                                className="font-mono text-gray-300">{sheetId}</span></div>
                            <div className="rounded-xl overflow-hidden border border-white/10 divide-y divide-white/10">
                                <MenuItems id={sheetId} onDone={() => setSheetId(null)}/>
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
                    <div
                        className="relative z-10 w-[92%] sm:w-[80%] max-w-md rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-xl">
                        <h2 className="text-lg font-semibold text-white">Confirm deletion</h2>
                        <p className="mt-2 text-sm text-gray-300">
                            You are about to delete <span className="font-medium text-white">{selectedCount}</span>{" "}
                            {selectedCount === 1 ? "work order" : "work orders"}. This action cannot be undone.
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
                    <div className="absolute inset-0 bg-black/60" onClick={() => setDeleteOneId(null)}/>
                    <div
                        className="relative z-10 w-[92%] sm:w-[80%] max-w-md rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-xl">
                        <h2 className="text-lg font-semibold text-white">Delete Work Order</h2>
                        <p className="mt-2 text-sm text-gray-300">
                            You are about to delete <span className="font-mono text-white">{deleteOneId}</span>. This
                            action cannot be undone.
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

export default WorkOrdersPage;
