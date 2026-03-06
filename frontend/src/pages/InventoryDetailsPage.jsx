import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useAuthFetch} from "../hooks/useAuthFetch";
import {listAllItems} from "../api/items";
import {
    listCategories,
    createCategory as apiCreateCategory,
    renameCategory as apiRenameCategory,
    deleteCategory as apiDeleteCategory,
} from "../api/categories";
import {
    getInventory,
    getNextInventoryCode,
    createInventory,
    updateInventory,
} from "../api/inventory";

function classNames(...parts) {
    return parts.filter(Boolean).join(" ");
}

function Modal({open, onClose, title, children, footer}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
            <div className="absolute inset-0 flex items-center justify-center p-0 md:p-4">
                <div
                    className="w-full h-full md:h-auto md:max-h-[85vh] md:max-w-3xl overflow-hidden rounded-none md:rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-200 shadow-2xl"
                >
                    <div className="px-4 md:px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-base md:text-lg font-semibold">{title}</h3>
                        <button
                            onClick={onClose}
                            className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 text-xl leading-none"
                        >
                            &times;
                        </button>
                    </div>
                    <div className="p-4 md:p-5 h-[calc(100%-112px)] md:h-auto overflow-y-auto">{children}</div>
                    <div className="px-4 md:px-5 py-4 border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 flex items-center justify-end gap-2">
                        {footer}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ItemPickerModal({open, onClose, onPick, items}) {
    const [q, setQ] = useState("");

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return items;
        return items.filter((it) =>
            String(it?.code || it?.id || "").toLowerCase().includes(term)
            || String(it?.name || "").toLowerCase().includes(term)
            || String(it?.uomBase || "").toLowerCase().includes(term)
            || String(it?.categoryName || "").toLowerCase().includes(term)
        );
    }, [items, q]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Select Item"
            footer={
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 border border-slate-200 dark:border-white/10 rounded-lg text-sm w-full md:w-auto"
                >
                    Close
                </button>
            }
        >
            <div className="mb-3">
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search by code, name, category, UoM"
                    className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                />
            </div>

            <div className="space-y-2 md:hidden">
                {filtered.map((it) => {
                    const itemCode = it?.code || it?.id;
                    return (
                        <div
                            key={itemCode}
                            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-3"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <div className="font-mono text-sm">{itemCode}</div>
                                    <div className="text-sm text-slate-700 dark:text-gray-300">{it?.name || "Unnamed"}</div>
                                    <div className="text-xs text-slate-600 dark:text-gray-500 mt-1">
                                        {it?.categoryName || "No category"} • UoM: {it?.uomBase || "-"}
                                    </div>
                                </div>
                                <button
                                    onClick={() => onPick(it)}
                                    className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-gray-700 text-sm whitespace-nowrap"
                                >
                                    Use
                                </button>
                            </div>
                        </div>
                    );
                })}
                {filtered.length === 0 && (
                    <div className="text-center text-slate-500 dark:text-gray-400 py-6 text-sm">No matches</div>
                )}
            </div>

            <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl bg-slate-100/70 dark:bg-gray-900/40">
                <table className="min-w-full divide-y divide-gray-800 text-sm">
                    <thead className="bg-slate-100/80 dark:bg-gray-900/80">
                    <tr>
                        <th className="px-4 py-3 text-left">Item</th>
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Category</th>
                        <th className="px-4 py-3 text-left">UoM</th>
                        <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                    {filtered.map((it) => {
                        const itemCode = it?.code || it?.id;
                        return (
                            <tr key={itemCode} className="hover:bg-slate-100/60 dark:hover:bg-gray-800/40">
                                <td className="px-4 py-3 font-mono">{itemCode}</td>
                                <td className="px-4 py-3">{it?.name || "Unnamed"}</td>
                                <td className="px-4 py-3">{it?.categoryName || "-"}</td>
                                <td className="px-4 py-3">{it?.uomBase || "-"}</td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => onPick(it)}
                                        className="px-2.5 py-1.5 rounded-md border text-xs bg-slate-100 dark:bg-gray-800 border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-gray-700"
                                    >
                                        Use Item
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-slate-500 dark:text-gray-400">No matches</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </Modal>
    );
}

function CategoryPickerModal({open, onClose, categories, onPick, onCreate, onRename, onDelete}) {
    const [q, setQ] = useState("");
    const [mode, setMode] = useState("search");
    const [newName, setNewName] = useState("");
    const [editingKey, setEditingKey] = useState(null);
    const [editValue, setEditValue] = useState("");

    useEffect(() => {
        if (!open) {
            setQ("");
            setMode("search");
            setNewName("");
            setEditingKey(null);
            setEditValue("");
        }
    }, [open]);

    const lowerSet = useMemo(() => new Set(categories.map((c) => c.toLowerCase())), [categories]);
    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return categories;
        return categories.filter((c) => c.toLowerCase().includes(term));
    }, [categories, q]);

    const canCreate = newName.trim() && !lowerSet.has(newName.trim().toLowerCase());

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Pick or Manage Category"
            footer={
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 border border-slate-200 dark:border-white/10 rounded-lg text-sm w-full md:w-auto"
                >
                    Close
                </button>
            }
        >
            <div className="mb-4 inline-flex rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-1">
                {[
                    {key: "search", label: "Search"},
                    {key: "create", label: "Create"},
                    {key: "manage", label: "Manage"},
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setMode(tab.key)}
                        className={classNames(
                            "px-3 py-1.5 text-xs rounded-lg transition",
                            mode === tab.key
                                ? "bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-white"
                                : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {mode === "search" && (
                <div className="space-y-3">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search category"
                        className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                    />
                    <div className="max-h-[45vh] overflow-auto rounded-xl border border-slate-200 dark:border-white/10">
                        {filtered.map((name) => (
                            <button
                                key={name}
                                onClick={() => onPick(name)}
                                className="w-full text-left px-3 py-2 text-sm border-b last:border-b-0 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-gray-800/50"
                            >
                                {name}
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <div className="px-3 py-6 text-center text-sm text-slate-500 dark:text-gray-400">No matches</div>
                        )}
                    </div>
                </div>
            )}

            {mode === "create" && (
                <div className="space-y-3">
                    <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="New category name"
                        className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                    />
                    <button
                        onClick={async () => {
                            if (!canCreate) return;
                            const ok = await onCreate(newName.trim());
                            if (ok) {
                                setNewName("");
                                setMode("search");
                            }
                        }}
                        disabled={!canCreate}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm"
                    >
                        Add Category
                    </button>
                </div>
            )}

            {mode === "manage" && (
                <div className="max-h-[55vh] overflow-auto rounded-xl border border-slate-200 dark:border-white/10 divide-y divide-slate-200 dark:divide-white/10">
                    {categories.map((name) => (
                        <div key={name} className="p-3 flex items-center gap-2">
                            {editingKey === name ? (
                                <>
                                    <input
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="flex-1 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                                    />
                                    <button
                                        onClick={async () => {
                                            const nextName = editValue.trim();
                                            if (!nextName || nextName.toLowerCase() === name.toLowerCase()) {
                                                setEditingKey(null);
                                                setEditValue("");
                                                return;
                                            }
                                            const ok = await onRename(name, nextName);
                                            if (ok) {
                                                setEditingKey(null);
                                                setEditValue("");
                                            }
                                        }}
                                        className="px-3 py-2 text-xs rounded-md bg-blue-600 text-white"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingKey(null);
                                            setEditValue("");
                                        }}
                                        className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-white/10"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => onPick(name)}
                                        className="flex-1 text-left text-sm hover:underline"
                                    >
                                        {name}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEditingKey(name);
                                            setEditValue(name);
                                        }}
                                        className="px-3 py-2 text-xs rounded-md border border-slate-200 dark:border-white/10"
                                    >
                                        Rename
                                    </button>
                                    <button
                                        onClick={async () => {
                                            const ok = await onDelete(name);
                                            if (!ok) return;
                                        }}
                                        className="px-3 py-2 text-xs rounded-md bg-red-600/80 text-white"
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                        </div>
                    ))}
                    {categories.length === 0 && (
                        <div className="px-3 py-6 text-center text-sm text-slate-500 dark:text-gray-400">No categories</div>
                    )}
                </div>
            )}
        </Modal>
    );
}

export default function InventoryDetailsPage() {
    const navigate = useNavigate();
    const authFetch = useAuthFetch();
    const {routeItemId} = useParams();
    const isEdit = Boolean(routeItemId);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [code, setCode] = useState("");
    const [items, setItems] = useState([]);
    const [catObjs, setCatObjs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [itemId, setItemId] = useState("");
    const [categoryDetached, setCategoryDetached] = useState(false);
    const [detachedCategoryName, setDetachedCategoryName] = useState("");
    const [available, setAvailable] = useState("0");
    const [openItemPicker, setOpenItemPicker] = useState(false);
    const [openCategoryPicker, setOpenCategoryPicker] = useState(false);
    const initialSnapshotRef = useRef(null);

    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                setLoading(true);
                setError("");
                const [itemsData, categoryPage] = await Promise.all([
                    listAllItems(authFetch, {sort: "name,asc"}),
                    listCategories(authFetch, {page: 0, size: 200, sort: "name,asc"}),
                ]);
                if (ignore) return;

                const safeItems = Array.isArray(itemsData) ? itemsData : [];
                const safeCatObjs = Array.isArray(categoryPage?.content) ? categoryPage.content : [];
                const safeCategories = safeCatObjs.map((c) => c?.name).filter(Boolean);
                setItems(safeItems);
                setCatObjs(safeCatObjs);
                setCategories(Array.from(new Set(safeCategories)).sort((a, b) => a.localeCompare(b)));

                if (isEdit) {
                    const current = await getInventory(authFetch, routeItemId);
                    setCode(current.code);
                    setItemId(current.itemId);
                    setCategoryDetached(Boolean(current.categoryDetached));
                    setDetachedCategoryName(current.detachedCategoryName || "");
                    setAvailable(String(current.available ?? 0));
                    initialSnapshotRef.current = {
                        code: current.code || "",
                        itemId: current.itemId || "",
                        categoryDetached: Boolean(current.categoryDetached),
                        detachedCategoryName: current.detachedCategoryName || "",
                        available: String(current.available ?? 0),
                    };
                } else {
                    const nextCode = await getNextInventoryCode(authFetch);
                    setCode(nextCode);
                    initialSnapshotRef.current = {
                        code: nextCode,
                        itemId: "",
                        categoryDetached: false,
                        detachedCategoryName: "",
                        available: "0",
                    };
                }
            } catch (e) {
                if (!ignore) {
                    setError(e?.message || "Failed to load inventory form data.");
                }
            } finally {
                if (!ignore) {
                    setLoading(false);
                }
            }
        })();
        return () => {
            ignore = true;
        };
    }, [authFetch, isEdit, routeItemId]);

    const selectedItem = useMemo(
        () => items.find((it) => (it?.code || it?.id) === itemId) || null,
        [items, itemId]
    );
    const itemCategoryName = selectedItem?.categoryName || "";
    const effectiveCategory = categoryDetached ? detachedCategoryName : itemCategoryName;
    const uom = selectedItem?.uomBase || "";
    const availableNumber = Number(String(available).trim());
    const detachedCategoryOptions = useMemo(() => {
        const base = categories.slice();
        if (detachedCategoryName && !base.includes(detachedCategoryName)) base.push(detachedCategoryName);
        return base.sort((a, b) => a.localeCompare(b));
    }, [categories, detachedCategoryName]);

    const errors = useMemo(() => {
        const list = [];
        if (!code.trim()) list.push("Inventory code is required.");
        if (!selectedItem) list.push("Item selection is required.");
        if (!effectiveCategory?.trim()) list.push("Category is required.");
        if (!String(available).trim()) list.push("Available quantity is required.");
        if (!Number.isFinite(availableNumber)) list.push("Available quantity must be a valid number.");
        return list;
    }, [available, availableNumber, code, effectiveCategory, selectedItem]);

    const makeSnapshot = () => ({
        code,
        itemId,
        categoryDetached,
        detachedCategoryName: detachedCategoryName.trim(),
        available: String(available).trim(),
    });

    const dirty = useMemo(() => {
        if (!initialSnapshotRef.current) return false;
        return JSON.stringify(makeSnapshot()) !== JSON.stringify(initialSnapshotRef.current);
    }, [code, itemId, categoryDetached, detachedCategoryName, available]);

    useEffect(() => {
        const beforeUnload = (e) => {
            if (!dirty) return;
            e.preventDefault();
            e.returnValue = "";
            return "";
        };
        window.addEventListener("beforeunload", beforeUnload);
        return () => window.removeEventListener("beforeunload", beforeUnload);
    }, [dirty]);

    const canSave = !saving && !loading && errors.length === 0;

    const handleSave = async () => {
        if (!canSave || !selectedItem) return;
        try {
            setSaving(true);
            setError("");
            const payload = {
                code,
                itemId: selectedItem.code || selectedItem.id,
                itemName: selectedItem.name,
                itemCategoryName,
                categoryDetached,
                detachedCategoryName: categoryDetached ? detachedCategoryName : "",
                uom,
                available: availableNumber,
            };

            if (isEdit) {
                await updateInventory(authFetch, routeItemId, payload);
            } else {
                await createInventory(authFetch, payload);
            }

            initialSnapshotRef.current = makeSnapshot();
            navigate("/inventory");
        } catch (e) {
            setError(e?.message || "Failed to save inventory item.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto px-4 py-10 text-slate-500 dark:text-gray-400">
                Loading inventory details...
            </div>
        );
    }

    return (
        <div className="relative text-slate-900 dark:text-gray-200 min-h-screen">
            <div
                className={classNames(
                    "pointer-events-none fixed inset-0 -z-10",
                    "bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950",
                    "dark:sm:bg-gradient-to-br dark:sm:from-gray-950 dark:sm:via-gray-900 dark:sm:to-gray-950",
                    "dark:md:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:md:from-gray-950 dark:md:via-gray-900 dark:md:to-gray-950",
                    "dark:lg:bg-gradient-to-tr dark:lg:from-gray-950 dark:lg:via-gray-900 dark:lg:to-gray-950"
                )}
            />

            <header className="mx-auto px-4 pt-8 md:pt-10 pb-4 md:pb-6">
                <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                            {isEdit ? "Edit Inventory" : "New Inventory"}
                        </h1>
                        <p className="mt-1 md:mt-2 text-slate-500 dark:text-gray-400 text-sm md:text-base">
                            Maintain stock balance for an item, with optional detached category override.
                        </p>
                    </div>
                    <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleSave}
                            disabled={!canSave}
                            className="w-28 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm flex-1 sm:flex-none"
                        >
                            {saving ? "Saving..." : "Save"}
                        </button>
                        <button
                            onClick={() => navigate("/inventory")}
                            className="w-28 px-4 py-2 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 border border-slate-200 dark:border-white/10 rounded-lg text-sm flex-1 sm:flex-none"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </header>

            {error && (
                <div className="mx-auto px-4 mb-4">
                    <div className="rounded-xl border border-red-500/40 bg-red-950/40 text-red-200 px-4 py-3 text-sm">
                        {error}
                    </div>
                </div>
            )}

            <section className="mx-auto px-4 pb-[112px] md:pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">General</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Inventory Code</label>
                                <input
                                    value={code}
                                    readOnly
                                    className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm font-mono opacity-80 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Available</label>
                                <input
                                    inputMode="decimal"
                                    value={available}
                                    onChange={(e) => setAvailable(e.target.value)}
                                    className={classNames(
                                        "w-full rounded-lg bg-slate-100 dark:bg-gray-800 border px-3 py-2 text-sm text-right font-mono tabular-nums",
                                        !String(available).trim() || !Number.isFinite(availableNumber)
                                            ? "border-red-500/60"
                                            : "border-slate-200 dark:border-white/10"
                                    )}
                                    placeholder="0"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Item</label>
                                <div className="flex gap-2">
                                    <input
                                        value={itemId}
                                        readOnly
                                        className={classNames(
                                            "w-full rounded-lg bg-slate-100 dark:bg-gray-800 border px-3 py-2 text-sm font-mono",
                                            !selectedItem ? "border-red-500/60" : "border-slate-200 dark:border-white/10"
                                        )}
                                        placeholder="Select item..."
                                    />
                                    <button
                                        onClick={() => setOpenItemPicker(true)}
                                        className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-gray-700 text-sm whitespace-nowrap"
                                    >
                                        Pick
                                    </button>
                                </div>
                                {selectedItem ? (
                                    <p className="mt-1 text-xs text-slate-600 dark:text-gray-500">
                                        {selectedItem.name || "Unnamed"} • Category: {selectedItem.categoryName || "-"} • UoM: {uom || "-"}
                                    </p>
                                ) : (
                                    <p className="mt-1 text-xs text-red-400">Item selection is required.</p>
                                )}
                            </div>

                            <div className="sm:col-span-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-gray-900/40 p-3">
                                <label className="inline-flex items-center gap-2 text-sm mb-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!categoryDetached}
                                        onChange={(e) => setCategoryDetached(!e.target.checked)}
                                    />
                                    <span>Use Item Category by default</span>
                                </label>

                                {!categoryDetached ? (
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Category (from Item)</label>
                                        <input
                                            value={itemCategoryName}
                                            readOnly
                                            className={classNames(
                                                "w-full rounded-lg bg-slate-100 dark:bg-gray-800 border px-3 py-2 text-sm",
                                                !itemCategoryName ? "border-red-500/60" : "border-slate-200 dark:border-white/10"
                                            )}
                                            placeholder="Select item to populate"
                                        />
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Detached Category</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={detachedCategoryName}
                                                onChange={(e) => setDetachedCategoryName(e.target.value)}
                                                className={classNames(
                                                    "w-full rounded-lg bg-slate-100 dark:bg-gray-800 border px-3 py-2 text-sm",
                                                    !detachedCategoryName.trim() ? "border-red-500/60" : "border-slate-200 dark:border-white/10"
                                                )}
                                            >
                                                <option value="">Select category...</option>
                                                {detachedCategoryOptions.map((name) => (
                                                    <option key={name} value={name}>{name}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={() => setOpenCategoryPicker(true)}
                                                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-gray-700 text-sm whitespace-nowrap"
                                            >
                                                Pick / Manage
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {errors.length > 0 && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
                            <div className="font-semibold text-red-300 mb-2">Please fix the following</div>
                            <ul className="list-disc pl-5 space-y-1 text-red-200">
                                {errors.map((entry, i) => (
                                    <li key={i}>{entry}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Attachments</h2>
                        <div className="text-sm text-slate-500 dark:text-gray-400">Upload drawings/specs later. (Placeholder)</div>
                    </div>
                </div>

                <aside className="lg:sticky lg:top-6 space-y-4">
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-4">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Summary</h3>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl bg-slate-100/70 dark:bg-gray-800/60 p-3 border border-slate-200 dark:border-white/10">
                                <div className="text-xs text-slate-500 dark:text-gray-400">Mode</div>
                                <div className="text-lg font-semibold">{isEdit ? "Edit" : "Create"}</div>
                            </div>
                            <div className="rounded-xl bg-slate-100/70 dark:bg-gray-800/60 p-3 border border-slate-200 dark:border-white/10">
                                <div className="text-xs text-slate-500 dark:text-gray-400">Category Source</div>
                                <div className="text-lg font-semibold">{categoryDetached ? "Detached" : "From Item"}</div>
                            </div>
                            <div className="rounded-xl bg-slate-100/70 dark:bg-gray-800/60 p-3 border border-slate-200 dark:border-white/10 col-span-2">
                                <div className="text-xs text-slate-500 dark:text-gray-400">Item</div>
                                <div className="text-sm min-h-[20px]">
                                    {selectedItem
                                        ? `${selectedItem.code || selectedItem.id} - ${selectedItem.name || "Unnamed"}`
                                        : <span className="text-slate-500 dark:text-gray-500">(not selected)</span>}
                                </div>
                            </div>
                            <div className="rounded-xl bg-slate-100/70 dark:bg-gray-800/60 p-3 border border-slate-200 dark:border-white/10">
                                <div className="text-xs text-slate-500 dark:text-gray-400">UoM</div>
                                <div className="text-lg font-semibold">{uom || "-"}</div>
                            </div>
                            <div className="rounded-xl bg-slate-100/70 dark:bg-gray-800/60 p-3 border border-slate-200 dark:border-white/10">
                                <div className="text-xs text-slate-500 dark:text-gray-400">Available</div>
                                <div className="text-lg font-semibold font-mono tabular-nums">
                                    {Number.isFinite(availableNumber) ? availableNumber : "-"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-4 text-xs text-slate-500 dark:text-gray-400">
                        <div className="font-semibold text-slate-700 dark:text-gray-300 mb-2">Tips</div>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Keep default category attached unless you intentionally need an override.</li>
                            <li>Available can be positive, zero, or negative based on adjustments.</li>
                            <li>Selecting another item updates category and UoM context.</li>
                        </ul>
                    </div>
                </aside>
            </section>

            <div
                className="fixed md:hidden bottom-0 inset-x-0 z-30 border-t border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/80"
                style={{paddingBottom: "env(safe-area-inset-bottom)"}}
            >
                <div className="px-4 py-3 flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        disabled={!canSave}
                        className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm"
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                        onClick={() => navigate("/inventory")}
                        className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 text-sm"
                    >
                        Cancel
                    </button>
                </div>
            </div>

            <ItemPickerModal
                open={openItemPicker}
                onClose={() => setOpenItemPicker(false)}
                items={items}
                onPick={(it) => {
                    const codeValue = it?.code || it?.id || "";
                    setItemId(codeValue);
                    setOpenItemPicker(false);
                }}
            />

            <CategoryPickerModal
                open={openCategoryPicker}
                onClose={() => setOpenCategoryPicker(false)}
                categories={categories}
                onPick={(name) => {
                    setCategoryDetached(true);
                    setDetachedCategoryName(name);
                    setOpenCategoryPicker(false);
                }}
                onCreate={async (name) => {
                    try {
                        const created = await apiCreateCategory(authFetch, name);
                        setCatObjs((prev) => [...prev, created]);
                        setCategories((prev) => {
                            const exists = prev.some((c) => c.toLowerCase() === created.name.toLowerCase());
                            return (exists ? prev : [...prev, created.name]).sort((a, b) => a.localeCompare(b));
                        });
                        setCategoryDetached(true);
                        setDetachedCategoryName(created.name);
                        return true;
                    } catch (e) {
                        alert(e?.message || "Failed to create category");
                        return false;
                    }
                }}
                onRename={async (from, to) => {
                    try {
                        const match = catObjs.find((c) => String(c?.name || "").toLowerCase() === from.toLowerCase());
                        if (!match?.id) throw new Error("Category id not found");
                        const renamed = await apiRenameCategory(authFetch, match.id, to);
                        setCatObjs((prev) => prev.map((c) => (c.id === renamed.id ? renamed : c)));
                        setCategories((prev) => prev.map((c) => (c === from ? renamed.name : c)).sort((a, b) => a.localeCompare(b)));
                        if (detachedCategoryName === from) setDetachedCategoryName(renamed.name);
                        return true;
                    } catch (e) {
                        alert(e?.message || "Failed to rename category");
                        return false;
                    }
                }}
                onDelete={async (name) => {
                    if (!window.confirm(`Delete category "${name}"? This cannot be undone.`)) return false;
                    try {
                        const match = catObjs.find((c) => String(c?.name || "").toLowerCase() === name.toLowerCase());
                        if (!match?.id) throw new Error("Category id not found");
                        await apiDeleteCategory(authFetch, match.id, false);
                        setCatObjs((prev) => prev.filter((c) => c.id !== match.id));
                        setCategories((prev) => prev.filter((c) => c !== name));
                        if (detachedCategoryName === name) setDetachedCategoryName("");
                        return true;
                    } catch (e) {
                        alert(e?.message || "Failed to delete category");
                        return false;
                    }
                }}
            />
        </div>
    );
}

export {InventoryDetailsPage};
