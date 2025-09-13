import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";

/**
 * ItemDetailsPage — React + Tailwind
 *
 * Purpose:
 * - Aligned with BOM Details UX:
 *   - Fixed, responsive background gradient (covers very tall pages).
 *   - Full-screen-on-mobile modals (Category Picker, Confirm Leave).
 *   - Mobile-friendly layout with sticky bottom actions.
 *   - UoM editor: cards on mobile, table on md+.
 *   - Pill-styled Status in summary.
 * - Save: placeholder function showing `alert()` then navigates to "/items" (no validation gate).
 * - Cancel: confirmation modal when there are unsaved changes.
 * - Self-contained; no external libs.
 */

// ---------- Shared utilities ----------
function classNames(...a) {
    return a.filter(Boolean).join(" ");
}

// ---------- Aligned Modal Shell (full-screen on mobile) ----------
function Modal({open, onClose, title, children, footer}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
            <div className="absolute inset-0 flex items-center justify-center p-0 md:p-4">
                <div
                    className="w-full h-full md:h-auto md:max-h-[85vh] md:max-w-3xl overflow-hidden
                     rounded-none md:rounded-2xl border border-white/10 bg-gray-900 text-gray-200 shadow-2xl"
                >
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

// ---------- Category Picker / Creator Modal ----------
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
    const [mode, setMode] = useState("search"); // 'search' | 'create' | 'manage'

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
    const existsInsensitive = useMemo(
        () => (name) => lowerSet.has(name.trim().toLowerCase()),
        [lowerSet]
    );

    const filtered = useMemo(() => {
        const term = qDebounced.toLowerCase();
        const base = term
            ? categories.filter((c) => c.toLowerCase().includes(term))
            : categories.slice();
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

    useEffect(() => {
        setPage(1);
    }, [qDebounced, pageSize, open]);

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
        if (window.confirm(`Delete category “${name}”? This cannot be undone.`)) {
            safeDelete(name);
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Enter") {
            if (e.ctrlKey || e.metaKey) {
                if (canCreateFromQuery) handleCreate(qDebounced);
                return;
            }
            if (pageRows.length > 0) onPick(pageRows[0]);
            else if (canCreateFromQuery) handleCreate(qDebounced);
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
                                title={
                                    !newCat.trim()
                                        ? "Enter a category name"
                                        : filtered.some(c => c.toLowerCase() === newCat.trim().toLowerCase())
                                            ? "Already exists"
                                            : "Add"
                                }
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
                    {/* Mobile: cards; Desktop: table */}
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
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-emerald-600/80 text-white border-emerald-400/30 hover:bg-emerald-600">
                                                            Save
                                                        </button>
                                                        <button onClick={cancelRename}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => beginRename(cat)}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">
                                                            Rename
                                                        </button>
                                                        <button onClick={() => handleDelete(cat)}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20">
                                                            Delete
                                                        </button>
                                                        <button onClick={() => onPick(cat)}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">
                                                            Use
                                                        </button>
                                                    </>
                                                )
                                            ) : (
                                                <button onClick={() => onPick(cat)}
                                                        className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">
                                                    Use
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {pageRows.length === 0 && (
                            <div className="text-center text-gray-400 py-6 text-sm">
                                {mode === "create" ? "Enter a name to add" : "No matches"}
                            </div>
                        )}
                    </div>

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
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-emerald-600/80 text-white border-emerald-400/30 hover:bg-emerald-600">
                                                            Save
                                                        </button>
                                                        <button onClick={cancelRename}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-2">
                                                        <button onClick={() => beginRename(cat)}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">
                                                            Rename
                                                        </button>
                                                        <button onClick={() => handleDelete(cat)}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20">
                                                            Delete
                                                        </button>
                                                        <button onClick={() => onPick(cat)}
                                                                className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">
                                                            Use
                                                        </button>
                                                    </div>
                                                )
                                            ) : (
                                                <button onClick={() => onPick(cat)}
                                                        className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">
                                                    Use Category
                                                </button>
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
                                {[8, 16, 24].map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(1)}
                                className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50"
                            >
                                ⏮
                            </button>
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                                className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50"
                            >
                                ‹
                            </button>
                            <span>Page {page} / {Math.max(1, Math.ceil(filtered.length / pageSize))}</span>
                            <button
                                disabled={start + pageSize >= filtered.length}
                                onClick={() => setPage(page + 1)}
                                className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50"
                            >
                                ›
                            </button>
                            <button
                                disabled={start + pageSize >= filtered.length}
                                onClick={() => setPage(Math.max(1, Math.ceil(filtered.length / pageSize)))}
                                className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50"
                            >
                                ⏭
                            </button>
                        </div>
                    </div>
                </>
            )}
        </Modal>
    );
}

// ---------- Item Details Page ----------
const nextItemId = (() => {
    let n = 11;
    return () => `ITM-${String(n++).padStart(3, "0")}`;
})();

const DEFAULT_CATEGORIES = [
    "Component",
    "Fabrication",
    "Hardware",
    "Assembly",
    "Finished Good",
    "Consumable",
    "Kit",
];

const STATUS = ["Draft", "Active", "Hold", "Discontinued"];

const uid = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : String(Math.random()).slice(2);

const emptyUomRow = () => ({
    key: uid(),
    uom: "",
    coef: "",
    notes: ""
});

export default function ItemDetailsPage() {
    const navigate = useNavigate();
    const {id: routeId} = useParams();

    // ---------- Form state ----------
    const isEdit = !!routeId;
    const [itemId] = useState(isEdit ? routeId : nextItemId());
    const [name, setName] = useState("");
    const [status, setStatus] = useState(isEdit ? "Active" : "Draft");
    const [baseUom, setBaseUom] = useState("");
    const [description, setDescription] = useState("");

    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [category, setCategory] = useState("Component");

    const [openCategoryPicker, setOpenCategoryPicker] = useState(false);
    const [uomRows, setUomRows] = useState([emptyUomRow()]);

    // ---------- Change tracking (dirty) ----------
    const [dirty, setDirty] = useState(false);
    useEffect(() => {
        setDirty(true);
    }, [name, category, status, baseUom, description, uomRows]);

    // beforeunload guard
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

    // ---------- UoM table ops ----------
    const tableRef = useRef(null);
    const addRow = () => setUomRows((rs) => [...rs, emptyUomRow()]);
    const removeRow = (key) => setUomRows((rs) => rs.filter((r) => r.key !== key));
    const cloneRow = (key) =>
        setUomRows((rs) => {
            const idx = rs.findIndex((r) => r.key === key);
            if (idx === -1) return rs;
            const nr = {...rs[idx], key: uid()};
            return [...rs.slice(0, idx + 1), nr, ...rs.slice(idx + 1)];
        });
    const updateRow = (key, patch) =>
        setUomRows((rs) => rs.map((r) => (r.key === key ? {...r, ...patch} : r)));

    // keyboard shortcuts (desktop)
    useEffect(() => {
        const h = (e) => {
            if (e.key === "Enter" && e.target && e.target.tagName === "INPUT") {
                if (e.metaKey || e.ctrlKey) {
                    const key = e.target.getAttribute("data-rowkey");
                    if (key) cloneRow(key);
                } else if (!e.shiftKey) {
                    addRow();
                }
            }
            if (e.key === "Delete") {
                const key = e.target && e.target.getAttribute("data-rowkey");
                if (key) removeRow(key);
            }
        };
        const el = tableRef.current;
        el && el.addEventListener("keydown", h);
        return () => el && el.removeEventListener("keydown", h);
    }, []);

    // ---------- Validation (kept for error summary only) ----------
    const errors = useMemo(() => {
        const list = [];
        if (!itemId) list.push("Item ID is required.");
        if (!name.trim()) list.push("Product name is required.");
        if (!baseUom.trim()) list.push("Base UoM is required.");
        if (!category.trim()) list.push("Category is required.");

        const seen = new Set();
        uomRows
            .filter((r) => r.uom || r.coef || r.notes)
            .forEach((r, idx) => {
                if (!r.uom) list.push(`UoM row ${idx + 1}: UoM code required.`);
                if (r.uom && r.uom === baseUom)
                    list.push(`UoM row ${idx + 1}: Additional UoM cannot equal base UoM.`);
                if (r.uom) {
                    const u = r.uom.trim().toLowerCase();
                    if (seen.has(u)) list.push(`UoM row ${idx + 1}: Duplicate UoM '${r.uom}'.`);
                    seen.add(u);
                }
                const c = Number(r.coef);
                if (!r.coef || !(c > 0)) list.push(`UoM row ${idx + 1}: Coefficient must be > 0.`);
            });

        return list;
    }, [itemId, name, baseUom, uomRows, category]);

    const validUoms = useMemo(
        () => uomRows.filter((r) => r.uom && r.uom !== baseUom && Number(r.coef) > 0),
        [uomRows, baseUom]
    );

    // ---------- Actions (mock) ----------
    const [openConfirmLeave, setOpenConfirmLeave] = useState(false);

    const mockSaveAndGo = () => {
        alert(isEdit ? "Item updated (mock)." : "Item created (mock).");
        setDirty(false);
        navigate("/items");
    };

    const handleSave = () => {
        // Placeholder save intentionally does not block on validation.
        mockSaveAndGo();
    };

    const handleCancel = () => {
        if (dirty) {
            setOpenConfirmLeave(true);
            return;
        }
        navigate("/items");
    };

    // Category create: add & select
    const createCategory = (val) => {
        setCategories((prev) => {
            const exists = prev.some((c) => c.toLowerCase() === val.toLowerCase());
            const next = exists ? prev : [...prev, val];
            return next.sort((a, b) => a.localeCompare(b));
        });
        setCategory(val);
    };

    return (
        <div className="relative text-gray-200 min-h-screen">
            {/* Fixed, full-viewport responsive background gradient */}
            <div
                className={classNames(
                    "pointer-events-none fixed inset-0 -z-10",
                    "bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950",
                    "sm:bg-gradient-to-br sm:from-gray-950 sm:via-gray-900 sm:to-gray-950",
                    "md:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] md:from-gray-950 md:via-gray-900 md:to-gray-950",
                    "lg:bg-gradient-to-tr lg:from-gray-950 lg:via-gray-900 lg:to-gray-950"
                )}
            />

            {/* Header */}
            <header className="mx-auto px-4 pt-8 md:pt-10 pb-4 md:pb-6">
                <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-bold text-white">{isEdit ? "Edit Item" : "New Item"}</h1>
                        <p className="mt-1 md:mt-2 text-gray-400 text-sm md:text-base">
                            Define base information and optional UoM conversions. ID is read-only.
                        </p>
                    </div>
                    <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleSave}
                            className="w-28 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex-1 sm:flex-none"
                            title="Save (mock)"
                        >
                            Save
                        </button>
                        <button
                            onClick={handleCancel}
                            className="w-28 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm flex-1 sm:flex-none"
                            title="Cancel and go back"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Unsaved banner */}
                <div
                    className="mt-3 md:mt-4 rounded-xl border border-white/10 bg-gray-900/60 px-3 md:px-4 py-3 text-sm flex items-center gap-3">
                    <span className={`inline-flex h-2 w-2 rounded-full ${dirty ? "bg-yellow-400" : "bg-green-400"}`}/>
                    <span className="text-gray-300 truncate">
            {dirty ? "You have unsaved changes" : "No changes since open"}
          </span>
                    <span className="ml-auto text-xs text-gray-500">
            Item ID: <span className="font-mono text-gray-300">{itemId}</span>
          </span>
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
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Item ID</label>
                                <input
                                    value={itemId}
                                    readOnly
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm opacity-80 cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                >
                                    {STATUS.map((s) => (
                                        <option key={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Product name</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    placeholder="e.g. Chain Bracket"
                                />
                            </div>

                            {/* Category with Picker */}
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
                                <p className="mt-1 text-xs text-gray-500">Use the picker to search or create a new
                                    category.</p>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Base UoM</label>
                                <input
                                    value={baseUom}
                                    onChange={(e) => setBaseUom(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    placeholder="e.g. pcs / L / kg / ea"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    placeholder="Optional description / specs."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional UoMs */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-white">Additional UoMs</h2>
                            <button
                                onClick={addRow}
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm"
                            >
                                + Add UoM
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 mb-2">
                            Conversion rule:{" "}
                            <span className="text-gray-300 font-medium">
                1 &lt;additional UoM&gt; = coef × 1 {baseUom || "base UoM"}
              </span>
                        </p>

                        {/* Mobile: Card list */}
                        <div className="space-y-3 md:hidden">
                            {uomRows.map((r) => {
                                const coefNum = Number(r.coef || 0);
                                const ex = baseUom ? `1 ${r.uom || "ALT"} = ${r.coef || "?"} ${baseUom}` : "Set base UoM to see example";
                                const rowErrors = {
                                    uom: !r.uom || (baseUom && r.uom === baseUom),
                                    coef: !r.coef || !(coefNum > 0),
                                };
                                return (
                                    <div key={r.key} className="rounded-xl border border-white/10 bg-gray-900/40 p-3">
                                        <div className="grid grid-cols-1 gap-2">
                                            <div>
                                                <label className="block text-[11px] text-gray-400 mb-1">UoM</label>
                                                <input
                                                    data-rowkey={r.key}
                                                    value={r.uom}
                                                    onChange={(e) => updateRow(r.key, {uom: e.target.value})}
                                                    placeholder="e.g. box, pack, kg"
                                                    className={classNames(
                                                        "w-full rounded-lg bg-gray-800 border px-3 py-2 text-sm",
                                                        rowErrors.uom ? "border-red-500/60" : "border-white/10"
                                                    )}
                                                />
                                                {baseUom && r.uom === baseUom && (
                                                    <div className="text-xs text-red-400 mt-1">Cannot equal base
                                                        UoM.</div>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label
                                                        className="block text-[11px] text-gray-400 mb-1">Coefficient</label>
                                                    <input
                                                        data-rowkey={r.key}
                                                        inputMode="decimal"
                                                        value={r.coef}
                                                        onChange={(e) => updateRow(r.key, {coef: e.target.value})}
                                                        placeholder="> 0"
                                                        className={classNames(
                                                            "w-full rounded-lg bg-gray-800 border px-3 py-2 text-sm text-right font-mono tabular-nums",
                                                            rowErrors.coef ? "border-red-500/60" : "border-white/10"
                                                        )}
                                                    />
                                                </div>
                                                <div>
                                                    <label
                                                        className="block text-[11px] text-gray-400 mb-1">Example</label>
                                                    <div
                                                        className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-xs text-gray-300 font-mono tabular-nums">
                                                        {ex}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-gray-400 mb-1">Notes</label>
                                                <input
                                                    data-rowkey={r.key}
                                                    value={r.notes}
                                                    onChange={(e) => updateRow(r.key, {notes: e.target.value})}
                                                    placeholder="Optional"
                                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </div>
                                            <div className="flex justify-end items-center gap-2">
                                                <button
                                                    onClick={() => cloneRow(r.key)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium bg-gray-800/60 border-white/10 text-gray-200 hover:bg-gray-700/60"
                                                >
                                                    Clone
                                                </button>
                                                <button
                                                    onClick={() => removeRow(r.key)}
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
                            className="hidden md:block overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                            <table ref={tableRef} className="min-w-full divide-y divide-gray-800 text-sm table-fixed">
                                <colgroup>
                                    <col style={{width: 180}}/>
                                    <col style={{width: 140}}/>
                                    <col/>
                                    <col style={{width: 200}}/>
                                    <col style={{width: 180}}/>
                                </colgroup>
                                <thead className="bg-gray-900/80">
                                <tr>
                                    <th className="px-4 py-3 text-left">UoM</th>
                                    <th className="px-4 py-3 text-right">Coefficient</th>
                                    <th className="px-4 py-3 text-left">Notes</th>
                                    <th className="px-4 py-3 text-right">Example</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {uomRows.map((r) => {
                                    const coef = Number(r.coef || 0);
                                    const ex = baseUom ? `1 ${r.uom || "ALT"} = ${r.coef || "?"} ${baseUom}` : "Set base UoM to see example";
                                    const rowErrors = {
                                        uom: !r.uom || (baseUom && r.uom === baseUom),
                                        coef: !r.coef || !(coef > 0),
                                    };
                                    return (
                                        <tr key={r.key} className="hover:bg-gray-800/40 transition">
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={r.key}
                                                    value={r.uom}
                                                    onChange={(e) => updateRow(r.key, {uom: e.target.value})}
                                                    placeholder="e.g. box, pack, kg"
                                                    className={classNames(
                                                        "w-40 rounded-lg bg-gray-800 border px-3 py-2 text-sm",
                                                        rowErrors.uom ? "border-red-500/60" : "border-white/10"
                                                    )}
                                                />
                                                {baseUom && r.uom === baseUom && (
                                                    <div className="text-xs text-red-400 mt-1">Cannot equal base
                                                        UoM.</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 align-top text-right font-mono tabular-nums">
                                                <input
                                                    data-rowkey={r.key}
                                                    inputMode="decimal"
                                                    value={r.coef}
                                                    onChange={(e) => updateRow(r.key, {coef: e.target.value})}
                                                    placeholder="> 0"
                                                    className={classNames(
                                                        "w-28 rounded-lg bg-gray-800 border px-3 py-2 text-sm text-right font-mono tabular-nums",
                                                        rowErrors.coef ? "border-red-500/60" : "border-white/10"
                                                    )}
                                                />
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={r.key}
                                                    value={r.notes}
                                                    onChange={(e) => updateRow(r.key, {notes: e.target.value})}
                                                    placeholder="Optional"
                                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 align-top text-right text-gray-300 font-mono tabular-nums">
                                                {ex}
                                            </td>
                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        onClick={() => cloneRow(r.key)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium bg-gray-800/60 border-white/10 text-gray-200 hover:bg-gray-700/60"
                                                    >
                                                        Clone
                                                    </button>
                                                    <button
                                                        onClick={() => removeRow(r.key)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20 hover:text-red-200"
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
                                <span className="text-gray-300">Ctrl/⌘+D</span> clone •{" "}
                                <span className="text-gray-300">Delete</span> remove
                            </div>
                            <div className="md:hidden">
                                Tip: Coefficient must be <span className="text-gray-300">&gt; 0</span>.
                            </div>
                            <div>
                                Valid additional UoMs: <span className="text-gray-300">{validUoms.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Attachments placeholder */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-1">Attachments</h2>
                        <div className="text-sm text-gray-400">Upload drawings/specs later. (Placeholder)</div>
                    </div>

                    {/* Error summary */}
                    {errors.length > 0 && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
                            <div className="font-semibold text-red-300 mb-1">Please fix the following:</div>
                            <ul className="list-disc pl-5 space-y-1 text-red-200">
                                {errors.map((e, i) => (
                                    <li key={i}>{e}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Right sticky summary */}
                <aside className="lg:sticky lg:top-6 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h3 className="text-base font-semibold text-white">Summary</h3>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Item</div>
                                <div className="text-sm text-gray-200">{itemId}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Status</div>
                                <div className="mt-1">
                  <span
                      className={classNames(
                          "inline-block px-3 py-1 text-xs font-medium rounded-full border",
                          status === "Active" && "bg-green-500/20 text-green-300 border-green-500/30",
                          status === "Hold" && "bg-orange-500/20 text-orange-300 border-orange-500/30",
                          status === "Discontinued" && "bg-gray-500/20 text-gray-300 border-gray-500/30",
                          status === "Draft" && "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                      )}
                  >
                    {status}
                  </span>
                                </div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Category</div>
                                <div className="text-sm text-gray-200">{category}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Base UoM</div>
                                <div className="text-sm text-gray-200 min-h-[20px]">
                                    {baseUom || <span className="text-gray-500">(not set)</span>}
                                </div>
                            </div>

                            <div
                                className="rounded-2xl bg-gray-900/60 p-4 text-xs text-gray-400 border border-white/10 col-span-2">
                                <div className="font-semibold text-gray-300 mb-2">Conversions</div>
                                {validUoms.length === 0 ? (
                                    <div className="text-gray-500">No additional UoMs yet.</div>
                                ) : (
                                    <ul className="list-disc pl-5 space-y-1">
                                        {validUoms.map((r) => (
                                            <li key={r.key} className="text-gray-300 font-mono tabular-nums">
                                                1 {r.uom} = {r.coef} {baseUom}
                                                {r.notes ? <span className="text-gray-500"> — {r.notes}</span> : null}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div
                                className="rounded-2xl bg-gray-900/60 p-4 text-xs text-gray-400 border border-white/10 col-span-2">
                                <div className="font-semibold text-gray-300 mb-2">Tips</div>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Use concise UoM codes (e.g., pcs, box, kg, ea).</li>
                                    <li>Coefficient shows how many base units are in 1 additional unit.</li>
                                    <li>Keep descriptions short and specific for easier search.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </aside>
            </section>

            {/* Sticky bottom action bar (mobile) */}
            <div
                className="fixed md:hidden bottom-0 inset-x-0 z-30 border-t border-white/10 bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60"
                style={{paddingBottom: "env(safe-area-inset-bottom)"}}
            >
                <div className="px-4 py-3 flex items-center gap-2">
                    <button
                        onClick={handleCancel}
                        className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                        Save
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
                        <button
                            onClick={() => setOpenConfirmLeave(false)}
                            className="w-full md:w-28 px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm"
                        >
                            Stay
                        </button>
                        <button
                            onClick={() => navigate("/items")}
                            className="w-full md:w-28 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
                        >
                            Discard
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
                    createCategory(val);
                    setOpenCategoryPicker(false);
                }}
            />
        </div>
    );
}

export {ItemDetailsPage};