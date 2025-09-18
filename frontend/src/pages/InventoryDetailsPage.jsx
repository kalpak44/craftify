import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";

/**
 * InventoryDetailsPage — React + Tailwind (raw JS)
 *
 * Purpose:
 * - Inventory editor with mandatory Item selection and Category Picker (same UX as ItemDetails).
 * - Reorder Pt field in General.
 * - Lots section (like BOM components) with expiration (required), lot size, allocated, computed available.
 * - NEW: Per-lot Custom Fields button opens an in-place modal (replaces InventoryLotCustomDetailsPage).
 *   - Add/edit/delete/reorder custom fields (text, date, date-range) per lot.
 *   - Fields are stored locally per lot row and summarized with a count badge on the lot line.
 *
 * Notes:
 * - Mock-only; no API calls. Save is enabled when required fields are valid.
 * - Self-contained: includes Modal, CategoryPickerModal, ItemPickerModal, and LotCustomModal.
 */

/* -------------------- Utilities -------------------- */
function classNames(...a) {
    return a.filter(Boolean).join(" ");
}

const uid = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

/* -------------------- Modal Shell -------------------- */
function Modal({open, onClose, title, children, footer}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
            <div className="absolute inset-0 flex items-center justify-center p-0 md:p-4">
                <div
                    className="w-full h-full md:h-auto md:max-h-[85vh] md:max-w-4xl overflow-hidden rounded-none md:rounded-2xl border border-white/10 bg-gray-900 text-gray-200 shadow-2xl">
                    <div className="px-4 md:px-5 py-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-base md:text-lg font-semibold">{title}</h3>
                        <button onClick={onClose}
                                className="text-gray-400 hover:text-gray-200 text-xl leading-none">&times;</button>
                    </div>
                    <div className="p-4 md:p-5 h-[calc(100%-112px)] md:h-auto overflow-y-auto">{children}</div>
                    <div
                        className="px-4 md:px-5 py-4 border-t border-white/10 bg-gray-900/60 flex items-center justify-end gap-2">
                        {footer}
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------- Category Picker (same as ItemDetails) -------------------- */
function CategoryPickerModal({
                                 open,
                                 onClose,
                                 categories,
                                 onPick,
                                 onCreate,
                                 onRename,
                                 onDelete,
                             }) {
    const safeRename = onRename || (() => {
    });
    const safeDelete = onDelete || (() => {
    });
    const [q, setQ] = useState("");
    const [qDebounced, setQDebounced] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [mode, setMode] = useState("search");
    const [newCat, setNewCat] = useState("");
    const [createError, setCreateError] = useState("");
    const [editingKey, setEditingKey] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [renameError, setRenameError] = useState("");

    useEffect(() => {
        const t = setTimeout(() => setQDebounced(q.trim()), 150);
        return () => clearTimeout(t);
    }, [q]);

    const lowerSet = useMemo(() => new Set(categories.map((c) => c.toLowerCase())), [categories]);
    const existsInsensitive = useMemo(() => (name) => lowerSet.has(name.trim().toLowerCase()), [lowerSet]);

    const filtered = useMemo(() => {
        const term = qDebounced.toLowerCase();
        const base = term ? categories.filter((c) => c.toLowerCase().includes(term)) : categories.slice();
        return base.sort((a, b) => {
            const la = a.toLowerCase();
            const lb = b.toLowerCase();
            const score = (s) => (term ? (s === term ? 0 : s.startsWith(term) ? 1 : 2) : 2);
            const sa = score(la);
            const sb = score(lb);
            return sa === sb ? a.localeCompare(b) : sa - sb;
        });
    }, [qDebounced, categories]);

    const canCreateFromQuery = qDebounced.length > 0 && !existsInsensitive(qDebounced);
    const start = (page - 1) * pageSize;
    const pageRows = filtered.slice(start, start + pageSize);
    useEffect(() => setPage(1), [qDebounced, pageSize, open]);

    useEffect(() => {
        setEditingKey(null);
        setEditValue("");
        setRenameError("");
        if (mode === "create") {
            setQ("");
            setQDebounced("");
        }
    }, [mode, open]);

    const handleCreate = (valueRaw) => {
        const val = (valueRaw ?? newCat).trim();
        if (!val) return setCreateError("Category name is required.");
        if (existsInsensitive(val)) return setCreateError("Category already exists.");
        setCreateError("");
        onCreate(val);
        setNewCat("");
    };
    const beginRename = (original) => {
        setEditingKey(original);
        setEditValue(original);
        setRenameError("");
    };
    const cancelRename = () => {
        setEditingKey(null);
        setEditValue("");
        setRenameError("");
    };
    const submitRename = () => {
        const from = editingKey;
        const to = editValue.trim();
        if (!from) return;
        if (!to) return setRenameError("Name is required.");
        const isSame = to.toLowerCase() === from.toLowerCase();
        if (!isSame && existsInsensitive(to)) return setRenameError("Another category with this name already exists.");
        setRenameError("");
        safeRename(from, to);
        cancelRename();
    };
    const handleDelete = (name) => {
        if (window.confirm(`Delete category “${name}”? This cannot be undone.`)) safeDelete(name);
    };
    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            if (e.ctrlKey || e.metaKey) {
                if (canCreateFromQuery) handleCreate(qDebounced);
                return;
            }
            if (pageRows.length > 0) onPick(pageRows[0]); else if (canCreateFromQuery) handleCreate(qDebounced);
        }
        if (e.key === "Escape") onClose();
    };
    const pages = Math.max(1, Math.ceil(filtered.length / pageSize));

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Pick or Create Category"
            footer={
                <div className="w-full flex items-center justify-between gap-2">
                    <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400">
                        {mode === "search" ? (
                            <>
                                <span><span className="text-gray-300">Enter</span> pick first</span>
                                <span>•</span>
                                <span><span className="text-gray-300">Ctrl/⌘+Enter</span> create</span>
                                <span>•</span>
                                <span><span className="text-gray-300">Esc</span> close</span>
                            </>
                        ) : mode === "manage" ? (
                            <>
                                <span>Rename or delete categories below.</span>
                                <span>•</span>
                                <span><span className="text-gray-300">Esc</span> close</span>
                            </>
                        ) : (
                            <>
                                <span><span className="text-gray-300">Enter</span> add</span>
                                <span>•</span>
                                <span><span className="text-gray-300">Esc</span> close</span>
                            </>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {mode === "create" && (
                            <button
                                onClick={() => handleCreate()}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm disabled:opacity-60"
                                disabled={!newCat.trim() || filtered.some(c => c.toLowerCase() === newCat.trim().toLowerCase())}
                            >
                                + Add
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm w-full md:w-auto"
                        >
                            Close
                        </button>
                    </div>
                </div>
            }
        >
            <div className="mb-4 space-y-3">
                <div className="inline-flex rounded-xl border border-white/10 bg-gray-900/60 p-1">
                    {[
                        {key: "search", label: "Search & Browse"},
                        {key: "create", label: "Create New"},
                        {key: "manage", label: "Manage"},
                    ].map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setMode(t.key)}
                            className={classNames(
                                "px-3 py-1.5 text-xs rounded-lg transition",
                                mode === t.key ? "bg-gray-800 text-white" : "text-gray-400 hover:text-gray-200"
                            )}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {mode === "search" && (
                    <div className="rounded-xl border border-white/10 bg-gray-900/60 p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            <div className="relative flex-1">
                                <input
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                    placeholder="Search categories (type to filter)"
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 pl-9 pr-8 py-2 text-sm"
                                />
                                <span className="absolute left-3 top-2.5 text-gray-500">🔎</span>
                                {q && (
                                    <button
                                        onClick={() => setQ("")}
                                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-200"
                                        title="Clear"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>

                        {canCreateFromQuery && (
                            <div
                                className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                                <div className="text-xs">
                                    <span className="text-gray-300">No exact match.</span>{" "}
                                    <span className="text-gray-400">You can create</span>{" "}
                                    <span className="font-medium text-emerald-300">“{qDebounced}”</span>.
                                </div>
                                <button
                                    onClick={() => handleCreate(qDebounced)}
                                    className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                >
                                    + Create “{qDebounced}”
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {mode === "create" && (
                    <div className="rounded-xl border border-white/10 bg-gray-900/60 p-3">
                        <div className="text-xs text-gray-400 mb-1">Create new</div>
                        <div className="flex gap-2">
                            <input
                                value={newCat}
                                onChange={(e) => {
                                    setNewCat(e.target.value);
                                    setCreateError("");
                                }}
                                placeholder="e.g. Spare Part"
                                className={classNames(
                                    "w-full rounded-lg bg-gray-800 border px-3 py-2 text-sm",
                                    createError ? "border-red-500/60" : "border-white/10"
                                )}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleCreate();
                                    if (e.key === "Escape") onClose();
                                }}
                            />
                        </div>
                        {createError && <div className="text-xs text-red-400 mt-1">{createError}</div>}
                        {newCat.trim() && filtered.some(c => c.toLowerCase() === newCat.trim().toLowerCase()) && !createError && (
                            <div className="text-xs text-yellow-400 mt-1">A category with this name already
                                exists.</div>
                        )}
                    </div>
                )}

                {mode === "manage" && (
                    <div className="rounded-xl border border-white/10 bg-gray-900/60 p-3">
                        <div className="relative">
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Find category to manage (rename / delete)"
                                className="w-full rounded-lg bg-gray-800 border border-white/10 pl-9 pr-3 py-2 text-sm"
                            />
                            <span className="absolute left-3 top-2.5 text-gray-500">🔎</span>
                        </div>
                        {renameError && <div className="mt-2 text-xs text-red-400">{renameError}</div>}
                    </div>
                )}
            </div>

            {(mode === "search" || mode === "manage") && (
                <>
                    {/* Mobile cards */}
                    <div className="space-y-2 md:hidden">
                        {pageRows.map((cat) => {
                            const isEditing = mode === "manage" && editingKey === cat;
                            return (
                                <div key={cat} className="rounded-xl border border-white/10 bg-gray-900/60 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            {isEditing ? (
                                                <input
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className={classNames(
                                                        "w-full rounded-lg bg-gray-800 border px-3 py-2 text-sm",
                                                        renameError ? "border-red-500/60" : "border-white/10"
                                                    )}
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") submitRename();
                                                        if (e.key === "Escape") cancelRename();
                                                    }}
                                                />
                                            ) : (
                                                <div className="text-sm text-gray-200">{cat}</div>
                                            )}
                                        </div>
                                        <div className="shrink-0 flex gap-2">
                                            {mode === "manage" ? (
                                                isEditing ? (
                                                    <>
                                                        <button onClick={submitRename}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-emerald-600/80 text-white border-emerald-400/30 hover:bg-emerald-600">Save
                                                        </button>
                                                        <button onClick={cancelRename}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => beginRename(cat)}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">Rename
                                                        </button>
                                                        <button onClick={() => handleDelete(cat)}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20">Delete
                                                        </button>
                                                        <button onClick={() => onPick(cat)}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">Use
                                                        </button>
                                                    </>
                                                )
                                            ) : (
                                                <button onClick={() => onPick(cat)}
                                                        className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">Use</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {pageRows.length === 0 && (
                            <div
                                className="text-center text-gray-400 py-6 text-sm">{mode === "create" ? "Enter a name to add" : "No matches"}</div>
                        )}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                        <table className="min-w-full divide-y divide-gray-800 text-sm">
                            <thead className="bg-gray-900/80">
                            <tr>
                                <th className="px-4 py-3 text-left">Category</th>
                                <th className="px-4 py-3 text-right">{mode === "manage" ? "Manage" : "Action"}</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                            {pageRows.map((cat) => {
                                const isEditing = mode === "manage" && editingKey === cat;
                                return (
                                    <tr key={cat} className="hover:bg-gray-800/40">
                                        <td className="px-4 py-3">
                                            {isEditing ? (
                                                <input
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className={classNames(
                                                        "w-full rounded-lg bg-gray-800 border px-3 py-2 text-sm",
                                                        renameError ? "border-red-500/60" : "border-white/10"
                                                    )}
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") submitRename();
                                                        if (e.key === "Escape") cancelRename();
                                                    }}
                                                />
                                            ) : (
                                                <span>{cat}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {mode === "manage" ? (
                                                isEditing ? (
                                                    <div className="inline-flex items-center gap-2">
                                                        <button onClick={submitRename}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-emerald-600/80 text-white border-emerald-400/30 hover:bg-emerald-600">Save
                                                        </button>
                                                        <button onClick={cancelRename}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-2">
                                                        <button onClick={() => beginRename(cat)}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">Rename
                                                        </button>
                                                        <button onClick={() => handleDelete(cat)}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20">Delete
                                                        </button>
                                                        <button onClick={() => onPick(cat)}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">Use
                                                        </button>
                                                    </div>
                                                )
                                            ) : (
                                                <button onClick={() => onPick(cat)}
                                                        className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">Use
                                                    Category</button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            {pageRows.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="px-4 py-6 text-center text-gray-400">
                                        {mode === "create" ? "Enter a name to add" : "No matches"}
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom pager */}
                    <div className="flex items-center justify-between mt-3 text-xs text-gray-300">
                        <div className="flex items-center gap-2">
                            <span>Rows per page</span>
                            <select
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="bg-gray-800 border border-white/10 rounded px-2 py-1"
                            >
                                {[8, 16, 24].map((n) => <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(1)}
                                    className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50">⏮
                            </button>
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                                    className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50">‹
                            </button>
                            <span>Page {page} / {Math.max(1, Math.ceil(filtered.length / pageSize))}</span>
                            <button disabled={start + pageSize >= filtered.length} onClick={() => setPage(page + 1)}
                                    className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50">›
                            </button>
                            <button disabled={start + pageSize >= filtered.length}
                                    onClick={() => setPage(Math.max(1, Math.ceil(filtered.length / pageSize)))}
                                    className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50">⏭
                            </button>
                        </div>
                    </div>
                </>
            )}
        </Modal>
    );
}

/* -------------------- Mock Items -------------------- */
const MOCK_ITEMS = [
    {itemId: "ITM-010", name: "Assembly Kit 10", category: "Assemblies", uom: "kit"},
    {itemId: "ITM-008", name: "Blue Paint (RAL5010)", category: "Paints", uom: "L"},
    {itemId: "ITM-005", name: "Chain Bracket", category: "Hardware", uom: "pcs"},
    {itemId: "ITM-006", name: "Front Assembly", category: "Assemblies", uom: "ea"},
    {itemId: "ITM-002", name: "Large Widget", category: "Components", uom: "pcs"},
    {itemId: "ITM-004", name: "Lion Bracket", category: "Hardware", uom: "pcs"},
    {itemId: "ITM-003", name: "Plastic Case", category: "Components", uom: "pcs"},
    {itemId: "ITM-009", name: "Screws M3×8", category: "Fasteners", uom: "ea"},
];

/* -------------------- Item Picker -------------------- */
function ItemPickerModal({open, onClose, items, onPick}) {
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    useEffect(() => {
        if (open) {
            setQ("");
            setPage(1);
        }
    }, [open]);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        let rows = items.slice();
        if (term) {
            rows = rows.filter(
                (r) =>
                    r.itemId.toLowerCase().includes(term) ||
                    r.name.toLowerCase().includes(term) ||
                    r.category.toLowerCase().includes(term) ||
                    r.uom.toLowerCase().includes(term)
            );
        }
        return rows.sort((a, b) => a.itemId.localeCompare(b.itemId, undefined, {numeric: true}));
    }, [items, q]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Pick Item"
            footer={
                <button onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm">
                    Close
                </button>
            }
        >
            <div className="space-y-3">
                <div className="relative">
                    <input
                        value={q}
                        onChange={(e) => {
                            setQ(e.target.value);
                            setPage(1);
                        }}
                        placeholder="Search Item ID, name, category, UoM…"
                        className="w-full rounded-lg bg-gray-800 border border-white/10 pl-9 pr-3 py-2 text-sm"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-500">🔎</span>
                </div>

                {/* Mobile list */}
                <div className="md:hidden space-y-2">
                    {paged.map((it) => (
                        <div
                            key={it.itemId}
                            className="rounded-xl border border-white/10 bg-gray-900/60 p-3 active:bg-gray-800/40"
                            onClick={() => onPick(it)}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="font-mono text-white text-sm"><span
                                        className="underline decoration-dotted">{it.itemId}</span></div>
                                    <div className="text-sm text-gray-200 mt-0.5">{it.name}</div>
                                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                        <span>{it.category}</span><span>•</span><span>{it.uom}</span>
                                    </div>
                                </div>
                                <button
                                    className="px-3 py-1.5 rounded-md bg-gray-800 border border-white/10 text-xs">Use
                                </button>
                            </div>
                        </div>
                    ))}
                    {paged.length === 0 && <div className="text-center text-gray-400 py-6 text-sm">No matches</div>}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                    <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-gray-900/80">
                        <tr>
                            <th className="px-4 py-3 text-left">Item ID</th>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Category</th>
                            <th className="px-4 py-3 text-left">UoM</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                        {paged.map((it) => (
                            <tr key={it.itemId} className="hover:bg-gray-800/40">
                                <td className="px-4 py-3 font-mono text-white"><span
                                    className="underline decoration-dotted">{it.itemId}</span></td>
                                <td className="px-4 py-3 text-gray-200">{it.name}</td>
                                <td className="px-4 py-3 text-gray-400">{it.category}</td>
                                <td className="px-4 py-3 text-gray-400">{it.uom}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => onPick(it)}
                                            className="px-3 py-1.5 rounded-md bg-gray-800 border border-white/10 hover:bg-gray-700 text-xs">
                                        Use Item
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paged.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">No matches</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pager */}
                <div className="flex items-center justify-between mt-3 text-xs text-gray-300">
                    <div className="flex items-center gap-2">
                        <span>Rows per page</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }}
                            className="bg-gray-800 border border-white/10 rounded px-2 py-1"
                        >
                            {[8, 16, 24].map((n) => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button disabled={page <= 1} onClick={() => setPage(1)}
                                className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50">⏮
                        </button>
                        <button disabled={page <= 1} onClick={() => setPage(page - 1)}
                                className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50">‹
                        </button>
                        <span>Page {page} / {totalPages}</span>
                        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}
                                className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50">›
                        </button>
                        <button disabled={page >= totalPages} onClick={() => setPage(totalPages)}
                                className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50">⏭
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

/* -------------------- Lot Custom Fields Modal (in-place replacement) -------------------- */
function LotCustomModal({open, onClose, lotLabel, initialRows, onSave}) {
    const [rows, setRows] = useState(() => initialRows || []);
    const [dirty, setDirty] = useState(false);
    const [query, setQuery] = useState("");

    useEffect(() => {
        if (open) {
            setRows(initialRows || []);
            setDirty(false);
            setQuery("");
        }
    }, [open, initialRows]);

    const addRow = () => {
        const newRow = {
            id: `cf_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: "",
            type: "text", // "text" | "date" | "date-range"
            value: "",
            note: "",
        };
        setRows((r) => [newRow, ...r]);
        setDirty(true);
    };
    const deleteRow = (id) => {
        setRows((r) => r.filter((x) => x.id !== id));
        setDirty(true);
    };
    const setField = (id, patch) => {
        setRows((r) => r.map((x) => (x.id === id ? {...x, ...patch} : x)));
        setDirty(true);
    };

    // reorder helpers
    const moveItem = (list, fromIndex, toIndex) => {
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return list;
        const next = list.slice();
        const [m] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, m);
        return next;
    };
    const moveTop = (id) => {
        setRows((prev) => {
            const from = prev.findIndex((r) => r.id === id);
            return moveItem(prev, from, 0);
        });
        setDirty(true);
    };
    const moveBottom = (id) => {
        setRows((prev) => {
            const from = prev.findIndex((r) => r.id === id);
            return moveItem(prev, from, prev.length - 1);
        });
        setDirty(true);
    };
    const moveUp = (id) => {
        setRows((prev) => {
            const from = prev.findIndex((r) => r.id === id);
            return moveItem(prev, from, Math.max(0, from - 1));
        });
        setDirty(true);
    };
    const moveDown = (id) => {
        setRows((prev) => {
            const from = prev.findIndex((r) => r.id === id);
            return moveItem(prev, from, Math.min(prev.length - 1, from + 1));
        });
        setDirty(true);
    };

    const filtered = useMemo(() => {
        if (!query) return rows;
        const q = query.toLowerCase();
        return rows.filter((r) => (r.name || "").toLowerCase().includes(q) || (r.note || "").toLowerCase().includes(q));
    }, [rows, query]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={`Custom Details — ${lotLabel}`}
            footer={
                <>
                    <button
                        onClick={addRow}
                        className="w-full md:w-32 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                        + Add field
                    </button>
                    <button
                        onClick={() => {
                            onSave(rows);
                            setDirty(false);
                            onClose();
                        }}
                        className={classNames(
                            "w-full md:w-28 px-4 py-2 rounded-lg text-sm",
                            dirty ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-gray-700 text-gray-300"
                        )}
                        title="Save custom details"
                    >
                        {dirty ? "Save" : "Saved"}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full md:w-28 px-4 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm"
                    >
                        Close
                    </button>
                </>
            }
        >
            {/* Toolbar */}
            <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-3 md:p-4 mb-3">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <input
                            placeholder="Search Name or Note…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full rounded-lg bg-gray-800 border border-white/10 pl-3 pr-10 py-2.5 text-sm md:text-base"
                            inputMode="text"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">⌕</span>
                    </div>
                </div>
            </div>

            {/* Mobile list */}
            <div className="space-y-3 md:hidden">
                {filtered.map((r, idx) => {
                    const isDateRange = r.type === "date-range";
                    const isDate = r.type === "date";
                    const isText = r.type === "text";
                    const ensureRange = (val) => (typeof val === "object" && val ? val : {from: "", to: ""});
                    const val = isDateRange ? ensureRange(r.value) : r.value ?? "";
                    return (
                        <div key={r.id} className="rounded-xl border border-white/10 bg-gray-900/70 p-3">
                            <div className="flex items-center justify-between gap-2">
                                <input
                                    value={r.name}
                                    onChange={(e) => setField(r.id, {name: e.target.value})}
                                    className="flex-1 rounded-lg bg-gray-800 border border-white/10 px-3 py-2.5 text-base"
                                    placeholder="Field name (e.g., Certificate No.)"
                                />
                                <button onClick={() => deleteRow(r.id)}
                                        className="shrink-0 px-3 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm">
                                    Delete
                                </button>
                            </div>

                            <div className="mt-2 grid grid-cols-2 gap-2">
                                <select
                                    value={r.type}
                                    onChange={(e) => {
                                        const nextType = e.target.value;
                                        const nextValue = nextType === "date-range" ? {from: "", to: ""} : "";
                                        setField(r.id, {type: nextType, value: nextValue});
                                    }}
                                    className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2.5 text-base col-span-2"
                                >
                                    <option value="text">Text</option>
                                    <option value="date">Date</option>
                                    <option value="date-range">Date range</option>
                                </select>

                                {isText && (
                                    <input
                                        value={val}
                                        onChange={(e) => setField(r.id, {value: e.target.value})}
                                        className="col-span-2 rounded-lg bg-gray-800 border border-white/10 px-3 py-2.5 text-base"
                                        placeholder="Enter value…"
                                    />
                                )}
                                {isDate && (
                                    <input
                                        type="date"
                                        value={val || ""}
                                        onChange={(e) => setField(r.id, {value: e.target.value})}
                                        className="col-span-2 rounded-lg bg-gray-800 border border-white/10 px-3 py-2.5 text-base"
                                    />
                                )}
                                {isDateRange && (
                                    <>
                                        <input
                                            type="date"
                                            value={val.from || ""}
                                            onChange={(e) => setField(r.id, {value: {...val, from: e.target.value}})}
                                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2.5 text-base"
                                        />
                                        <input
                                            type="date"
                                            value={val.to || ""}
                                            onChange={(e) => setField(r.id, {value: {...val, to: e.target.value}})}
                                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2.5 text-base"
                                        />
                                    </>
                                )}

                                <input
                                    value={r.note}
                                    onChange={(e) => setField(r.id, {note: e.target.value})}
                                    className="col-span-2 rounded-lg bg-gray-800 border border-white/10 px-3 py-2.5 text-base"
                                    placeholder="Optional note…"
                                />
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-2">
                                <div className="text-xs text-gray-400">Position: {idx + 1}</div>
                                <div className="flex gap-2">
                                    <button onClick={() => moveUp(r.id)}
                                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm">↑
                                    </button>
                                    <button onClick={() => moveDown(r.id)}
                                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm">↓
                                    </button>
                                    <button onClick={() => moveTop(r.id)}
                                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm">Top
                                    </button>
                                    <button onClick={() => moveBottom(r.id)}
                                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm">Bottom
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="rounded-xl border border-white/10 bg-gray-900/60 p-6 text-center text-gray-400">
                        No custom fields yet. Use <span className="text-gray-200">+ Add field</span>.
                    </div>
                )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto border border-white/10 rounded-xl bg-gray-900/60">
                <table className="min-w-full divide-y divide-gray-800 text-sm">
                    <thead className="bg-gray-900/80">
                    <tr>
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Type</th>
                        <th className="px-4 py-3 text-left">Value</th>
                        <th className="px-4 py-3 text-left">Note</th>
                        <th className="px-4 py-3 text-right">Reorder</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                    {filtered.map((r, idx) => {
                        const isDateRange = r.type === "date-range";
                        const isDate = r.type === "date";
                        const isText = r.type === "text";
                        const ensureRange = (val) => (typeof val === "object" && val ? val : {from: "", to: ""});
                        const val = isDateRange ? ensureRange(r.value) : r.value ?? "";
                        return (
                            <tr key={r.id} className="hover:bg-gray-800/40 transition">
                                <td className="px-4 py-3">
                                    <input
                                        value={r.name}
                                        onChange={(e) => setField(r.id, {name: e.target.value})}
                                        className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                        placeholder="e.g. Certificate No."
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <select
                                        value={r.type}
                                        onChange={(e) => {
                                            const nextType = e.target.value;
                                            const nextValue = nextType === "date-range" ? {from: "", to: ""} : "";
                                            setField(r.id, {type: nextType, value: nextValue});
                                        }}
                                        className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    >
                                        <option value="text">Text</option>
                                        <option value="date">Date</option>
                                        <option value="date-range">Date range</option>
                                    </select>
                                </td>
                                <td className="px-4 py-3">
                                    {isText && (
                                        <input
                                            value={val}
                                            onChange={(e) => setField(r.id, {value: e.target.value})}
                                            className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                            placeholder="Enter value…"
                                        />
                                    )}
                                    {isDate && (
                                        <input
                                            type="date"
                                            value={val || ""}
                                            onChange={(e) => setField(r.id, {value: e.target.value})}
                                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                        />
                                    )}
                                    {isDateRange && (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="date"
                                                value={val.from || ""}
                                                onChange={(e) => setField(r.id, {
                                                    value: {
                                                        ...val,
                                                        from: e.target.value
                                                    }
                                                })}
                                                className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                            />
                                            <span className="text-gray-500">→</span>
                                            <input
                                                type="date"
                                                value={val.to || ""}
                                                onChange={(e) => setField(r.id, {value: {...val, to: e.target.value}})}
                                                className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                            />
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        value={r.note}
                                        onChange={(e) => setField(r.id, {note: e.target.value})}
                                        className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                        placeholder="Optional note…"
                                    />
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="inline-flex gap-2">
                                        <button onClick={() => moveTop(r.id)}
                                                className="px-2 py-1 rounded bg-gray-800 border border-white/10 hover:bg-gray-700 text-xs">Top
                                        </button>
                                        <button onClick={() => moveUp(r.id)}
                                                className="px-2 py-1 rounded bg-gray-800 border border-white/10 hover:bg-gray-700 text-xs">↑
                                        </button>
                                        <button onClick={() => moveDown(r.id)}
                                                className="px-2 py-1 rounded bg-gray-800 border border-white/10 hover:bg-gray-700 text-xs">↓
                                        </button>
                                        <button onClick={() => moveBottom(r.id)}
                                                className="px-2 py-1 rounded bg-gray-800 border border-white/10 hover:bg-gray-700 text-xs">Bottom
                                        </button>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => deleteRow(r.id)}
                                            className="px-2.5 py-1.5 rounded bg-red-600/80 hover:bg-red-600 text-white text-xs">
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {filtered.length === 0 && (
                        <tr>
                            <td className="px-4 py-6 text-center text-gray-400" colSpan={6}>No custom fields. Use “+ Add
                                field”.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </Modal>
    );
}

/* -------------------- Lots helpers -------------------- */
const emptyLotRow = () => ({
    key: uid(),
    lotCode: "",
    expiration: "",
    size: "",
    allocated: "",
    notes: "",
});

/* -------------------- Inventory Details Page -------------------- */
export default function InventoryDetailsPage() {
    const navigate = useNavigate();
    const {id: routeId} = useParams();

    // Form state
    const isEdit = !!routeId;
    const [inventoryId] = useState(isEdit ? routeId : "INV-NEW");
    const [selectedItem, setSelectedItem] = useState(null); // mandatory
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");
    const [baseUom, setBaseUom] = useState("");
    const [reorderPt, setReorderPt] = useState("");
    const [description, setDescription] = useState("");

    const [categories, setCategories] = useState([
        "Assemblies",
        "Components",
        "Hardware",
        "Paints",
        "Fasteners",
        "Consumables",
    ]);

    // Modals
    const [openItemPicker, setOpenItemPicker] = useState(false);
    const [openConfirmOverwrite, setOpenConfirmOverwrite] = useState(false);
    const [pendingItem, setPendingItem] = useState(null);
    const [openCategoryPicker, setOpenCategoryPicker] = useState(false);

    // Lots & per-lot custom-fields
    const [lots, setLots] = useState([emptyLotRow()]);
    const [lotCustom, setLotCustom] = useState({}); // key -> array of custom field rows
    const [openLotCustom, setOpenLotCustom] = useState(false);
    const [activeLotKey, setActiveLotKey] = useState(null);

    const tableRef = useRef(null);

    // Dirty tracking
    const [dirty, setDirty] = useState(false);
    useEffect(() => {
        setDirty(true);
    }, [selectedItem, name, category, baseUom, reorderPt, description, lots, lotCustom]);

    useEffect(() => {
        const beforeUnload = (e) => {
            if (dirty) {
                e.preventDefault();
                e.returnValue = "";
                return "";
            }
        };
        window.addEventListener("beforeunload", beforeUnload);
        return () => window.removeEventListener("beforeunload", beforeUnload);
    }, [dirty]);

    // Derived totals
    const totals = useMemo(() => {
        const parsed = lots
            .map((r) => ({size: Number(r.size || 0), allocated: Number(r.allocated || 0)}))
            .filter((r) => !Number.isNaN(r.size) && !Number.isNaN(r.allocated));
        const onHand = parsed.reduce((s, r) => s + r.size, 0);
        const allocated = parsed.reduce((s, r) => s + r.allocated, 0);
        const available = onHand - allocated;
        return {onHand, allocated, available};
    }, [lots]);

    // Validation
    const errors = useMemo(() => {
        const list = [];
        if (!inventoryId) list.push("Inventory ID is required.");
        if (!selectedItem) list.push("Item selection is required.");
        if (!name.trim()) list.push("Name is required.");
        if (!baseUom.trim()) list.push("Base UoM is required.");
        if (!category.trim()) list.push("Category is required.");
        if (reorderPt !== "" && !(Number(reorderPt) >= 0)) list.push("Reorder Pt must be ≥ 0.");
        lots.forEach((r, idx) => {
            const i = idx + 1;
            if (r.lotCode || r.expiration || r.size || r.allocated || r.notes) {
                if (!r.expiration) list.push(`Lot ${i}: Expiration date is required.`);
                if (r.size === "" || !(Number(r.size) >= 0)) list.push(`Lot ${i}: Lot size must be ≥ 0.`);
                if (r.allocated === "" || !(Number(r.allocated) >= 0)) list.push(`Lot ${i}: Allocated must be ≥ 0.`);
                if (Number(r.allocated || 0) > Number(r.size || 0)) list.push(`Lot ${i}: Allocated cannot exceed lot size.`);
            }
        });
        return list;
    }, [inventoryId, selectedItem, name, baseUom, category, reorderPt, lots]);

    const canSave = errors.length === 0;

    // Save/Cancel (mock)
    const [openConfirmLeave, setOpenConfirmLeave] = useState(false);
    const handleSave = () => {
        if (!canSave) return;
        alert(isEdit ? "Inventory updated (mock)." : "Inventory created (mock).");
        setDirty(false);
        navigate("/inventory");
    };
    const handleCancel = () => {
        if (dirty) setOpenConfirmLeave(true); else navigate("/inventory");
    };

    // Item picking flow
    const handlePickItem = (it) => {
        setOpenItemPicker(false);
        setPendingItem(it);
        setOpenConfirmOverwrite(true);
    };
    const applyItem = () => {
        if (!pendingItem) return;
        setSelectedItem({id: pendingItem.itemId, name: pendingItem.name});
        setName(pendingItem.name);
        setCategory((prev) => {
            const exists = categories.some((c) => c.toLowerCase() === pendingItem.category.toLowerCase());
            if (!exists) {
                setCategories((cs) => [...cs, pendingItem.category].sort((a, b) => a.localeCompare(b)));
            }
            return pendingItem.category;
        });
        setBaseUom(pendingItem.uom);
        setOpenConfirmOverwrite(false);
        setPendingItem(null);
    };

    // Lots ops
    const addLot = () => setLots((rs) => [...rs, emptyLotRow()]);
    const removeLot = (key) => {
        setLots((rs) => rs.filter((r) => r.key !== key));
        setLotCustom((prev) => {
            const {[key]: _, ...rest} = prev;
            return rest;
        });
    };
    const cloneLot = (key) =>
        setLots((rs) => {
            const idx = rs.findIndex((r) => r.key === key);
            if (idx === -1) return rs;
            const newKey = uid();
            const nr = {...rs[idx], key: newKey};
            // clone custom fields for the new lot
            setLotCustom((prev) => ({
                ...prev,
                [newKey]: (prev[key] ? prev[key].map((f) => ({
                    ...f,
                    id: `cf_${Date.now()}_${Math.floor(Math.random() * 1000)}`
                })) : [])
            }));
            return [...rs.slice(0, idx + 1), nr, ...rs.slice(idx + 1)];
        });
    const updateLot = (key, patch) => setLots((rs) => rs.map((r) => (r.key === key ? {...r, ...patch} : r)));

    // keyboard shortcuts for desktop table
    useEffect(() => {
        const h = (e) => {
            if (e.key === "Enter" && e.target && e.target.tagName === "INPUT") {
                if (e.metaKey || e.ctrlKey) {
                    const key = e.target.getAttribute("data-rowkey");
                    if (key) cloneLot(key);
                } else if (!e.shiftKey) {
                    addLot();
                }
            }
            if (e.key === "Delete") {
                const key = e.target && e.target.getAttribute("data-rowkey");
                if (key) removeLot(key);
            }
        };
        const el = tableRef.current;
        el && el.addEventListener("keydown", h);
        return () => el && el.removeEventListener("keydown", h);
    }, []);

    // Open lot custom modal
    const openCustomForLot = (lotKey) => {
        setActiveLotKey(lotKey);
        setOpenLotCustom(true);
    };
    const activeLot = lots.find((l) => l.key === activeLotKey);
    const activeLotLabel = activeLot ? (activeLot.lotCode ? `Lot ${activeLot.lotCode}` : `Lot (${activeLotKey.slice(0, 6)})`) : "";

    return (
        <div className="relative text-gray-200 min-h-screen">
            {/* Background */}
            <div
                className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 sm:bg-gradient-to-br md:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] md:from-gray-950 md:via-gray-900 md:to-gray-950 lg:bg-gradient-to-tr"/>

            {/* Header */}
            <header className="mx-auto px-4 pt-8 md:pt-10 pb-4 md:pb-6">
                <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-bold text-white">{isEdit ? "Edit Inventory" : "New Inventory"}</h1>
                        <p className="mt-1 md:mt-2 text-gray-400 text-sm md:text-base">Select Item (required), set base
                            data, and manage lots with expiration tracking.</p>
                    </div>
                    <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleSave}
                            disabled={!canSave}
                            className="w-28 px-4 py-2 bg-blue-600 enabled:hover:bg-blue-700 text-white rounded-lg text-sm flex-1 sm:flex-none disabled:opacity-50"
                        >
                            Save
                        </button>
                        <button
                            onClick={handleCancel}
                            className="w-28 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm flex-1 sm:flex-none"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Unsaved banner */}
                <div
                    className="mt-3 md:mt-4 rounded-xl border border-white/10 bg-gray-900/60 px-3 md:px-4 py-3 text-sm flex items-center gap-3">
                    <span className={`inline-flex h-2 w-2 rounded-full ${dirty ? "bg-yellow-400" : "bg-green-400"}`}/>
                    <span
                        className="text-gray-300 truncate">{dirty ? "You have unsaved changes" : "No changes since open"}</span>
                    <span className="ml-auto text-xs text-gray-500">Inventory ID: <span
                        className="font-mono text-gray-300">{inventoryId}</span></span>
                </div>
            </header>

            {/* Content */}
            <section className="mx-auto px-4 pb-[112px] md:pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">General</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Item (required)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        value={selectedItem ? `${selectedItem.id} — ${selectedItem.name}` : ""}
                                        readOnly
                                        placeholder="Pick an Item"
                                        className={classNames(
                                            "w-full rounded-lg bg-gray-800 border px-3 py-2 text-sm",
                                            selectedItem ? "border-white/10" : "border-red-500/50"
                                        )}
                                    />
                                    <button
                                        onClick={() => setOpenItemPicker(true)}
                                        className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm whitespace-nowrap"
                                    >
                                        {selectedItem ? "Change" : "Pick Item"}
                                    </button>
                                </div>
                                {!selectedItem &&
                                    <div className="text-xs text-red-400 mt-1">Item selection is mandatory.</div>}
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Inventory ID</label>
                                <input value={inventoryId} readOnly
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm opacity-80 cursor-not-allowed"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Base UoM</label>
                                <input
                                    value={baseUom}
                                    onChange={(e) => setBaseUom(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    placeholder="e.g. pcs / L / ea"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Name</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    placeholder="e.g. Chain Bracket"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Category</label>
                                <div className="flex gap-2">
                                    <input
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        placeholder="Choose or type"
                                        className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    />
                                    <button
                                        onClick={() => setOpenCategoryPicker(true)}
                                        className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm whitespace-nowrap"
                                        title="Pick / Create Category"
                                    >
                                        Pick / Manage
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Reorder Pt</label>
                                <input
                                    inputMode="numeric"
                                    value={reorderPt}
                                    onChange={(e) => setReorderPt(e.target.value)}
                                    placeholder="e.g. 100"
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm text-right font-mono tabular-nums"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    placeholder="Optional description / notes."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lots */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-white">Lots</h2>
                            <button onClick={addLot}
                                    className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm">+
                                Add Lot
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 mb-2">
                            Track per-lot quantities and expiration. <span className="text-gray-300">Available = Size − Allocated</span>.
                            Expiration is required for each filled lot.
                        </p>

                        {/* Mobile: Card list */}
                        <div className="space-y-3 md:hidden">
                            {lots.map((r) => {
                                const size = Number(r.size || 0);
                                const allocated = Number(r.allocated || 0);
                                const available = size - allocated;
                                const errs = {
                                    exp: !!(r.lotCode || r.expiration || r.size || r.allocated || r.notes) && !r.expiration,
                                    size: r.size !== "" && !(size >= 0),
                                    allocated: r.allocated !== "" && (!(allocated >= 0) || allocated > (Number.isFinite(size) ? size : Infinity)),
                                };
                                const cfCount = (lotCustom[r.key] || []).length;
                                return (
                                    <div key={r.key} className="rounded-xl border border-white/10 bg-gray-900/40 p-3">
                                        <div className="grid grid-cols-1 gap-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-[11px] text-gray-400 mb-1">Lot
                                                        Code</label>
                                                    <input
                                                        data-rowkey={r.key}
                                                        value={r.lotCode}
                                                        onChange={(e) => updateLot(r.key, {lotCode: e.target.value})}
                                                        placeholder="optional"
                                                        className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] text-gray-400 mb-1">Expiration
                                                        *</label>
                                                    <input
                                                        data-rowkey={r.key}
                                                        type="date"
                                                        value={r.expiration}
                                                        onChange={(e) => updateLot(r.key, {expiration: e.target.value})}
                                                        className={classNames("w-full rounded-lg bg-gray-800 border px-3 py-2 text-sm", errs.exp ? "border-red-500/60" : "border-white/10")}
                                                    />
                                                    {errs.exp &&
                                                        <div className="text-xs text-red-400 mt-1">Required</div>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <label className="block text-[11px] text-gray-400 mb-1">Size</label>
                                                    <input
                                                        data-rowkey={r.key}
                                                        inputMode="numeric"
                                                        value={r.size}
                                                        onChange={(e) => updateLot(r.key, {size: e.target.value})}
                                                        placeholder="0"
                                                        className={classNames("w-full rounded-lg bg-gray-800 border px-3 py-2 text-sm text-right font-mono tabular-nums", errs.size ? "border-red-500/60" : "border-white/10")}
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        className="block text-[11px] text-gray-400 mb-1">Allocated</label>
                                                    <input
                                                        data-rowkey={r.key}
                                                        inputMode="numeric"
                                                        value={r.allocated}
                                                        onChange={(e) => updateLot(r.key, {allocated: e.target.value})}
                                                        placeholder="0"
                                                        className={classNames("w-full rounded-lg bg-gray-800 border px-3 py-2 text-sm text-right font-mono tabular-nums", errs.allocated ? "border-red-500/60" : "border-white/10")}
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        className="block text-[11px] text-gray-400 mb-1">Available</label>
                                                    <div
                                                        className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-xs text-gray-200 font-mono tabular-nums text-right">
                                                        {Number.isFinite(available) ? available : "—"}
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] text-gray-400 mb-1">Notes</label>
                                                <input
                                                    data-rowkey={r.key}
                                                    value={r.notes}
                                                    onChange={(e) => updateLot(r.key, {notes: e.target.value})}
                                                    placeholder="Optional"
                                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </div>

                                            <div className="flex flex-wrap justify-end items-center gap-2">
                                                <button
                                                    onClick={() => openCustomForLot(r.key)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium bg-indigo-600/20 text-indigo-300 border-indigo-600/40 hover:bg-indigo-600/30 hover:text-indigo-200"
                                                    title="Custom fields for this lot"
                                                >
                                                    Custom Fields{cfCount ? <span
                                                    className="ml-1 inline-flex items-center px-1.5 rounded bg-indigo-600/40 text-[10px]">{cfCount}</span> : null}
                                                </button>
                                                <button
                                                    onClick={() => cloneLot(r.key)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium bg-gray-800/60 border-white/10 text-gray-200 hover:bg-gray-700/60"
                                                >
                                                    Clone
                                                </button>
                                                <button
                                                    onClick={() => removeLot(r.key)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20 hover:text-red-200"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop: Table */}
                        <div
                            className="hidden md:block overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40 mt-3">
                            <table ref={tableRef} className="min-w-full divide-y divide-gray-800 text-sm table-fixed">
                                <colgroup>
                                    <col style={{width: 160}}/>
                                    <col style={{width: 160}}/>
                                    <col style={{width: 140}}/>
                                    <col style={{width: 140}}/>
                                    <col style={{width: 140}}/>
                                    <col/>
                                    <col style={{width: 260}}/>
                                </colgroup>
                                <thead className="bg-gray-900/80">
                                <tr>
                                    <th className="px-4 py-3 text-left">Lot Code</th>
                                    <th className="px-4 py-3 text-left">Expiration *</th>
                                    <th className="px-4 py-3 text-right">Lot Size</th>
                                    <th className="px-4 py-3 text-right">Allocated</th>
                                    <th className="px-4 py-3 text-right">Available</th>
                                    <th className="px-4 py-3 text-left">Notes</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {lots.map((r) => {
                                    const size = Number(r.size || 0);
                                    const allocated = Number(r.allocated || 0);
                                    const available = size - allocated;
                                    const hasAny = r.lotCode || r.expiration || r.size || r.allocated || r.notes;
                                    const errExp = hasAny && !r.expiration;
                                    const errSize = r.size !== "" && !(size >= 0);
                                    const errAlloc = r.allocated !== "" && (!(allocated >= 0) || allocated > (Number.isFinite(size) ? size : Infinity));
                                    const cfCount = (lotCustom[r.key] || []).length;
                                    return (
                                        <tr key={r.key} className="hover:bg-gray-800/40 transition">
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={r.key}
                                                    value={r.lotCode}
                                                    onChange={(e) => updateLot(r.key, {lotCode: e.target.value})}
                                                    placeholder="optional"
                                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={r.key}
                                                    type="date"
                                                    value={r.expiration}
                                                    onChange={(e) => updateLot(r.key, {expiration: e.target.value})}
                                                    className={classNames("w-full rounded-lg bg-gray-800 border px-3 py-2 text-sm", errExp ? "border-red-500/60" : "border-white/10")}
                                                />
                                                {errExp && <div className="text-xs text-red-400 mt-1">Required</div>}
                                            </td>
                                            <td className="px-4 py-3 align-top text-right">
                                                <input
                                                    data-rowkey={r.key}
                                                    inputMode="numeric"
                                                    value={r.size}
                                                    onChange={(e) => updateLot(r.key, {size: e.target.value})}
                                                    placeholder="0"
                                                    className={classNames("w-full rounded-lg bg-gray-800 border px-3 py-2 text-sm text-right font-mono tabular-nums", errSize ? "border-red-500/60" : "border-white/10")}
                                                />
                                            </td>
                                            <td className="px-4 py-3 align-top text-right">
                                                <input
                                                    data-rowkey={r.key}
                                                    inputMode="numeric"
                                                    value={r.allocated}
                                                    onChange={(e) => updateLot(r.key, {allocated: e.target.value})}
                                                    placeholder="0"
                                                    className={classNames("w-full rounded-lg bg-gray-800 border px-3 py-2 text-sm text-right font-mono tabular-nums", errAlloc ? "border-red-500/60" : "border-white/10")}
                                                />
                                                {errAlloc && <div className="text-xs text-red-400 mt-1">0 ≤ Allocated ≤
                                                    Size</div>}
                                            </td>
                                            <td className="px-4 py-3 align-top text-right text-gray-200 font-mono tabular-nums">
                                                {Number.isFinite(available) ? available : "—"}
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={r.key}
                                                    value={r.notes}
                                                    onChange={(e) => updateLot(r.key, {notes: e.target.value})}
                                                    placeholder="Optional"
                                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        onClick={() => openCustomForLot(r.key)}
                                                        className="px-2.5 py-1.5 rounded-md border text-xs font-medium bg-indigo-600/20 text-indigo-300 border-indigo-600/40 hover:bg-indigo-600/30 hover:text-indigo-200"
                                                        title="Custom fields"
                                                    >
                                                        Custom{cfCount ? <span
                                                        className="ml-1 inline-flex items-center px-1.5 rounded bg-indigo-600/40 text-[10px]">{cfCount}</span> : null}
                                                    </button>
                                                    <button
                                                        onClick={() => cloneLot(r.key)}
                                                        className="px-2.5 py-1.5 rounded-md border text-xs font-medium bg-gray-800/60 border-white/10 text-gray-200 hover:bg-gray-700/60"
                                                    >
                                                        Clone
                                                    </button>
                                                    <button
                                                        onClick={() => removeLot(r.key)}
                                                        className="px-2.5 py-1.5 rounded-md border text-xs font-medium bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20 hover:text-red-200"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 text-xs text-gray-500 flex items-center justify-between flex-wrap gap-3">
                            <div className="hidden md:block">
                                Shortcuts: <span className="text-gray-300">Enter</span> add •{" "}
                                <span className="text-gray-300">Ctrl/⌘+Enter</span> clone •{" "}
                                <span className="text-gray-300">Delete</span> remove
                            </div>
                            <div>
                                Totals — On hand: <span className="text-gray-300">{totals.onHand}</span> •
                                Allocated:{" "}
                                <span className="text-gray-300">{totals.allocated}</span> • Available:{" "}
                                <span className="text-gray-300">{totals.available}</span>
                            </div>
                        </div>
                    </div>

                    {/* Error summary */}
                    {errors.length > 0 && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
                            <div className="font-semibold text-red-300 mb-1">Please fix the following:</div>
                            <ul className="list-disc pl-5 space-y-1 text-red-200">
                                {errors.map((e, i) => (<li key={i}>{e}</li>))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Right summary */}
                <aside className="lg:sticky lg:top-6 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h3 className="text-base font-semibold text-white">Summary</h3>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Inventory</div>
                                <div className="text-sm text-gray-200">{inventoryId}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Item</div>
                                <div className="text-sm text-gray-200 min-h-[20px]">
                                    {selectedItem ? <span className="font-mono">{selectedItem.id}</span> :
                                        <span className="text-gray-500">(not set)</span>}
                                </div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2">
                                <div className="text-xs text-gray-400">Name</div>
                                <div className="text-sm text-gray-200 min-h-[20px]">{name ||
                                    <span className="text-gray-500">(not set)</span>}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Category</div>
                                <div className="text-sm text-gray-200 min-h-[20px]">{category ||
                                    <span className="text-gray-500">(not set)</span>}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Base UoM</div>
                                <div className="text-sm text-gray-200 min-h-[20px]">{baseUom ||
                                    <span className="text-gray-500">(not set)</span>}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Reorder Pt</div>
                                <div className="text-sm text-gray-200 min-h-[20px]">{reorderPt !== "" ? reorderPt :
                                    <span className="text-gray-500">(not set)</span>}</div>
                            </div>

                            <div
                                className="rounded-2xl bg-gray-900/60 p-4 text-xs text-gray-400 border border-white/10 col-span-2">
                                <div className="font-semibold text-gray-300 mb-2">Lot Totals</div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="rounded-lg bg-gray-800/60 p-3 border border-white/10">
                                        <div className="text-[11px] text-gray-400">On hand</div>
                                        <div className="mt-1 text-gray-200 font-mono tabular-nums">{totals.onHand}</div>
                                    </div>
                                    <div className="rounded-lg bg-gray-800/60 p-3 border border-white/10">
                                        <div className="text-[11px] text-gray-400">Allocated</div>
                                        <div
                                            className="mt-1 text-gray-200 font-mono tabular-nums">{totals.allocated}</div>
                                    </div>
                                    <div className="rounded-lg bg-gray-800/60 p-3 border border-white/10">
                                        <div className="text-[11px] text-gray-400">Available</div>
                                        <div
                                            className="mt-1 text-gray-200 font-mono tabular-nums">{totals.available}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </section>

            {/* Sticky bottom action bar (mobile) */}
            <div
                className="fixed md:hidden bottom-0 inset-x-0 z-30 border-t border-white/10 bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60"
                style={{paddingBottom: "env(safe-area-inset-bottom)"}}>
                <div className="px-4 py-3 flex items-center gap-2">
                    <button onClick={handleCancel}
                            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm">Cancel
                    </button>
                    <button onClick={handleSave} disabled={!canSave}
                            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 enabled:hover:bg-blue-700 text-white text-sm disabled:opacity-50">Save
                    </button>
                </div>
            </div>

            {/* Confirm Leave Modal */}
            <Modal
                open={openConfirmLeave}
                onClose={() => setOpenConfirmLeave(false)}
                title="Discard unsaved changes?"
                footer={
                    <>
                        <button onClick={() => setOpenConfirmLeave(false)}
                                className="w-full md:w-28 px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm">Stay
                        </button>
                        <button onClick={() => navigate("/inventory")}
                                className="w-full md:w-28 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm">Discard
                        </button>
                    </>
                }
            >
                <div className="text-gray-300">If you leave, your latest unsaved edits will be lost.</div>
            </Modal>

            {/* Category Picker Modal */}
            <CategoryPickerModal
                open={openCategoryPicker}
                onClose={() => setOpenCategoryPicker(false)}
                categories={categories}
                onPick={(cat) => {
                    setCategory(cat);
                    setOpenCategoryPicker(false);
                }}
                onCreate={(val) => {
                    setCategories((prev) => {
                        const exists = prev.some((c) => c.toLowerCase() === val.toLowerCase());
                        const next = exists ? prev : [...prev, val];
                        return next.sort((a, b) => a.localeCompare(b));
                    });
                    setCategory(val);
                    setOpenCategoryPicker(false);
                }}
                onRename={(from, to) => {
                    setCategories((prev) => prev.map((c) => (c.toLowerCase() === from.toLowerCase() ? to : c)).sort((a, b) => a.localeCompare(b)));
                    setCategory((c) => (c.toLowerCase() === from.toLowerCase() ? to : c));
                }}
                onDelete={(name) => {
                    setCategories((prev) => prev.filter((c) => c.toLowerCase() !== name.toLowerCase()));
                    setCategory((c) => (c.toLowerCase() === name.toLowerCase() ? "" : c));
                }}
            />

            {/* Item Picker Modal */}
            <ItemPickerModal open={openItemPicker} onClose={() => setOpenItemPicker(false)} items={MOCK_ITEMS}
                             onPick={handlePickItem}/>

            {/* Confirm Overwrite Modal */}
            <Modal
                open={openConfirmOverwrite}
                onClose={() => {
                    setOpenConfirmOverwrite(false);
                    setPendingItem(null);
                }}
                title="Overwrite fields with picked Item values?"
                footer={
                    <>
                        <button onClick={() => {
                            setOpenConfirmOverwrite(false);
                            setPendingItem(null);
                        }}
                                className="px-4 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm">Cancel
                        </button>
                        <button onClick={applyItem}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm">Overwrite
                            & Apply
                        </button>
                    </>
                }
            >
                {pendingItem ? (
                    <div className="space-y-3 text-sm">
                        <div className="rounded-lg border border-white/10 bg-gray-900/60 p-3">
                            <div className="text-xs text-gray-400">Selected Item</div>
                            <div className="mt-1 grid grid-cols-2 gap-3">
                                <div className="font-mono text-gray-300">{pendingItem.itemId}</div>
                                <div className="text-gray-300">{pendingItem.name}</div>
                                <div className="text-xs text-gray-400">Category: <span
                                    className="text-gray-300">{pendingItem.category}</span></div>
                                <div className="text-xs text-gray-400">Base UoM: <span
                                    className="text-gray-300">{pendingItem.uom}</span></div>
                            </div>
                        </div>
                        <div className="text-gray-300">This will overwrite the following fields:</div>
                        <ul className="list-disc pl-5 text-gray-200">
                            <li>Name → {pendingItem.name}</li>
                            <li>Category → {pendingItem.category}</li>
                            <li>Base UoM → {pendingItem.uom}</li>
                        </ul>
                        <div className="text-xs text-gray-500">Inventory ID will not change.</div>
                    </div>
                ) : (
                    <div className="text-gray-400 text-sm">No item selected.</div>
                )}
            </Modal>

            {/* Lot Custom Fields Modal */}
            <LotCustomModal
                open={openLotCustom}
                onClose={() => setOpenLotCustom(false)}
                lotLabel={activeLotLabel}
                initialRows={activeLotKey ? (lotCustom[activeLotKey] || []) : []}
                onSave={(rows) => {
                    if (!activeLotKey) return;
                    setLotCustom((prev) => ({...prev, [activeLotKey]: rows}));
                }}
            />
        </div>
    );
}

export {InventoryDetailsPage};
