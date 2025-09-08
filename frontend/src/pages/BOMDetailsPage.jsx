import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";

/**
 * BOMCreationPage — React + Tailwind (aligned to WorkOrderDetails)
 *
 * Alignment items implemented:
 * - Modal shell matches WorkOrderDetails (title bar, footer area, backdrop behavior).
 * - Parent picker uses the same searchable, paginated ItemPickerModal pattern.
 * - Component picker per-row uses the same picker modal pattern (search + pagination).
 * - Compact, consistent buttons and borders across sections.
 * - Preserves BOM-specific features: release rate, yield %, scrap per component, cost & capacity modals.
 */

// ---- Mocked item master ----
const MOCK_ITEMS = [
    {id: "ITM-001", name: "Warm Yellow LED", uom: "pcs", status: "Active", cost: 0.12},
    {id: "ITM-002", name: "Large Widget", uom: "pcs", status: "Active", cost: 9.5},
    {id: "ITM-003", name: "Plastic Case", uom: "pcs", status: "Active", cost: 1.2},
    {id: "ITM-004", name: "Lion Bracket", uom: "pcs", status: "Active", cost: 2.1},
    {id: "ITM-005", name: "Chain Bracket", uom: "pcs", status: "Active", cost: 1.85},
    {id: "ITM-006", name: "Front Assembly", uom: "ea", status: "Active", cost: 0},
    {id: "ITM-007", name: "Steel Frame", uom: "pcs", status: "Active", cost: 7.2},
    {id: "ITM-008", name: "Blue Paint (RAL5010)", uom: "L", status: "Hold", cost: 14.0},
    {id: "ITM-009", name: "Screws M3×8", uom: "ea", status: "Active", cost: 0.03},
    {id: "ITM-010", name: "Assembly Kit 10", uom: "kit", status: "Discontinued", cost: 0},
];

// ---- Mock on-hand inventory (no lots/expiry) ----
const MOCK_STOCK = {
    "ITM-001": 12000,
    "ITM-002": 3000,
    "ITM-003": 6000,
    "ITM-004": 4000,
    "ITM-005": 4000,
    "ITM-007": 5,
    "ITM-008": 900,
    "ITM-009": 200,
    "ITM-010": 500,
};

const nextId = (() => {
    let n = 11; // pretend last was BOM-010
    return () => `BOM-${String(n++).padStart(3, "0")}`;
})();

const emptyRow = () => ({
    key: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2),
    itemId: "",
    qty: "",
    uom: "",
    scrap: "0",
    notes: "",
});

// ---------- Utilities ----------
function classNames(...a) {
    return a.filter(Boolean).join(" ");
}

// ---------- Toasts ----------
function Toast({type = "info", title, message, onClose}) {
    const colors = {
        success: "bg-emerald-700/20 border-emerald-500/40 text-emerald-100",
        error: "bg-red-700/20 border-red-500/40 text-red-100",
        warning: "bg-yellow-700/20 border-yellow-500/40 text-yellow-100",
        info: "bg-sky-700/20 border-sky-500/40 text-sky-100",
    };
    return (
        <div
            className={classNames("pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 shadow-lg", colors[type])}>
            <div className="flex items-start gap-3">
                <div className="font-semibold">{title}</div>
                <button onClick={onClose} className="ml-auto text-xs opacity-80 hover:opacity-100">Close</button>
            </div>
            {message && <div className="mt-1 text-sm opacity-90">{message}</div>}
        </div>
    );
}

function ToastHost({toasts, remove}) {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
            {toasts.map(t => (<Toast key={t.id} {...t} onClose={() => remove(t.id)}/>))}
        </div>
    );
}

// ---------- Aligned Modal + Pager (same shell as WorkOrderDetails) ----------
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
                <select value={pageSize} onChange={e => onPageSize(Number(e.target.value))}
                        className="bg-gray-800 border border-white/10 rounded px-2 py-1">
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

// ---------- Item Picker Modal (Parent/Component) ----------
function ItemPickerModal({open, onClose, onPick, items, title = "Select Item"}) {
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const filtered = useMemo(() => {
        const qq = q.toLowerCase();
        return items.filter(it =>
            it.id.toLowerCase().includes(qq) ||
            it.name.toLowerCase().includes(qq) ||
            it.uom.toLowerCase().includes(qq) ||
            it.status.toLowerCase().includes(qq)
        );
    }, [q, items]);

    const start = (page - 1) * pageSize;
    const pageRows = filtered.slice(start, start + pageSize);

    useEffect(() => {
        setPage(1);
    }, [q, pageSize, open]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            footer={
                <button onClick={onClose}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">
                    Close
                </button>
            }
        >
            <div className="mb-3">
                <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Search by ID, name, UoM, status"
                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                />
            </div>
            <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                <table className="min-w-full divide-y divide-gray-800 text-sm">
                    <thead className="bg-gray-900/80">
                    <tr>
                        <th className="px-4 py-3 text-left">Item</th>
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">UoM</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                    {pageRows.map(it => (
                        <tr key={it.id} className="hover:bg-gray-800/40">
                            <td className="px-4 py-3 font-mono">{it.id}</td>
                            <td className="px-4 py-3">{it.name}</td>
                            <td className="px-4 py-3">{it.uom}</td>
                            <td className="px-4 py-3">{it.status}</td>
                            <td className="px-4 py-3 text-right">
                                <button
                                    onClick={() => onPick(it)}
                                    className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">
                                    Use Item
                                </button>
                            </td>
                        </tr>
                    ))}
                    {pageRows.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-gray-400">No matches</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
            <Pager page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={setPageSize}/>
        </Modal>
    );
}

// ---------- Tiny atoms ----------
function EmptyState({title, subtitle, action}) {
    return (
        <div className="rounded-xl border border-dashed border-white/10 bg-gray-900/40 p-6 text-center">
            <div className="text-white font-semibold">{title}</div>
            <div className="text-gray-400 text-sm mt-1">{subtitle}</div>
            {action}
        </div>
    );
}

function Badge({children, tone = "default"}) {
    const tones = {
        default: "bg-gray-800/60 text-gray-200 border-white/10",
        warn: "bg-yellow-600/20 text-yellow-200 border-yellow-500/40",
        ok: "bg-emerald-600/20 text-emerald-200 border-emerald-500/40",
    };
    return <span
        className={classNames("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs border", tones[tone])}>{children}</span>;
}

// ---------- Page ----------
export default function BOMDetailsPage() {
    const navigate = useNavigate();

    // ---- Form state ----
    const [bomId, setBomId] = useState(nextId());
    const [parentItemId, setParentItemId] = useState("");
    const [revision, setRevision] = useState("v1");
    const [status, setStatus] = useState("Draft");
    const [effectiveDate, setEffectiveDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [description, setDescription] = useState("");

    const [rows, setRows] = useState([emptyRow()]);

    // Planning fields
    const [releaseRate, setReleaseRate] = useState(1000); // units per batch
    const [yieldPct, setYieldPct] = useState(95);         // finished-good yield %

    // Autosave state (fake)
    const [dirty, setDirty] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const saveTimer = useRef(null);

    // Toasts
    const [toasts, setToasts] = useState([]);
    const pushToast = (t) => setToasts(ts => [...ts, {id: (crypto.randomUUID?.() || String(Math.random()).slice(2)), ...t}]);
    const removeToast = (id) => setToasts(ts => ts.filter(x => x.id !== id));

    // Modals (cost, capacity)
    const [openCostModal, setOpenCostModal] = useState(false);
    const [openCapacityModal, setOpenCapacityModal] = useState(false);
    const [openConfirmLeave, setOpenConfirmLeave] = useState(false);

    // Aligned pickers
    const [openParentPicker, setOpenParentPicker] = useState(false);
    const [openComponentPicker, setOpenComponentPicker] = useState({open: false, rowKey: null});

    // ---- Derived helpers ----
    const parentItem = useMemo(() => MOCK_ITEMS.find(i => i.id === parentItemId) || null, [parentItemId]);
    const componentsCount = rows.filter(r => r.itemId && Number(r.qty) > 0).length;

    // ---- Validation ----
    const errors = useMemo(() => {
        const list = [];
        if (!parentItemId) list.push("Parent Item is required.");
        if (!bomId) list.push("BOM ID is required.");

        const validRows = rows.filter(r => r.itemId || r.qty || r.uom || r.notes || r.scrap);
        if (validRows.length === 0) list.push("Add at least one component.");

        validRows.forEach((r, idx) => {
            if (!r.itemId) list.push(`Row ${idx + 1}: Component item required.`);
            if (!r.qty || Number(r.qty) <= 0) list.push(`Row ${idx + 1}: Quantity must be > 0.`);
            if (!r.uom) list.push(`Row ${idx + 1}: UoM required.`);
            if (Number(r.scrap) < 0) list.push(`Row ${idx + 1}: Scrap % cannot be negative.`);
            if (r.itemId && r.itemId === parentItemId) list.push(`Row ${idx + 1}: Component cannot equal the parent item.`);
        });

        return list;
    }, [parentItemId, bomId, rows]);

    // ---- Autosave (fake) — NO toasts here ----
    const requestSave = () => {
        setDirty(true);
        if (saveTimer.current) window.clearTimeout(saveTimer.current);
        saveTimer.current = window.setTimeout(() => {
            setLastSavedAt(new Date());
            setDirty(false);
        }, 800);
    };
    useEffect(() => {
        requestSave();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parentItemId, bomId, revision, status, effectiveDate, description, rows, releaseRate, yieldPct]);

    // ---- Unsaved changes guard ----
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

    // ---- Row operations ----
    const addRow = () => setRows(rs => [...rs, emptyRow()]);
    const removeRow = (key) => setRows(rs => rs.filter(r => r.key !== key));
    const cloneRow = (key) => setRows(rs => {
        const idx = rs.findIndex(r => r.key === key);
        if (idx === -1) return rs;
        const nr = {
            ...rs[idx],
            key: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2)
        };
        return [...rs.slice(0, idx + 1), nr, ...rs.slice(idx + 1)];
    });
    const updateRow = (key, patch) => setRows(rs => rs.map(r => (r.key === key ? {...r, ...patch} : r)));

    // keyboard shortcuts on table
    const tableRef = useRef(null);
    useEffect(() => {
        const handler = (e) => {
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
                // only remove if Delete is pressed in a row input
                if (key) removeRow(key);
            }
        };
        const el = tableRef.current;
        el && el.addEventListener("keydown", handler);
        return () => el && el.removeEventListener("keydown", handler);
    }, []);

    // ---- Helpers ----
    const sanitizePct = (n) => Math.max(0, Math.min(100, Number(n) || 0));
    const getAvailableQtyOnHand = (itemId) => Number(MOCK_STOCK[itemId] || 0);

    // ---- Cost / capacity calculations ----
    const rolledCostPer1pc = useMemo(() => {
        return rows.reduce((sum, r) => {
            const it = MOCK_ITEMS.find(i => i.id === r.itemId);
            const q = Number(r.qty || 0);
            return sum + (it ? (it.cost || 0) * q : 0);
        }, 0);
    }, [rows]);

    const perRowCalcs = useMemo(() => rows.map(r => {
        const it = MOCK_ITEMS.find(i => i.id === r.itemId);
        const qty1pc = Number(r.qty || 0);
        const scrap = Math.max(0, Number(r.scrap || 0)) / 100;
        const perUnitNeed = qty1pc * (1 + scrap);              // need per FG
        const perBatch = perUnitNeed * Math.max(0, Number(releaseRate));
        const unitCost = (it?.cost || 0) * perUnitNeed;
        const batchCost = (it?.cost || 0) * perBatch;
        const available = r.itemId ? getAvailableQtyOnHand(r.itemId) : 0;
        const maxUnitsByThis = perUnitNeed > 0 ? Math.floor(available / perUnitNeed) : 0;
        return {row: r, item: it, perUnitNeed, perBatch, unitCost, batchCost, available, maxUnitsByThis};
    }), [rows, releaseRate]);

    const costPerBatch = useMemo(() => perRowCalcs.reduce((s, x) => s + x.batchCost, 0), [perRowCalcs]);
    const goodUnitsPerBatch = useMemo(() => Math.max(0, Number(releaseRate)) * (sanitizePct(yieldPct) / 100 || 0), [releaseRate, yieldPct]);
    const costPerNetUnit = goodUnitsPerBatch > 0 ? costPerBatch / goodUnitsPerBatch : 0;

    const limitingUnits = useMemo(() => {
        const valid = perRowCalcs.filter(x => x.row.itemId && x.perUnitNeed > 0);
        if (!valid.length) return null;
        return valid.reduce((min, x) => (x.maxUnitsByThis < (min?.maxUnitsByThis ?? Infinity) ? x : min), null);
    }, [perRowCalcs]);
    const maxUnitsNow = limitingUnits ? limitingUnits.maxUnitsByThis : 0;

    // ---- Actions ----
    const handleSaveDraft = () => {
        setLastSavedAt(new Date());
        setDirty(false);
        pushToast({type: "success", title: "Draft saved", message: "Changes stored locally (mock)."});
    };
    const handleActivate = () => {
        if (errors.length) {
            pushToast({
                type: "warning",
                title: "Resolve validation issues",
                message: "Open the error panel to review."
            });
            return;
        }
        setStatus("Active");
        pushToast({type: "success", title: "BOM activated", message: `Status set to Active for ${bomId}.`});
    };
    const handleCancel = () => {
        if (dirty) setOpenConfirmLeave(true);
        else navigate("/boms");
    };

    return (
        <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto  px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">New BOM</h1>
                        <p className="mt-2 text-gray-400">Create a bill of materials — start in Draft and activate when
                            ready.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveDraft}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                        >
                            Save Draft
                        </button>
                        <button
                            onClick={handleActivate}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                            disabled={errors.length > 0}
                        >
                            Activate
                        </button>
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
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
            BOM ID: <span className="font-mono text-gray-300">{bomId}</span>
          </span>
                </div>
            </header>

            {/* Content */}
            <section className="mx-auto  px-4 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left: form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">General</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Parent Item with aligned picker */}
                            <div className="sm:col-span-1">
                                <label className="block text-xs text-gray-400 mb-1">Parent Item / Finished Good</label>
                                <div className="flex gap-2">
                                    <input
                                        value={parentItemId}
                                        onChange={(e) => setParentItemId(e.target.value)}
                                        placeholder="e.g. ITM-006"
                                        className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    />
                                    <button
                                        onClick={() => setOpenParentPicker(true)}
                                        className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm whitespace-nowrap"
                                    >
                                        Pick Parent
                                    </button>
                                </div>
                                {parentItem && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        {parentItem.name} • UoM: {parentItem.uom} • Status: {parentItem.status}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">BOM ID</label>
                                <input
                                    value={bomId}
                                    onChange={(e) => setBomId(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Revision</label>
                                <input
                                    value={revision}
                                    onChange={(e) => setRevision(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                >
                                    <option>Draft</option>
                                    <option>Active</option>
                                    <option>Hold</option>
                                    <option>Obsolete</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Effective Date</label>
                                <input
                                    type="date"
                                    value={effectiveDate}
                                    onChange={(e) => setEffectiveDate(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Release Rate (batch size)</label>
                                <input
                                    type="number"
                                    min={0}
                                    value={releaseRate}
                                    onChange={(e) => setReleaseRate(Number(e.target.value))}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Planned Yield (%)</label>
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={yieldPct}
                                    onChange={(e) => setYieldPct(Number(e.target.value))}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Description / Notes</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    placeholder="Optional, visible on BOM details and shop traveler."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Components */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-white">Components</h2>
                            <div className="flex items-center gap-2 text-sm">
                                <button
                                    onClick={addRow}
                                    className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700"
                                >
                                    + Add Row
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                            <table ref={tableRef} className="min-w-full divide-y divide-gray-800 text-sm">
                                <thead className="bg-gray-900/80">
                                <tr>
                                    <th className="px-4 py-3 text-left">Component Item</th>
                                    <th className="px-4 py-3 text-left">Qty / 1 pc</th>
                                    <th className="px-4 py-3 text-left">Scrap %</th>
                                    <th className="px-4 py-3 text-left">UoM</th>
                                    <th className="px-4 py-3 text-left">Notes</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {rows.map((r) => {
                                    const it = MOCK_ITEMS.find(i => i.id === r.itemId);
                                    const rowErrors = {
                                        itemId: !r.itemId,
                                        qty: !r.qty || Number(r.qty) <= 0,
                                        uom: !r.uom,
                                        scrap: Number(r.scrap) < 0,
                                        sameAsParent: r.itemId && r.itemId === parentItemId,
                                    };

                                    return (
                                        <tr key={r.key} className="hover:bg-gray-800/40 transition">
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex gap-2">
                                                        <input
                                                            data-rowkey={r.key}
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
                                                            className={classNames("w-full rounded-lg bg-gray-800 px-3 py-2 text-sm border",
                                                                rowErrors.itemId ? "border-red-500/60" : "border-white/10")}
                                                        />
                                                        <button
                                                            onClick={() => setOpenComponentPicker({
                                                                open: true,
                                                                rowKey: r.key
                                                            })}
                                                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm whitespace-nowrap"
                                                        >
                                                            Pick
                                                        </button>
                                                    </div>
                                                    {it && (
                                                        <div className="text-xs text-gray-500">
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
                                                    data-rowkey={r.key}
                                                    inputMode="decimal"
                                                    value={r.qty}
                                                    onChange={(e) => updateRow(r.key, {qty: e.target.value})}
                                                    placeholder="0"
                                                    className={classNames("w-28 rounded-lg bg-gray-800 border px-3 py-2 text-sm",
                                                        rowErrors.qty ? "border-red-500/60" : "border-white/10")}
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={r.key}
                                                    inputMode="decimal"
                                                    value={r.scrap}
                                                    onChange={(e) => updateRow(r.key, {scrap: e.target.value})}
                                                    placeholder="0"
                                                    className={classNames("w-24 rounded-lg bg-gray-800 border px-3 py-2 text-sm",
                                                        rowErrors.scrap ? "border-red-500/60" : "border-white/10")}
                                                />
                                                <div className="text-[11px] text-gray-500 mt-1">add-on %</div>
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={r.key}
                                                    value={r.uom}
                                                    onChange={(e) => updateRow(r.key, {uom: e.target.value})}
                                                    placeholder={it ? it.uom : "e.g. pcs"}
                                                    className={classNames("w-28 rounded-lg bg-gray-800 border px-3 py-2 text-sm",
                                                        rowErrors.uom ? "border-red-500/60" : "border-white/10")}
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={r.key}
                                                    value={r.notes}
                                                    onChange={(e) => updateRow(r.key, {notes: e.target.value})}
                                                    placeholder="Optional notes"
                                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        onClick={() => cloneRow(r.key)}
                                                        title="Clone row"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium
                                       bg-gray-800/60 border-white/10 text-gray-200 hover:bg-gray-700/60"
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

                        {/* Table footer actions + calculations */}
                        <div className="mt-3 text-xs text-gray-500 flex items-center justify-between flex-wrap gap-3">
                            <div>
                                Shortcuts: <span className="text-gray-300">Enter</span> add row • <span
                                className="text-gray-300">Ctrl/⌘+D</span> duplicate focused row • <span
                                className="text-gray-300">Delete</span> remove focused row
                            </div>
                            <div className="flex items-center gap-3">
                                {componentsCount === 0 ? (
                                    <span className="text-yellow-400">No valid components yet</span>
                                ) : (
                                    <span>Valid components: <span
                                        className="text-gray-300">{componentsCount}</span></span>
                                )}
                                <button
                                    onClick={() => setOpenCapacityModal(true)}
                                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                                    title="Units you can make now based on on-hand component availability"
                                >
                                    How much can I make now?
                                </button>
                                <button
                                    onClick={() => setOpenCostModal(true)}
                                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                    title="Shows planned cost per batch and per net good unit"
                                >
                                    Planned Cost / Margin
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error summary */}
                    {errors.length > 0 && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
                            <div className="font-semibold text-red-300 mb-2">Please fix the following before
                                activation
                            </div>
                            <ul className="list-disc pl-5 space-y-1 text-red-200">
                                {errors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        </div>
                    )}

                    {/* Attachments (placeholder) */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">Attachments</h2>
                        <div className="text-sm text-gray-400">Upload drawings/specs here in the future. (Placeholder)
                        </div>
                    </div>
                </div>

                {/* Right: sticky summary */}
                <aside className="lg:sticky lg:top-6 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h3 className="text-base font-semibold text-white">Summary</h3>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Components</div>
                                <div className="text-lg font-semibold text-gray-100">{componentsCount}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Cost (mock)</div>
                                <div
                                    className="text-lg font-semibold text-gray-100">€{rolledCostPer1pc.toFixed(2)}</div>
                            </div>

                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Batch Size</div>
                                <div className="text-lg font-semibold text-gray-100">{Number(releaseRate) || 0}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Yield %</div>
                                <div className="text-lg font-semibold text-gray-100">{sanitizePct(yieldPct)}%</div>
                            </div>

                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2">
                                <div className="text-xs text-gray-400">Planned Cost / Net Unit</div>
                                <div className="text-lg font-semibold text-gray-100">€{costPerNetUnit.toFixed(4)}</div>
                                <div className="text-[11px] text-gray-500 mt-1">Includes scrap add-ons and yield.</div>
                            </div>

                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2">
                                <div className="text-xs text-gray-400">Parent Item</div>
                                <div className="text-sm text-gray-200 min-h-[20px]">
                                    {parentItem ? `${parentItem.id} — ${parentItem.name}` :
                                        <span className="text-gray-500">(not set)</span>}
                                </div>
                            </div>

                            {/* Capacity quick glance (units-based) */}
                            <div
                                className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2 flex items-center gap-2">
                                <div className="text-xs text-gray-400">Capacity snapshot</div>
                                {limitingUnits?.row?.itemId ? (
                                    <div className="flex items-center gap-2">
                                        <Badge tone="warn">Limit: {limitingUnits.row.itemId}</Badge>
                                        <Badge>Units now: {maxUnitsNow}</Badge>
                                    </div>
                                ) : (
                                    <Badge tone="ok">No limiting component yet</Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 text-xs text-gray-400">
                        <div className="font-semibold text-gray-300 mb-2">Tips</div>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Start in Draft; Activate when validated.</li>
                            <li>Use the row “Pick” button to search and select component items.</li>
                            <li>Default UoM is prefilled from the selected component when available.</li>
                            <li>Use Scrap % to account for expected losses; Yield % applies to finished output.</li>
                        </ul>
                    </div>
                </aside>
            </section>

            {/* ----- MODALS (aligned shell) ----- */}
            {/* Capacity */}
            <Modal
                open={openCapacityModal}
                onClose={() => setOpenCapacityModal(false)}
                title="Capacity by Component (On-hand stock)"
                footer={
                    <button onClick={() => setOpenCapacityModal(false)}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">
                        Close
                    </button>
                }
            >
                {perRowCalcs.length === 0 || perRowCalcs.every(x => !x.row.itemId) ? (
                    <EmptyState title="No components to analyze"
                                subtitle="Add components with quantities to see capacity."/>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-white/10 bg-gray-900/60 px-4 py-3 text-sm">
                            You can make <span
                            className="font-semibold text-white">{maxUnitsNow.toLocaleString()}</span> unit(s) now with
                            on-hand stock.
                        </div>
                        <div className="overflow-auto border border-white/10 rounded-xl">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-900/60">
                                <tr>
                                    <th className="px-3 py-2 text-left">Component</th>
                                    <th className="px-3 py-2 text-right">Avail</th>
                                    <th className="px-3 py-2 text-right">Per FG</th>
                                    <th className="px-3 py-2 text-right">Max Units by This</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {perRowCalcs
                                    .filter(x => x.row.itemId && x.perUnitNeed > 0)
                                    .sort((a, b) => a.maxUnitsByThis - b.maxUnitsByThis)
                                    .map(x => {
                                        const isLimiting = limitingUnits && limitingUnits.row.key === x.row.key;
                                        return (
                                            <tr key={x.row.key} className={isLimiting ? "bg-red-500/5" : ""}>
                                                <td className="px-3 py-2">
                                                    <div className="font-semibold text-gray-100">{x.row.itemId}</div>
                                                    <div className="text-xs text-gray-400">{x.item?.name || ""}</div>
                                                </td>
                                                <td className="px-3 py-2 text-right">{x.available.toLocaleString()} {x.item?.uom || ""}</td>
                                                <td className="px-3 py-2 text-right">{x.perUnitNeed.toFixed(4)}</td>
                                                <td className="px-3 py-2 text-right">
                          <span className={classNames(
                              "inline-flex min-w-[2.5rem] justify-center rounded-full px-2 py-0.5 text-xs font-semibold border",
                              isLimiting ? "bg-red-600/20 text-red-200 border-red-500/40" : "bg-gray-700/50 text-gray-200 border-white/10"
                          )}>
                            {x.maxUnitsByThis.toLocaleString()}
                          </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center gap-2">
                            {limitingUnits ? (
                                <>
                                    <Badge tone="warn">Limiting: {limitingUnits.row.itemId}</Badge>
                                    <Badge>Units now: {maxUnitsNow}</Badge>
                                </>
                            ) : (
                                <Badge tone="ok">No limiting component</Badge>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* Cost */}
            <Modal
                open={openCostModal}
                onClose={() => setOpenCostModal(false)}
                title="Planned Cost & Margin (per batch / per unit)"
                footer={
                    <button onClick={() => setOpenCostModal(false)}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">
                        Close
                    </button>
                }
            >
                {perRowCalcs.length === 0 || perRowCalcs.every(x => !x.row.itemId) ? (
                    <EmptyState title="No cost to compute" subtitle="Add components to see roll-ups."/>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Cost per batch</div>
                                <div className="text-lg font-semibold text-gray-100">€{costPerBatch.toFixed(2)}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Good units / batch</div>
                                <div
                                    className="text-lg font-semibold text-gray-100">{goodUnitsPerBatch.toFixed(2)}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Cost / net good unit</div>
                                <div className="text-lg font-semibold text-gray-100">€{costPerNetUnit.toFixed(4)}</div>
                            </div>
                        </div>
                        <div className="overflow-auto border border-white/10 rounded-xl">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-900/60">
                                <tr>
                                    <th className="px-3 py-2 text-left">Item</th>
                                    <th className="px-3 py-2 text-right">Cost</th>
                                    <th className="px-3 py-2 text-right">Qty / 1 pc</th>
                                    <th className="px-3 py-2 text-right">Scrap %</th>
                                    <th className="px-3 py-2 text-right">Qty / batch</th>
                                    <th className="px-3 py-2 text-right">€ / batch</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {perRowCalcs.filter(x => x.row.itemId && x.perUnitNeed > 0).map(x => (
                                    <tr key={x.row.key}>
                                        <td className="px-3 py-2">{x.row.itemId} — {x.item?.name || ""}</td>
                                        <td className="px-3 py-2 text-right">€{(x.item?.cost ?? 0).toFixed(4)}</td>
                                        <td className="px-3 py-2 text-right">{(Number(x.row.qty) || 0)} {x.item?.uom || ""}</td>
                                        <td className="px-3 py-2 text-right">{Number(x.row.scrap || 0)}%</td>
                                        <td className="px-3 py-2 text-right">{x.perBatch.toFixed(4)} {x.item?.uom || ""}</td>
                                        <td className="px-3 py-2 text-right font-semibold">€{x.batchCost.toFixed(4)}</td>
                                    </tr>
                                ))}
                                </tbody>
                                <tfoot>
                                <tr className="bg-gray-900/60">
                                    <td className="px-3 py-2 text-right font-semibold" colSpan={5}>Total</td>
                                    <td className="px-3 py-2 text-right font-semibold">€{costPerBatch.toFixed(4)}</td>
                                </tr>
                                </tfoot>
                            </table>
                        </div>
                        <div className="text-xs text-gray-400">
                            Assumes finished yield = {sanitizePct(yieldPct)}% and per-component scrap add-ons.
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirm leave */}
            <Modal
                open={openConfirmLeave}
                onClose={() => setOpenConfirmLeave(false)}
                title="Discard unsaved changes?"
                footer={
                    <>
                        <button
                            onClick={() => setOpenConfirmLeave(false)}
                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm"
                        >
                            Stay
                        </button>
                        <button
                            onClick={() => navigate("/boms")}
                            className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
                        >
                            Discard & Leave
                        </button>
                    </>
                }
            >
                <div className="text-gray-300">If you leave, your latest unsaved edits will be lost.</div>
            </Modal>

            {/* Parent picker (aligned) */}
            <ItemPickerModal
                open={openParentPicker}
                onClose={() => setOpenParentPicker(false)}
                title="Select Parent Item"
                items={MOCK_ITEMS}
                onPick={(it) => {
                    setParentItemId(it.id);
                    setOpenParentPicker(false);
                }}
            />

            {/* Component picker (aligned, targeted row) */}
            <ItemPickerModal
                open={openComponentPicker.open}
                onClose={() => setOpenComponentPicker({open: false, rowKey: null})}
                title="Select Component Item"
                items={MOCK_ITEMS}
                onPick={(it) => {
                    if (openComponentPicker.rowKey) {
                        updateRow(openComponentPicker.rowKey, {itemId: it.id, uom: it.uom});
                    }
                    setOpenComponentPicker({open: false, rowKey: null});
                }}
            />

            {/* Toasts */}
            <ToastHost toasts={toasts} remove={removeToast}/>
        </div>
    );
}

export {BOMDetailsPage};
