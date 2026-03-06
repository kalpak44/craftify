import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useAuthFetch} from "../hooks/useAuthFetch";
import {getBom, createBom, updateBom} from "../api/boms";
import {listItems} from "../api/items";

/**
 * BOMDetailsPage — React + Tailwind (Mobile-friendly UX + Responsive, Fixed Background Gradient)
 *
 * Purpose:
 * - Create/edit a simplified BOM with Save actions.
 * - Mobile UX upgrades: sticky bottom action bar, mobile card editor, full-screen modals, stacked header actions.
 * - Responsive background gradient that never “runs out” on tall pages:
 *   - Implemented as a fixed, full-viewport background layer behind content.
 *   - Breakpoint-adaptive directions (b, br, radial at md, tr at lg).
 * - No external libraries, mock data only, ready to paste into a Vite + Tailwind project.
 */

// ---- Mocked item master ----
const MOCK_ITEMS = [
    {id: "ITM-001", name: "Tomato Sauce", uom: "kg", status: "Active"},
    {id: "ITM-002", name: "Mozzarella", uom: "kg", status: "Active"},
    {id: "ITM-003", name: "Fresh Basil", uom: "g", status: "Active"},
    {id: "ITM-004", name: "Pizza Dough Ball", uom: "pcs", status: "Active"},
    {id: "ITM-005", name: "Extra Virgin Olive Oil", uom: "L", status: "Active"},
    {id: "ITM-006", name: "Chicken Breast", uom: "kg", status: "Active"},
    {id: "ITM-008", name: "Parmesan Cheese", uom: "kg", status: "Active"},
    {id: "ITM-010", name: "Dry Pasta", uom: "kg", status: "Active"},
    {id: "ITM-011", name: "Margherita Pizza", uom: "pcs", status: "Active"},
    {id: "ITM-012", name: "Chicken Parmesan Pasta", uom: "pcs", status: "Active"},
];

const nextId = (() => {
    let n = 11; // pretend last was BOM-010
    return () => `BOM-${String(n++).padStart(3, "0")}`;
})();

const emptyRow = () => ({
    key: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2),
    itemId: "",
    qty: "",
    uom: "",
    notes: "",
});

// ---------- Utilities ----------
function classNames(...a) {
    return a.filter(Boolean).join(" ");
}

// ---------- Modal ----------
function Modal({open, onClose, title, children, footer}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
            <div className="absolute inset-0 flex items-center justify-center p-0 md:p-4">
                <div
                    className="w-full h-full md:h-auto md:max-h-[85vh] md:max-w-3xl overflow-hidden
                     rounded-none md:rounded-2xl border border-slate-200 dark:border-white/10 md:bg-white dark:bg-gray-900 bg-white dark:bg-gray-900 text-slate-900 dark:text-gray-200 shadow-2xl"
                >
                    <div className="px-4 md:px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
                        <h3 className="text-base md:text-lg font-semibold">{title}</h3>
                        <button onClick={onClose}
                                className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:text-gray-200 text-xl leading-none">&times;</button>
                    </div>
                    <div className="p-4 md:p-5 h-[calc(100%-112px)] md:h-auto overflow-y-auto">{children}</div>
                    <div
                        className="px-4 md:px-5 py-4 border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 flex items-center justify-end gap-2">
                        {footer}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------- Item Picker Modal ----------
function ItemPickerModal({open, onClose, onPick, items, title = "Select Item"}) {
    const [q, setQ] = useState("");
    const filtered = useMemo(() => {
        const qq = q.toLowerCase();
        return items.filter(it =>
            it.id.toLowerCase().includes(qq) ||
            it.name.toLowerCase().includes(qq) ||
            it.uom.toLowerCase().includes(qq) ||
            it.status.toLowerCase().includes(qq)
        );
    }, [q, items]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
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
                    onChange={e => setQ(e.target.value)}
                    placeholder="Search by ID, name, UoM, status"
                    className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                />
            </div>

            {/* Mobile: cards; Desktop: table */}
            <div className="space-y-2 md:hidden">
                {filtered.map(it => (
                    <div key={it.id} className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-3">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <div className="font-mono text-sm text-gray-100">{it.id}</div>
                                <div className="text-sm text-slate-700 dark:text-gray-300">{it.name}</div>
                                <div className="text-xs text-slate-600 dark:text-gray-500 mt-1">UoM: {it.uom} • Status: {it.status}</div>
                            </div>
                            <button
                                onClick={() => onPick(it)}
                                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-gray-700 text-sm whitespace-nowrap"
                            >
                                Use
                            </button>
                        </div>
                    </div>
                ))}
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
                        <th className="px-4 py-3 text-left">UoM</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                    {filtered.map(it => (
                        <tr key={it.id} className="hover:bg-slate-100/60 dark:hover:bg-gray-800/40">
                            <td className="px-4 py-3 font-mono">{it.id}</td>
                            <td className="px-4 py-3">{it.name}</td>
                            <td className="px-4 py-3">{it.uom}</td>
                            <td className="px-4 py-3">{it.status}</td>
                            <td className="px-4 py-3 text-right">
                                <button
                                    onClick={() => onPick(it)}
                                    className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-gray-700"
                                >
                                    Use Item
                                </button>
                            </td>
                        </tr>
                    ))}
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

// ---------- Page ----------
export default function BOMDetailsPage() {
    const navigate = useNavigate();
    const {id: routeId} = useParams();
    const authFetch = useAuthFetch();

    // ---- Form state ----
    const isEdit = !!routeId;
    const [bomId, setBomId] = useState(isEdit ? routeId : "");
    const [parentItemId, setParentItemId] = useState("");
    const [revision, setRevision] = useState("v1");
    const [status, setStatus] = useState("Draft");
    const [description, setDescription] = useState("");
    const [rows, setRows] = useState([emptyRow()]);

    // Backend integration state
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [version, setVersion] = useState(null);

    // ---- Modals ----
    const [openParentPicker, setOpenParentPicker] = useState(false);
    const [openComponentPicker, setOpenComponentPicker] = useState({open: false, rowKey: null});

    // ---- Derived ----
    // Items for pickers (from backend)
    const [items, setItems] = useState([]);
    useEffect(() => {
        let ignore = false;
        (async () => {
            try {
                const page = await listItems(authFetch, { page: 0, size: 200, sort: "name,asc" });
                if (ignore) return;
                const mapped = (page?.content || []).map(it => ({
                    id: it.id || it.code || "",
                    name: it.name || "",
                    uom: it.uomBase || "",
                    status: it.status || "",
                }));
                setItems(mapped);
            } catch (e) {
                // silent fallback: keep items empty
            }
        })();
        return () => { ignore = true; };
    }, [authFetch]);

    const parentItem = useMemo(() => items.find(i => i.id === parentItemId) || null, [parentItemId, items]);
    const componentsCount = rows.filter(r => r.itemId && Number(r.qty) > 0).length;

    // ---- Validation ----
    const errors = useMemo(() => {
        const list = [];
        if (!parentItemId) list.push("Parent Item is required.");
        // For new BOMs, ID can be generated by backend; only require in edit when route-bound
        if (isEdit && !bomId) list.push("BOM ID is required.");

        const validRows = rows.filter(r => r.itemId || r.qty || r.uom || r.notes);
        if (validRows.length === 0) list.push("Add at least one component.");

        validRows.forEach((r, idx) => {
            if (!r.itemId) list.push(`Row ${idx + 1}: Component item required.`);
            if (!r.qty || Number(r.qty) <= 0) list.push(`Row ${idx + 1}: Quantity must be > 0.`);
            if (!r.uom) list.push(`Row ${idx + 1}: UoM required.`);
            if (r.itemId && r.itemId === parentItemId) list.push(`Row ${idx + 1}: Component cannot equal the parent item.`);
        });

        return list;
    }, [parentItemId, bomId, rows]);

    // ---- Change tracking (since open) ----
    const initialSnapshotRef = useRef(null);
    const makeSnapshot = () => JSON.stringify({bomId, parentItemId, revision, status, description, rows});
    useEffect(() => {
        if (initialSnapshotRef.current == null) {
            initialSnapshotRef.current = makeSnapshot();
        }
    }, []);
    const hasChanges = useMemo(() => {
        const cur = makeSnapshot();
        return initialSnapshotRef.current !== cur;
    }, [bomId, parentItemId, revision, status, description, rows]);

    // ---- beforeunload guard ----
    useEffect(() => {
        const beforeUnload = (e) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = "";
                return "";
            }
        };
        window.addEventListener("beforeunload", beforeUnload);
        return () => window.removeEventListener("beforeunload", beforeUnload);
    }, [hasChanges]);

    // ---- Load existing BOM (edit) ----
    useEffect(() => {
        if (!isEdit) return;
        let ignore = false;
        (async () => {
            try {
                setLoading(true);
                setError("");
                const d = await getBom(authFetch, routeId);
                if (ignore) return;
                setBomId(d.id || routeId);
                setParentItemId(d.productId || "");
                setRevision(d.revision || "v1");
                // Backend enum is Draft|Active|Hold|Obsolite
                setStatus(d.status || "Draft");
                setDescription(d.description || "");
                const comps = Array.isArray(d.components) ? d.components : [];
                setRows(
                    comps.length
                        ? comps.map((c) => ({
                            key: (crypto.randomUUID?.() || String(Math.random()).slice(2)),
                            itemId: c.itemId || "",
                            qty: c.quantity != null ? String(c.quantity) : "",
                            uom: c.uom || "",
                            notes: c.note || "",
                        }))
                        : [emptyRow()]
                );
                setVersion(typeof d.version === "number" ? d.version : 0);
                // reset dirty snapshot after load
                initialSnapshotRef.current = JSON.stringify({
                    bomId: d.id || routeId,
                    parentItemId: d.productId || "",
                    revision: d.revision || "v1",
                    status: d.status || "Draft",
                    description: d.description || "",
                    rows: comps.length
                        ? comps.map((c) => ({
                            key: "__", // keys are ignored in snapshot
                            itemId: c.itemId || "",
                            qty: c.quantity != null ? String(c.quantity) : "",
                            uom: c.uom || "",
                            notes: c.note || "",
                        }))
                        : [emptyRow()],
                });
            } catch (e) {
                if (!ignore) setError(e?.message || "Failed to load BOM");
            } finally {
                if (!ignore) setLoading(false);
            }
        })();
        return () => { ignore = true; };
    }, [isEdit, routeId, authFetch]);

    // ---- Row ops ----
    const addRow = () => setRows(rs => [...rs, emptyRow()]);
    const removeRow = (key) => setRows(rs => rs.filter(r => r.key !== key));
    const cloneRow = (key) => setRows(rs => {
        const idx = rs.findIndex(r => r.key === key);
        if (idx === -1) return rs;
        const nr = {...rs[idx], key: (crypto.randomUUID?.() || String(Math.random()).slice(2))};
        return [...rs.slice(0, idx + 1), nr, ...rs.slice(idx + 1)];
    });
    const updateRow = (key, patch) => setRows(rs => rs.map(r => (r.key === key ? {...r, ...patch} : r)));

    // ---- Actions ----
    const BTN_W = "w-28";
    const handleSave = async () => {
        // basic validation already in errors; block if errors
        if (errors.length > 0) return;
        try {
            setSaving(true);
            setError("");
            // map rows -> components
            const components = rows
                .filter((r) => r.itemId || r.qty || r.uom || r.notes)
                .map((r) => ({
                    itemId: r.itemId,
                    quantity: r.qty ? Number(r.qty) : null,
                    uom: r.uom,
                    note: r.notes || null,
                }));
            const payload = {
                id: bomId || undefined,
                productId: parentItemId,
                // Persist the parent item name so the BOM list can render it immediately
                productName: parentItem ? parentItem.name : undefined,
                revision,
                status,
                description: description || null,
                note: null,
                components,
            };
            if (isEdit) {
                const updated = await updateBom(authFetch, bomId, payload, version ?? 0);
                setVersion(typeof updated.version === "number" ? updated.version : (version ?? 0) + 1);
            } else {
                const created = await createBom(authFetch, payload);
                setVersion(typeof created.version === "number" ? created.version : 0);
            }
            navigate("/boms");
        } catch (e) {
            setError(e?.message || "Failed to save BOM");
        } finally {
            setSaving(false);
        }
    };
    return (
        <div className="relative text-slate-900 dark:text-gray-200 min-h-screen">
            {/* Fixed, full-viewport responsive gradient layer (prevents partial coverage on tall pages) */}
            <div
                className={classNames(
                    "pointer-events-none fixed inset-0 -z-10",
                    "bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950",
                    "dark:sm:bg-gradient-to-br dark:sm:from-gray-950 dark:sm:via-gray-900 dark:sm:to-gray-950",
                    "dark:md:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:md:from-gray-950 dark:md:via-gray-900 dark:md:to-gray-950",
                    "dark:lg:bg-gradient-to-tr dark:lg:from-gray-950 dark:lg:via-gray-900 dark:lg:to-gray-950"
                )}
            />

            {/* Header */}
            <header className="mx-auto px-4 pt-8 md:pt-10 pb-4 md:pb-6">
                <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">New BOM</h1>
                        <p className="mt-1 md:mt-2 text-slate-500 dark:text-gray-400 text-sm md:text-base">Create a bill of materials — save
                            when ready.</p>
                    </div>
                    <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                        <button
                            onClick={handleSave}
                            className={classNames(
                                BTN_W,
                                "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex-1 sm:flex-none"
                            )}
                        >
                            Save
                        </button>
                    </div>
                </div>

                {/* Unsaved banner */}
                <div
                    className="mt-3 md:mt-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 px-3 md:px-4 py-3 text-sm flex items-center gap-3">
                    <span
                        className={`inline-flex h-2 w-2 rounded-full ${hasChanges ? "bg-yellow-400" : "bg-green-400"}`}/>
                    <span className="text-slate-700 dark:text-gray-300 truncate">
            {hasChanges ? "You have unsaved changes" : "No changes since open"}
          </span>
                    <span className="ml-auto text-xs text-slate-600 dark:text-gray-500">
            BOM ID: <span className="font-mono text-slate-700 dark:text-gray-300">{bomId}</span>
          </span>
                </div>
            </header>

            {/* Content */}
            <section className="mx-auto px-4 pb-[112px] md:pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left: form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General */}
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">General</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Parent Item */}
                            <div>
                                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Parent Item / Finished Good</label>
                                <div className="flex gap-2">
                                    <input
                                        value={parentItemId}
                                        onChange={(e) => setParentItemId(e.target.value)}
                                        placeholder="e.g. ITM-006"
                                        className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                                    />
                                    <button
                                        onClick={() => setOpenParentPicker(true)}
                                        className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-gray-700 text-sm"
                                    >
                                        Pick
                                    </button>
                                </div>
                                {parentItem && (
                                    <p className="mt-1 text-xs text-slate-600 dark:text-gray-500">
                                        {parentItem.name} • UoM: {parentItem.uom} • Status: {parentItem.status}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">BOM ID</label>
                                <input
                                    value={bomId}
                                    readOnly
                                    aria-readonly="true"
                                    placeholder={isEdit ? undefined : "Will be generated"}
                                    className="w-full rounded-lg bg-slate-100/70 dark:bg-gray-800/70 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm cursor-not-allowed text-slate-700 dark:text-gray-300"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Revision</label>
                                <input
                                    value={revision}
                                    onChange={(e) => setRevision(e.target.value)}
                                    className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                                >
                                    <option>Draft</option>
                                    <option>Active</option>
                                    <option>Hold</option>
                                    <option>Obsolite</option>
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs text-slate-500 dark:text-gray-400 mb-1">Description / Notes</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                                    placeholder="Optional, visible on BOM details and shop traveler."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Components */}
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Components</h2>
                            <button
                                onClick={addRow}
                                className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-gray-700 text-sm"
                            >
                                + Add Row
                            </button>
                        </div>

                        {/* Mobile: Card list */}
                        <div className="space-y-3 md:hidden">
                            {rows.map((r) => {
                                const it = items.find(i => i.id === r.itemId);
                                const rowErrors = {
                                    itemId: !r.itemId,
                                    qty: !r.qty || Number(r.qty) <= 0,
                                    uom: !r.uom,
                                    sameAsParent: r.itemId && r.itemId === parentItemId,
                                };
                                return (
                                    <div key={r.key} className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-gray-900/40 p-3">
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1 space-y-2">
                                                {/* Item */}
                                                <div>
                                                    <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1">Component
                                                        Item</label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            value={r.itemId}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const selectedItem = items.find(i => i.id === val);
                                                                updateRow(r.key, {
                                                                    itemId: val,
                                                                    uom: selectedItem ? selectedItem.uom : r.uom
                                                                });
                                                            }}
                                                            placeholder="e.g. ITM-003"
                                                            className={classNames(
                                                                "w-full rounded-lg bg-slate-100 dark:bg-gray-800 px-3 py-2 text-sm border",
                                                                rowErrors.itemId ? "border-red-500/60" : "border-slate-200 dark:border-white/10"
                                                            )}
                                                        />
                                                        <button
                                                            onClick={() => setOpenComponentPicker({
                                                                open: true,
                                                                rowKey: r.key
                                                            })}
                                                            className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-gray-700 text-sm"
                                                        >
                                                            Pick
                                                        </button>
                                                    </div>
                                                    {it && (
                                                        <div className="text-xs text-slate-600 dark:text-gray-500 mt-1">
                                                            {it.name} • Default UoM: {it.uom} • Status: {it.status}
                                                        </div>
                                                    )}
                                                    {rowErrors.sameAsParent && (
                                                        <div className="text-xs text-red-400 mt-1">Component cannot
                                                            equal parent item.</div>
                                                    )}
                                                </div>

                                                {/* Qty & UoM */}
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <label className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1">Qty / 1
                                                            pc</label>
                                                        <input
                                                            inputMode="decimal"
                                                            value={r.qty}
                                                            onChange={(e) => updateRow(r.key, {qty: e.target.value})}
                                                            placeholder="0"
                                                            className={classNames(
                                                                "w-full rounded-lg bg-slate-100 dark:bg-gray-800 border px-3 py-2 text-sm",
                                                                rowErrors.qty ? "border-red-500/60" : "border-slate-200 dark:border-white/10"
                                                            )}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label
                                                            className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1">UoM</label>
                                                        <input
                                                            value={r.uom}
                                                            onChange={(e) => updateRow(r.key, {uom: e.target.value})}
                                                            placeholder={it ? it.uom : "e.g. pcs"}
                                                            className={classNames(
                                                                "w-full rounded-lg bg-slate-100 dark:bg-gray-800 border px-3 py-2 text-sm",
                                                                rowErrors.uom ? "border-red-500/60" : "border-slate-200 dark:border-white/10"
                                                            )}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Notes */}
                                                <div>
                                                    <label
                                                        className="block text-[11px] text-slate-500 dark:text-gray-400 mb-1">Notes</label>
                                                    <input
                                                        value={r.notes}
                                                        onChange={(e) => updateRow(r.key, {notes: e.target.value})}
                                                        placeholder="Optional notes"
                                                        className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                                                    />
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={() => cloneRow(r.key)}
                                                    title="Clone row"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium
                                     bg-slate-100/70 dark:bg-gray-800/60 border-slate-200 dark:border-white/10 text-slate-900 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-gray-700/60"
                                                >
                                                    Clone
                                                </button>
                                                <button
                                                    onClick={() => removeRow(r.key)}
                                                    title="Remove row"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium
                                     bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20 hover:text-red-200"
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
                            className="hidden md:block overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl bg-slate-100/70 dark:bg-gray-900/40">
                            <table className="min-w-full divide-y divide-gray-800 text-sm">
                                <thead className="bg-slate-100/80 dark:bg-gray-900/80">
                                <tr>
                                    <th className="px-4 py-3 text-left">Component Item</th>
                                    <th className="px-4 py-3 text-left">Qty / 1 pc</th>
                                    <th className="px-4 py-3 text-left">UoM</th>
                                    <th className="px-4 py-3 text-left">Notes</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {rows.map((r) => {
                                    const it = items.find(i => i.id === r.itemId);
                                    const rowErrors = {
                                        itemId: !r.itemId,
                                        qty: !r.qty || Number(r.qty) <= 0,
                                        uom: !r.uom,
                                        sameAsParent: r.itemId && r.itemId === parentItemId,
                                    };

                                    return (
                                        <tr key={r.key} className="hover:bg-slate-100/60 dark:hover:bg-gray-800/40 transition">
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex gap-2">
                                                        <input
                                                            value={r.itemId}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const selectedItem = MOCK_ITEMS.find(i => i.id === val);
                                                                updateRow(r.key, {
                                                                    itemId: val,
                                                                    uom: selectedItem ? selectedItem.uom : r.uom
                                                                });
                                                            }}
                                                            placeholder="e.g. ITM-003"
                                                            className={classNames(
                                                                "w-full rounded-lg bg-slate-100 dark:bg-gray-800 px-3 py-2 text-sm border",
                                                                rowErrors.itemId ? "border-red-500/60" : "border-slate-200 dark:border-white/10"
                                                            )}
                                                        />
                                                        <button
                                                            onClick={() => setOpenComponentPicker({
                                                                open: true,
                                                                rowKey: r.key
                                                            })}
                                                            className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-gray-700 text-sm whitespace-nowrap"
                                                        >
                                                            Pick
                                                        </button>
                                                    </div>
                                                    {it && (
                                                        <div className="text-xs text-slate-600 dark:text-gray-500">
                                                            {it.name} • Default UoM: {it.uom} • Status: {it.status}
                                                        </div>
                                                    )}
                                                    {rowErrors.sameAsParent && (
                                                        <div className="text-xs text-red-400">Component cannot equal
                                                            parent item.</div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    inputMode="decimal"
                                                    value={r.qty}
                                                    onChange={(e) => updateRow(r.key, {qty: e.target.value})}
                                                    placeholder="0"
                                                    className={classNames(
                                                        "w-28 rounded-lg bg-slate-100 dark:bg-gray-800 border px-3 py-2 text-sm",
                                                        rowErrors.qty ? "border-red-500/60" : "border-slate-200 dark:border-white/10"
                                                    )}
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    value={r.uom}
                                                    onChange={(e) => updateRow(r.key, {uom: e.target.value})}
                                                    placeholder={it ? it.uom : "e.g. pcs"}
                                                    className={classNames(
                                                        "w-28 rounded-lg bg-slate-100 dark:bg-gray-800 border px-3 py-2 text-sm",
                                                        rowErrors.uom ? "border-red-500/60" : "border-slate-200 dark:border-white/10"
                                                    )}
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    value={r.notes}
                                                    onChange={(e) => updateRow(r.key, {notes: e.target.value})}
                                                    placeholder="Optional notes"
                                                    className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        onClick={() => cloneRow(r.key)}
                                                        title="Clone row"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium
                                         bg-slate-100/70 dark:bg-gray-800/60 border-slate-200 dark:border-white/10 text-slate-900 dark:text-gray-200 hover:bg-slate-200 dark:hover:bg-gray-700/60"
                                                    >
                                                        Clone
                                                    </button>
                                                    <button
                                                        onClick={() => removeRow(r.key)}
                                                        title="Remove row"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium
                                         bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20 hover:text-red-200"
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

                        {/* Table footer helper */}
                        <div className="mt-3 text-xs text-slate-600 dark:text-gray-500 flex items-center justify-between flex-wrap gap-3">
                            <div className="hidden md:block">
                                Shortcuts: <span className="text-slate-700 dark:text-gray-300">Enter</span> add row • <span
                                className="text-slate-700 dark:text-gray-300">Ctrl/⌘+D</span> duplicate focused row • <span
                                className="text-slate-700 dark:text-gray-300">Delete</span> remove focused row
                            </div>
                            <div className="md:hidden">
                                Tip: Use the <span className="text-slate-700 dark:text-gray-300">Pick</span> button to search items quickly.
                            </div>
                            <div className="flex items-center gap-3">
                                {componentsCount === 0 ? (
                                    <span className="text-yellow-400">No valid components yet</span>
                                ) : (
                                    <span>Valid components: <span
                                        className="text-slate-700 dark:text-gray-300">{componentsCount}</span></span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Error summary */}
                    {errors.length > 0 && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
                            <div className="font-semibold text-red-300 mb-2">Please fix the following</div>
                            <ul className="list-disc pl-5 space-y-1 text-red-200">
                                {errors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        </div>
                    )}

                    {/* Attachments (placeholder) */}
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Attachments</h2>
                        <div className="text-sm text-slate-500 dark:text-gray-400">
                            Upload drawings/specs here in the future. (Placeholder)
                        </div>
                    </div>
                </div>

                {/* Right: sticky summary */}
                <aside className="lg:sticky lg:top-6 space-y-4">
                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-4">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">Summary</h3>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl bg-slate-100/70 dark:bg-gray-800/60 p-3 border border-slate-200 dark:border-white/10">
                                <div className="text-xs text-slate-500 dark:text-gray-400">Components</div>
                                <div className="text-lg font-semibold text-gray-100">{componentsCount}</div>
                            </div>
                            <div className="rounded-xl bg-slate-100/70 dark:bg-gray-800/60 p-3 border border-slate-200 dark:border-white/10">
                                <div className="text-xs text-slate-500 dark:text-gray-400">Status</div>
                                <div className="mt-1">
                                  <span
                                      className={classNames(
                                          "inline-block px-3 py-1 text-xs font-medium rounded-full",
                                          status === "Draft" && "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
                                          status === "Active" && "bg-green-500/20 text-green-300 border border-green-500/30",
                                          status === "Hold" && "bg-orange-500/20 text-orange-300 border border-orange-500/30",
                                          status === "Obsolite" && "bg-red-500/20 text-red-300 border border-red-500/30"
                                      )}
                                  >
                                    {status}
                                  </span>
                                </div>
                            </div>
                            <div className="rounded-2xl bg-slate-100/70 dark:bg-gray-800/60 p-3 border border-slate-200 dark:border-white/10 col-span-2">
                                <div className="text-xs text-slate-500 dark:text-gray-400">Parent Item</div>
                                <div className="text-sm text-slate-900 dark:text-gray-200 min-h-[20px]">
                                    {parentItem ? `${parentItem.id} — ${parentItem.name}` :
                                        <span className="text-slate-600 dark:text-gray-500">(not set)</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-4 text-xs text-slate-500 dark:text-gray-400">
                        <div className="font-semibold text-slate-700 dark:text-gray-300 mb-2">Tips</div>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Use the row “Pick” button to search and select component items.</li>
                            <li>Default UoM is prefilled from the selected component when available.</li>
                            <li>Keep notes concise and actionable.</li>
                        </ul>
                    </div>
                </aside>

            </section>

            {/* Sticky bottom action bar (mobile) */}
            <div
                className="fixed md:hidden bottom-0 inset-x-0 z-30 border-t border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-gray-900/60"
                style={{paddingBottom: "env(safe-area-inset-bottom)"}}
            >
                <div className="px-4 py-3 flex items-center gap-2">
                    <button
                        onClick={handleSave}
                        className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                        Save
                    </button>
                </div>
            </div>

            {/* Inline load/save states and errors */}
            {loading && (
                <div className="fixed top-2 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded bg-slate-100 dark:bg-gray-800/90 border border-slate-200 dark:border-white/10 text-sm">Loading BOM…</div>
            )}
            {saving && (
                <div className="fixed top-2 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded bg-blue-800/80 border border-slate-200 dark:border-white/10 text-sm">Saving…</div>
            )}
            {error && (
                <div className="fixed top-2 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded bg-red-800/80 border border-red-400/40 text-sm text-red-100 shadow">{error}</div>
            )}

            {/* Parent picker */}
            <ItemPickerModal
                open={openParentPicker}
                onClose={() => setOpenParentPicker(false)}
                title="Select Parent Item"
items={items}
                onPick={(it) => {
                    setParentItemId(it.id);
                    setOpenParentPicker(false);
                }}
            />

            {/* Component picker (targeted row) */}
            <ItemPickerModal
                open={openComponentPicker.open}
                onClose={() => setOpenComponentPicker({open: false, rowKey: null})}
                title="Select Component Item"
                items={items}
                onPick={(it) => {
                    if (openComponentPicker.rowKey) {
                        updateRow(openComponentPicker.rowKey, {itemId: it.id, uom: it.uom});
                    }
                    setOpenComponentPicker({open: false, rowKey: null});
                }}
            />
        </div>
    );
}

export {BOMDetailsPage};
