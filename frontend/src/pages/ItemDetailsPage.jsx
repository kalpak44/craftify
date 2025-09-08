import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";

/**
 * ItemDetailsPage — with Category Picker / Creator (aligned to BOM picker modals)
 *
 * - "Category" now uses a modal picker with search + pagination, same shell as BOM pickers.
 * - The modal also allows creating a new category (deduped, case-insensitive).
 * - Raw JS, Tailwind-only, self-contained.
 */

// ---------- Shared utilities ----------
function classNames(...a) {
    return a.filter(Boolean).join(" ");
}

// ---------- Aligned Modal + Pager (same shell as BOM) ----------
function Modal({open, onClose, title, children, footer}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div
                    className="w-full max-w-3xl rounded-2xl border border-white/10 bg-gray-900 text-gray-200 shadow-2xl">
                    <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-200">&times;</button>
                    </div>
                    <div className="p-5 max-h-[65vh] overflow-y-auto">{children}</div>
                    <div
                        className="px-5 py-4 border-t border-white/10 bg-gray-900/60 flex items-center justify-end gap-2">
                        {footer}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Pager({page, pageSize, total, onPage, onPageSize}) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    return (
        <div className="flex items-center justify-between mt-3 text-xs text-gray-300">
            <div className="flex items-center gap-2">
                <span>Rows per page</span>
                <select
                    value={pageSize}
                    onChange={e => onPageSize(Number(e.target.value))}
                    className="bg-gray-800 border border-white/10 rounded px-2 py-1"
                >
                    {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
            </div>
            <div className="flex items-center gap-2">
                <button disabled={page <= 1} onClick={() => onPage(1)}
                        className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50">⏮
                </button>
                <button disabled={page <= 1} onClick={() => onPage(page - 1)}
                        className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50">‹
                </button>
                <span>Page {page} / {pages}</span>
                <button disabled={page >= pages} onClick={() => onPage(page + 1)}
                        className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50">›
                </button>
                <button disabled={page >= pages} onClick={() => onPage(pages)}
                        className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50">⏭
                </button>
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
    // optional callbacks to avoid breaking callers
    const safeRename = onRename || (() => {
    });
    const safeDelete = onDelete || (() => {
    });

    const [q, setQ] = useState("");
    const [qDebounced, setQDebounced] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8); // 8 / 16 / 24

    // 'search' | 'create' | 'manage'
    const [mode, setMode] = useState("search");

    const [newCat, setNewCat] = useState("");
    const [createError, setCreateError] = useState("");

    // rename state (manage mode)
    const [editingKey, setEditingKey] = useState(null); // original name
    const [editValue, setEditValue] = useState("");
    const [renameError, setRenameError] = useState("");

    // --- Debounced search
    useEffect(() => {
        const t = setTimeout(() => setQDebounced(q.trim()), 150);
        return () => clearTimeout(t);
    }, [q]);

    // --- Derived
    const lowerSet = useMemo(
        () => new Set(categories.map((c) => c.toLowerCase())),
        [categories]
    );
    const existsInsensitive = useMemo(
        () => (name) => lowerSet.has(name.trim().toLowerCase()),
        [lowerSet]
    );

    const filtered = useMemo(() => {
        const term = qDebounced.toLowerCase();
        const base = term
            ? categories.filter((c) => c.toLowerCase().includes(term))
            : categories.slice();
        // sort: exact match → prefix → alphabetical
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

    // Reset paging when inputs change or when modal opens
    useEffect(() => {
        setPage(1);
    }, [qDebounced, pageSize, open]);

    // Reset rename state when switching mode or closing
    useEffect(() => {
        setEditingKey(null);
        setEditValue("");
        setRenameError("");
        if (mode === "create") {
            // also clear search hint noise while creating
            setQ("");
            setQDebounced("");
        }
    }, [mode, open]);

    // --- Handlers
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
        if (!isSame && existsInsensitive(to)) {
            return setRenameError("Another category with this name already exists.");
        }
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
                    {/* Left: helper text */}
                    <div className="hidden sm:flex items-center gap-3 text-xs text-gray-400">
                        {mode === "search" ? (
                            <>
                <span>
                  <span className="text-gray-300">Enter</span> pick first
                </span>
                                <span>•</span>
                                <span>
                  <span className="text-gray-300">Ctrl/⌘+Enter</span> create from search
                </span>
                                <span>•</span>
                                <span>
                  <span className="text-gray-300">Esc</span> close
                </span>
                            </>
                        ) : mode === "manage" ? (
                            <>
                                <span>Rename or delete categories below.</span>
                                <span>•</span>
                                <span>
                  <span className="text-gray-300">Esc</span> close
                </span>
                            </>
                        ) : (
                            <>
                <span>
                  <span className="text-gray-300">Enter</span> add
                </span>
                                <span>•</span>
                                <span>
                  <span className="text-gray-300">Esc</span> close
                </span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Add button moved to footer when in CREATE mode */}
                        {mode === "create" && (
                            <button
                                onClick={() => handleCreate()}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm disabled:opacity-60"
                                disabled={!newCat.trim() || existsInsensitive(newCat)}
                                title={
                                    !newCat.trim()
                                        ? "Enter a category name"
                                        : existsInsensitive(newCat)
                                            ? "Already exists"
                                            : "Add"
                                }
                            >
                                + Add
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            }
        >
            {/* Header: segmented modes */}
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

                {/* Panels */}
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
                        {newCat.trim() && existsInsensitive(newCat) && !createError && (
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
                        {renameError && (
                            <div className="mt-2 text-xs text-red-400">{renameError}</div>
                        )}
                    </div>
                )}
            </div>

            {/* Results table */}
            {(mode === "search" || mode === "manage") && (
                <>
                    <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                        <table className="min-w-full divide-y divide-gray-800 text-sm">
                            <thead className="bg-gray-900/80">
                            <tr>
                                <th className="px-4 py-3 text-left">Category</th>
                                <th className="px-4 py-3 text-right">
                                    {mode === "manage" ? "Manage" : "Action"}
                                </th>
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
                                                <div className="flex items-center gap-2">
                                                    {qDebounced &&
                                                        (cat.toLowerCase() === qDebounced.toLowerCase() ? (
                                                            <span
                                                                className="text-[10px] px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-200 border border-blue-400/30">
                                  exact
                                </span>
                                                        ) : cat
                                                            .toLowerCase()
                                                            .startsWith(qDebounced.toLowerCase()) ? (
                                                            <span
                                                                className="text-[10px] px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-200 border border-purple-400/30">
                                  prefix
                                </span>
                                                        ) : null)}
                                                    <span>{cat}</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {mode === "manage" ? (
                                                isEditing ? (
                                                    <div className="inline-flex items-center gap-2">
                                                        <button
                                                            onClick={submitRename}
                                                            className="px-2.5 py-1.5 rounded-md border text-xs bg-emerald-600/80 text-white border-emerald-400/30 hover:bg-emerald-600"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={cancelRename}
                                                            className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center gap-2">
                                                        <button
                                                            onClick={() => beginRename(cat)}
                                                            className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700"
                                                        >
                                                            Rename
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(cat)}
                                                            className="px-2.5 py-1.5 rounded-md border text-xs bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20"
                                                        >
                                                            Delete
                                                        </button>
                                                        <button
                                                            onClick={() => onPick(cat)}
                                                            className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700"
                                                        >
                                                            Use
                                                        </button>
                                                    </div>
                                                )
                                            ) : (
                                                <button
                                                    onClick={() => onPick(cat)}
                                                    className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700"
                                                >
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

                    {/* Bottom pager with 8 / 16 / 24 only */}
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
                            <span>
                Page {page} / {pages}
              </span>
                            <button
                                disabled={page >= pages}
                                onClick={() => setPage(page + 1)}
                                className="px-2 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-50"
                            >
                                ›
                            </button>
                            <button
                                disabled={page >= pages}
                                onClick={() => setPage(pages)}
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
    let n = 11; // assume ITM-010 exists; next is ITM-011
    return () => `ITM-${String(n++).padStart(3, "0")}`;
})();

const DEFAULT_CATEGORIES = [
    "Component",
    "Fabrication",
    "Hardware",
    "Assembly",
    "Finished Good",
    "Consumable",
    "Kit"
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

    // Categories state (now dynamic)
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [category, setCategory] = useState("Component");

    // Category modal
    const [openCategoryPicker, setOpenCategoryPicker] = useState(false);

    const [uomRows, setUomRows] = useState([emptyUomRow()]);

    // ---------- Autosave (fake) ----------
    const [dirty, setDirty] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const saveTimer = useRef(null);

    const requestSave = () => {
        setDirty(true);
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
            setLastSavedAt(new Date());
            setDirty(false);
        }, 800);
    };

    useEffect(() => {
        requestSave();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [name, category, status, baseUom, description, uomRows]);

    // ---------- Unsaved changes guard ----------
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

    // keyboard shortcuts
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

    // ---------- Validation ----------
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

    // derived
    const validUoms = useMemo(
        () => uomRows.filter((r) => r.uom && r.uom !== baseUom && Number(r.coef) > 0),
        [uomRows, baseUom]
    );

    // ---------- Actions (mock) ----------
    const handleSave = () => {
        if (errors.length) {
            alert("Please resolve errors before saving.");
            return;
        }
        setLastSavedAt(new Date());
        setDirty(false);
        alert(isEdit ? "Item updated (mock)." : "Item created (mock).");
        navigate("/items");
    };

    const handleCancel = () => {
        if (dirty && !window.confirm("Discard unsaved changes?")) return;
        navigate("/items");
    };

    // Category create: add & select
    const createCategory = (val) => {
        setCategories((prev) => {
            const exists = prev.some(c => c.toLowerCase() === val.toLowerCase());
            const next = exists ? prev : [...prev, val];
            return next.sort((a, b) => a.localeCompare(b));
        });
        setCategory(val);
    };

    return (
        <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">{isEdit ? "Edit Item" : "New Item"}</h1>
                        <p className="mt-2 text-gray-400">
                            Define base information and optional UoM conversions. ID is read-only.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            className="w-32 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-60"
                            disabled={errors.length > 0}
                            title={errors.length ? "Fix errors to enable Save" : "Save"}
                        >
                            Save
                        </button>
                        <button
                            onClick={handleCancel}
                            className="w-32 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                            title="Cancel and go back"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Autosave banner */}
                <div
                    className="mt-4 rounded-xl border border-white/10 bg-gray-900/60 px-4 py-3 text-sm flex items-center gap-3">
                    <span className={`inline-flex h-2 w-2 rounded-full ${dirty ? "bg-yellow-400" : "bg-green-400"}`}/>
                    <span className="text-gray-300">
            {dirty ? "Saving draft…" : lastSavedAt ? `Last saved ${lastSavedAt.toLocaleTimeString()}` : "No changes yet"}
          </span>
                    <span className="ml-auto text-xs text-gray-500">
            Item ID: <span className="font-mono text-gray-300">{itemId}</span>
          </span>
                </div>
            </header>

            {/* Content */}
            <section className="mx-auto px-4 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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
                            <div className="sm:col-span-1">
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
                                <p className="mt-1 text-xs text-gray-500">
                                    Use the picker to search or create a new category.
                                </p>
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

                        <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                            <table ref={tableRef} className="min-w-full divide-y divide-gray-800 text-sm table-fixed">
                                <colgroup>
                                    <col style={{width: 180}}/>
                                    <col style={{width: 140}}/>
                                    <col/>
                                    <col style={{width: 180}}/>
                                    <col style={{width: 160}}/>
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
                                    const ex = baseUom
                                        ? `1 ${r.uom || "ALT"} = ${r.coef || "?"} ${baseUom}`
                                        : "Set base UoM to see example";
                                    const rowErrors = {
                                        uom: !r.uom || (baseUom && r.uom === baseUom),
                                        coef: !r.coef || !(coef > 0)
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
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex justify-end items-center gap-2">
                                                    <button
                                                        onClick={() => cloneRow(r.key)}
                                                        className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-800/60 border-white/10 hover:bg-gray-700/60"
                                                    >
                                                        ⎘ Clone
                                                    </button>
                                                    <button
                                                        onClick={() => removeRow(r.key)}
                                                        className="px-2.5 py-1.5 rounded-md border text-xs bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20"
                                                    >
                                                        ✕ Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
                            <div>
                                Shortcuts: <span className="text-gray-300">Enter</span> add •{" "}
                                <span className="text-gray-300">Ctrl/⌘+D</span> clone •{" "}
                                <span className="text-gray-300">Delete</span> remove
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
                                <span
                                    className={classNames(
                                        "px-2 py-1 text-xs rounded-full",
                                        status === "Active"
                                            ? "bg-green-600/30 text-green-400"
                                            : status === "Hold"
                                                ? "bg-yellow-600/30 text-yellow-400"
                                                : status === "Discontinued"
                                                    ? "bg-gray-600/30 text-gray-400"
                                                    : "bg-blue-600/30 text-blue-300"
                                    )}
                                >
                  {status}
                </span>
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
                    createCategory(val);   // adds and selects
                    setOpenCategoryPicker(false);
                }}
            />
        </div>
    );
}

export {ItemDetailsPage};
