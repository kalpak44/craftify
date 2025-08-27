import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";

/**
 * BOMCreationPage — React + Tailwind (pure JS)
 * UX: no browser alerts. Modals for results, optional action toasts (no autosave toasts).
 * Keeps the original dark design, layout, sticky summary, borders, and spacing.
 * Adds: Release Rate, Planned Yield, Scrap %, Per-Batch calc, Capacity (FEFO mock), Planned Cost.
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
    {id: "ITM-009", name: "Screws M3x8", uom: "ea", status: "Active", cost: 0.03},
    {id: "ITM-010", name: "Assembly Kit 10", uom: "kit", status: "Discontinued", cost: 0},
];

// ---- Mock FEFO inventory lots (demo only) ----
const MOCK_LOTS = {
    "ITM-001": [
        {lot: "A1", exp: "2025-10-01", qty: 5000},
        {lot: "B1", exp: "2026-02-01", qty: 7000},
    ],
    "ITM-002": [{lot: "W1", exp: "2026-01-15", qty: 3000}],
    "ITM-003": [{lot: "P1", exp: "2025-12-31", qty: 6000}],
    "ITM-004": [{lot: "L1", exp: "2026-03-01", qty: 4000}],
    "ITM-005": [{lot: "C1", exp: "2026-05-01", qty: 4000}],
    "ITM-007": [{lot: "S1", exp: "2026-04-01", qty: 2000}],
    "ITM-008": [{lot: "B5010", exp: "2025-11-20", qty: 900}],
    "ITM-009": [{lot: "SCR", exp: "2026-06-01", qty: 20000}],
    "ITM-010": [{lot: "KIT", exp: "2026-07-01", qty: 500}],
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
    scrap: "0", // scrap % per component (add-on)
    notes: "",
});

// ---------- UI atoms ----------
function Toast({type = "info", title, message, onClose}) {
    const colors = {
        success: "bg-emerald-600/20 border-emerald-500/40 text-emerald-200",
        error: "bg-red-600/20 border-red-500/40 text-red-200",
        warning: "bg-yellow-600/20 border-yellow-500/40 text-yellow-200",
        info: "bg-blue-600/20 border-blue-500/40 text-blue-200",
    };
    return (
        <div
            className={`pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 shadow-lg backdrop-blur ${colors[type]}`}>
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
            {toasts.map(t => (
                <Toast key={t.id} {...t} onClose={() => remove(t.id)}/>
            ))}
        </div>
    );
}

function Modal({open, title, onClose, children, maxWidth = "max-w-3xl"}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/>
            <div
                className={`relative w-full ${maxWidth} mx-4 sm:mx-auto rounded-2xl border border-white/10 bg-gray-900/90 shadow-2xl`}
                role="dialog" aria-modal="true">
                <div className="px-5 py-4 border-b border-white/10 flex items-center">
                    <div className="text-white font-semibold">{title}</div>
                    <button onClick={onClose} className="ml-auto text-gray-300 hover:text-white text-sm">Close</button>
                </div>
                <div className="p-5 text-sm text-gray-200 max-h-[70vh] overflow-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

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
        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs border ${tones[tone]}`}>{children}</span>;
}

// ---------- Page ----------
function BOMCreationPage() {
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
    const [yieldPct, setYieldPct] = useState(95); // finished-good yield %

    // Autosave state (fake)
    const [dirty, setDirty] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const saveTimer = useRef(null);

    // Toasts (NO autosave toasts)
    const [toasts, setToasts] = useState([]);
    const pushToast = (t) => setToasts(ts => [...ts, {id: (crypto.randomUUID?.() || String(Math.random()).slice(2)), ...t}]);
    const removeToast = (id) => setToasts(ts => ts.filter(x => x.id !== id));

    // Modals
    const [openCostModal, setOpenCostModal] = useState(false);
    const [openCapacityModal, setOpenCapacityModal] = useState(false);
    const [openConfirmLeave, setOpenConfirmLeave] = useState(false);

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
                if (key) removeRow(key);
            }
        };
        const el = tableRef.current;
        el && el.addEventListener("keydown", handler);
        return () => el && el.removeEventListener("keydown", handler);
    }, []);

    // ---- Helpers ----
    const sanitizePct = (n) => Math.max(0, Math.min(100, Number(n) || 0));

    const getAvailableQtyFEFO = (itemId) => {
        const lots = (MOCK_LOTS[itemId] || []).slice().sort((a, b) => a.exp.localeCompare(b.exp));
        return lots.reduce((sum, l) => sum + (l.qty || 0), 0);
    };

    // ---- Item search / picker helpers ----
    const [itemQuery, setItemQuery] = useState("");
    const filteredItems = useMemo(() => {
        const q = itemQuery.trim().toLowerCase();
        if (!q) return MOCK_ITEMS;
        return MOCK_ITEMS.filter((i) => i.id.toLowerCase().includes(q) || i.name.toLowerCase().includes(q));
    }, [itemQuery]);

    // ---- Calculations ----
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
        const perUnitNeed = qty1pc * (1 + scrap);
        const perBatch = perUnitNeed * Math.max(0, Number(releaseRate));
        const unitCost = (it?.cost || 0) * perUnitNeed;
        const batchCost = (it?.cost || 0) * perBatch;
        const available = r.itemId ? getAvailableQtyFEFO(r.itemId) : 0;
        const batchesPossible = perUnitNeed > 0 && releaseRate > 0 ? Math.floor(available / (perUnitNeed * releaseRate)) : 0;
        return {row: r, item: it, perUnitNeed, perBatch, unitCost, batchCost, available, batchesPossible};
    }), [rows, releaseRate]);

    const costPerBatch = useMemo(() => perRowCalcs.reduce((s, x) => s + x.batchCost, 0), [perRowCalcs]);
    const goodUnitsPerBatch = useMemo(() => Math.max(0, Number(releaseRate)) * (sanitizePct(yieldPct) / 100 || 0), [releaseRate, yieldPct]);
    const costPerNetUnit = goodUnitsPerBatch > 0 ? costPerBatch / goodUnitsPerBatch : 0;

    const limiting = useMemo(() => {
        const rowsWithCap = perRowCalcs.filter(x => x.perUnitNeed > 0 && x.row.itemId);
        if (!rowsWithCap.length) return null;
        return rowsWithCap.reduce((min, x) => (x.batchesPossible < (min?.batchesPossible ?? Infinity) ? x : min), null);
    }, [perRowCalcs]);

    const totalGoodUnitsNow = useMemo(() => {
        const batches = limiting ? limiting.batchesPossible : 0;
        return Math.floor(batches * goodUnitsPerBatch);
    }, [limiting, goodUnitsPerBatch]);

    // ---- Actions ----
    const handleSaveDraft = () => {
        setLastSavedAt(new Date());
        setDirty(false);
        // Intentionally NO autosave toast; this is a user-invoked save toast:
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
            <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">New BOM</h1>
                        <p className="mt-2 text-gray-400">Create a bill of materials — start in Draft and activate when
                            ready.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={handleSaveDraft}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">Save
                            Draft
                        </button>
                        <button onClick={handleActivate}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                                disabled={errors.length > 0}>Activate
                        </button>
                        <button onClick={handleCancel}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">Cancel
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
                    <span className="ml-auto text-xs text-gray-500">BOM ID: <span
                        className="font-mono text-gray-300">{bomId}</span></span>
                </div>
            </header>

            {/* Content */}
            <section className="mx-auto max-w-6xl px-4 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left: form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">General</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Parent Item / Finished Good</label>
                                <input
                                    list="items-list"
                                    value={parentItemId}
                                    onChange={(e) => setParentItemId(e.target.value)}
                                    placeholder="e.g. ITM-006"
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                                <datalist id="items-list">
                                    {MOCK_ITEMS.map(i => (
                                        <option key={i.id} value={i.id}>{`${i.id} — ${i.name}`}</option>
                                    ))}
                                </datalist>
                                {parentItem && (
                                    <p className="mt-1 text-xs text-gray-500">{parentItem.name} •
                                        UoM: {parentItem.uom} • Status: {parentItem.status}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">BOM ID</label>
                                <input value={bomId} onChange={(e) => setBomId(e.target.value)}
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Revision</label>
                                <input value={revision} onChange={(e) => setRevision(e.target.value)}
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Status</label>
                                <select value={status} onChange={(e) => setStatus(e.target.value)}
                                        className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm">
                                    <option>Draft</option>
                                    <option>Active</option>
                                    <option>Hold</option>
                                    <option>Obsolete</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Effective Date</label>
                                <input type="date" value={effectiveDate}
                                       onChange={(e) => setEffectiveDate(e.target.value)}
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>

                            {/* Release Rate and Planned Yield moved to main grid like others */}
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

                            {/* Description / Notes full-width on the last row with more height */}
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
                                <input
                                    placeholder="Search items…"
                                    value={itemQuery}
                                    onChange={(e) => setItemQuery(e.target.value)}
                                    className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                                <button onClick={addRow}
                                        className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700">+
                                    Add Row
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
                                    <th className="px-4 py-3 text-left">Per Batch</th>
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
                                    const qty1pc = Number(r.qty || 0);
                                    const scrap = Math.max(0, Number(r.scrap || 0)) / 100;
                                    const perBatch = qty1pc * Math.max(0, Number(releaseRate)) * (1 + scrap);

                                    return (
                                        <tr key={r.key} className="hover:bg-gray-800/40 transition">
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex flex-col gap-1">
                                                    <select
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
                                                        className={`w-full rounded-lg bg-gray-800 border ${rowErrors.itemId ? "border-red-500/60" : "border-white/10"} px-3 py-2 text-sm`}
                                                    >
                                                        <option value="">— Select item —</option>
                                                        {filteredItems.map(i => (
                                                            <option key={i.id}
                                                                    value={i.id}>{`${i.id} — ${i.name}`}</option>
                                                        ))}
                                                    </select>
                                                    {it && (
                                                        <div className="text-xs text-gray-500">{it.name} • Default
                                                            UoM: {it.uom} • Status: {it.status}</div>
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
                                                    className={`w-28 rounded-lg bg-gray-800 border ${rowErrors.qty ? "border-red-500/60" : "border-white/10"} px-3 py-2 text-sm`}
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={r.key}
                                                    inputMode="decimal"
                                                    value={r.scrap}
                                                    onChange={(e) => updateRow(r.key, {scrap: e.target.value})}
                                                    placeholder="0"
                                                    className={`w-24 rounded-lg bg-gray-800 border ${rowErrors.scrap ? "border-red-500/60" : "border-white/10"} px-3 py-2 text-sm`}
                                                />
                                                <div className="text-[11px] text-gray-500 mt-1">add-on %</div>
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <div
                                                    className="w-32 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm">
                                                    {isFinite(perBatch) ? perBatch.toFixed(4) : "0"}
                                                </div>
                                                <div className="text-[11px] text-gray-500 mt-1">per batch</div>
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={r.key}
                                                    value={r.uom}
                                                    onChange={(e) => updateRow(r.key, {uom: e.target.value})}
                                                    placeholder={it ? it.uom : "e.g. pcs"}
                                                    className={`w-28 rounded-lg bg-gray-800 border ${rowErrors.uom ? "border-red-500/60" : "border-white/10"} px-3 py-2 text-sm`}
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
                                                    {/* Clone */}
                                                    <button
                                                        onClick={() => cloneRow(r.key)}
                                                        title="Clone row"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition
                             bg-gray-800/60 border-white/10 text-gray-200 hover:bg-gray-700/60 focus:outline-none
                             focus-visible:ring focus-visible:ring-indigo-500/40"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                                             fill="currentColor" className="h-4 w-4 text-indigo-300">
                                                            <path
                                                                d="M7 7a2 2 0 012-2h7a2 2 0 012 2v7a2 2 0 01-2 2H9a2 2 0 01-2-2V7z"/>
                                                            <path
                                                                d="M5 9a2 2 0 012-2v8a4 4 0 004 4h8a2 2 0 01-2 2H9a6 6 0 01-6-6V9z"/>
                                                        </svg>
                                                        <span>Clone</span>
                                                    </button>

                                                    {/* Remove */}
                                                    <button
                                                        onClick={() => removeRow(r.key)}
                                                        title="Remove row"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition
                             bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20 hover:text-red-200
                             focus:outline-none focus-visible:ring focus-visible:ring-red-500/40"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                                             fill="currentColor" className="h-4 w-4">
                                                            <path
                                                                d="M9 3h6a1 1 0 011 1v1h4a1 1 0 110 2h-1.05l-1.2 12.04A3 3 0 0114.77 22H9.23a3 3 0 01-2.98-2.96L5.05 7H4a1 1 0 110-2h4V4a1 1 0 011-1zm2 0v1h2V3h-2z"/>
                                                        </svg>
                                                        <span>Remove</span>
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
                                    title="Calculation by ingredient availability (FEFO) and limiting component × Yield %"
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
                            <div className="font-semibold text-red-300 mb-2 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20"
                                     fill="currentColor">
                                    <path fillRule="evenodd"
                                          d="M8.257 3.099c.765-1.36 2.72-1.36 3.485 0l6.347 11.29c.75 1.333-.213 2.99-1.742 2.99H3.652c-1.53 0-2.492-1.657-1.742-2.99L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V7a1 1 0 00-1-1z"
                                          clipRule="evenodd"/>
                                </svg>
                                Please fix the following before activation
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
                                <div className="text[11px] text-gray-500 mt-1">Includes scrap add-ons and yield.</div>
                            </div>

                            <div className="rounded-XL bg-gray-800/60 p-3 border border-white/10 col-span-2">
                                <div className="text-xs text-gray-400">Parent Item</div>
                                <div className="text-sm text-gray-200 min-h-[20px]">
                                    {parentItem ? `${parentItem.id} — ${parentItem.name}` :
                                        <span className="text-gray-500">(not set)</span>}
                                </div>
                            </div>

                            {/* Capacity quick glance */}
                            <div
                                className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2 flex items-center gap-2">
                                <div className="text-xs text-gray-400">Capacity snapshot</div>
                                {limiting?.row?.itemId ? (
                                    <div className="flex items-center gap-2">
                                        <Badge tone="warn">Limit: {limiting.row.itemId}</Badge>
                                        <Badge>Good units now: {totalGoodUnitsNow}</Badge>
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
                            <li>Use the item search above the table to filter the picker.</li>
                            <li>Default UoM is prefilled from the selected component when available.</li>
                            <li>Use Scrap % to account for expected losses; Yield % applies to finished output.</li>
                        </ul>
                    </div>
                </aside>
            </section>

            {/* ----- MODALS ----- */}
            <Modal open={openCapacityModal} title="Capacity by Component (FEFO mock)"
                   onClose={() => setOpenCapacityModal(false)}>
                {perRowCalcs.length === 0 || perRowCalcs.every(x => !x.row.itemId) ? (
                    <EmptyState title="No components to analyze"
                                subtitle="Add components with quantities to see capacity."/>
                ) : (
                    <div className="space-y-4">
                        <div className="text-sm text-gray-300">
                            Good units per batch after yield: <span
                            className="text-gray-100 font-semibold">{goodUnitsPerBatch.toFixed(2)}</span>
                        </div>
                        <div className="overflow-auto border border-white/10 rounded-xl">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-900/60">
                                <tr>
                                    <th className="px-3 py-2 text-left">Item</th>
                                    <th className="px-3 py-2 text-right">Available (FEFO)</th>
                                    <th className="px-3 py-2 text-right">Need / 1 pc (+scrap)</th>
                                    <th className="px-3 py-2 text-right">Need / batch</th>
                                    <th className="px-3 py-2 text-right">Batches possible</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {perRowCalcs.filter(x => x.row.itemId && x.perUnitNeed > 0).map(x => (
                                    <tr key={x.row.key}
                                        className={`${limiting && limiting.row.key === x.row.key ? "bg-yellow-500/5" : ""}`}>
                                        <td className="px-3 py-2">{x.row.itemId} — {x.item?.name || ""}</td>
                                        <td className="px-3 py-2 text-right">{x.available.toLocaleString()}</td>
                                        <td className="px-3 py-2 text-right">{x.perUnitNeed.toFixed(4)} {x.item?.uom || ""}</td>
                                        <td className="px-3 py-2 text-right">{x.perBatch.toFixed(4)} {x.item?.uom || ""}</td>
                                        <td className="px-3 py-2 text-right font-semibold">{x.batchesPossible}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex items-center gap-2">
                            {limiting ? (
                                <>
                                    <Badge tone="warn">Limiting: {limiting.row.itemId}</Badge>
                                    <Badge>Good units now: {totalGoodUnitsNow}</Badge>
                                </>
                            ) : (
                                <Badge tone="ok">No limiting component</Badge>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            <Modal open={openCostModal} title="Planned Cost & Margin (per batch / per unit)"
                   onClose={() => setOpenCostModal(false)}>
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
                                        <td className="px-3 py-2 text-right">{(x.row.qty || 0)} {x.item?.uom || ""}</td>
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
                        <div className="text-xs text-gray-400">Assumes finished yield = {sanitizePct(yieldPct)}% and
                            per-component scrap add-ons.
                        </div>
                    </div>
                )}
            </Modal>

            {/* Confirm leave modal */}
            <Modal open={openConfirmLeave} title="Discard unsaved changes?" onClose={() => setOpenConfirmLeave(false)}
                   maxWidth="max-w-md">
                <div className="text-gray-300">If you leave, your latest unsaved edits will be lost.</div>
                <div className="mt-4 flex justify-end gap-2">
                    <button onClick={() => setOpenConfirmLeave(false)}
                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700">Stay
                    </button>
                    <button onClick={() => navigate("/boms")}
                            className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white">Discard & Leave
                    </button>
                </div>
            </Modal>

            {/* Toasts */}
            <ToastHost toasts={toasts} remove={removeToast}/>
        </div>
    );
}

export default BOMCreationPage;
export {BOMCreationPage};
