import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";

/**
 * WorkOrderCreationPage — React + Tailwind (plain JS)
 * - BOM picker (searchable modal + mock link)
 * - FEFO availability check + Lots reservation + PO modal on shortage
 * - "Buildable now" indicator from inventory lots vs BOM (max units & limiting components)
 * - Traceability: reserved lots table
 * - Close WO modal: Good / Scrap / Rework required on completion
 * - Preserves original styles, layout, autosave, keyboard UX
 * - Pure JS, mock data, event-based (no alerts/confirm)
 */

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

// BOM index: finished good -> [{itemId, qty}]
const MOCK_BOMS = {
    "ITM-006": [
        {itemId: "ITM-005", qty: 2},
        {itemId: "ITM-004", qty: 1},
        {itemId: "ITM-003", qty: 1},
        {itemId: "ITM-009", qty: 8},
    ],
    "ITM-002": [
        {itemId: "ITM-007", qty: 1},
        {itemId: "ITM-009", qty: 6},
    ],
};

// Mock inventory lots (FEFO)
const MOCK_LOTS = [
    {lotId: "PC-2025-01", itemId: "ITM-003", qty: 60, expiry: "2025-10-01"},
    {lotId: "PC-2025-02", itemId: "ITM-003", qty: 100, expiry: "2026-01-15"},
    {lotId: "LB-2025-01", itemId: "ITM-004", qty: 25, expiry: "2025-09-10"},
    {lotId: "LB-2026-01", itemId: "ITM-004", qty: 40, expiry: "2026-05-30"},
    {lotId: "CB-2025-01", itemId: "ITM-005", qty: 10, expiry: "2025-08-31"},
    {lotId: "CB-2025-02", itemId: "ITM-005", qty: 35, expiry: "2025-12-05"},
    {lotId: "SF-2025-01", itemId: "ITM-007", qty: 5, expiry: "2027-01-01"},
    {lotId: "SC-2025-01", itemId: "ITM-009", qty: 200, expiry: "2026-12-31"},
];

const nextWO = (() => {
    let n = 1011;
    return () => `WO-${String(n++).padStart(4, "0")}`;
})();

const nextPO = (() => {
    let n = 5001;
    return () => `PO-${String(n++).padStart(4, "0")}`;
})();

const newOpRow = () => ({
    key: crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
    step: "",
    workstation: "",
    setupMin: "",
    runMinPer: "",
    notes: "",
});

function classNames(...a) {
    return a.filter(Boolean).join(" ");
}

// Simple toast system
function Toasts({toasts, dismiss}) {
    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
            {toasts.map(t => (
                <div key={t.id}
                     className={classNames(
                         "rounded-lg border px-4 py-3 shadow-lg min-w-[260px] text-sm",
                         t.variant === "error" ? "bg-red-700/20 border-red-500/40 text-red-100" :
                             t.variant === "success" ? "bg-emerald-700/20 border-emerald-500/40 text-emerald-100" :
                                 "bg-gray-800/90 border-white/10 text-gray-100"
                     )}>
                    <div className="flex items-start gap-3">
                        <div className="mt-1">
              <span className={classNames("inline-block h-2 w-2 rounded-full",
                  t.variant === "error" ? "bg-red-400" :
                      t.variant === "success" ? "bg-emerald-400" : "bg-sky-400")}/>
                        </div>
                        <div className="flex-1">
                            <div className="font-medium">{t.title}</div>
                            {t.message && <div className="text-xs text-gray-300 mt-0.5">{t.message}</div>}
                        </div>
                        <button onClick={() => dismiss(t.id)}
                                className="text-gray-400 hover:text-gray-200">&times;</button>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Modal shell
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

// BOM search & select modal
function BomPickerModal({open, onClose, onPick, items, boms}) {
    const [q, setQ] = useState("");
    const bomRows = useMemo(() => {
        const fgIds = Object.keys(boms);
        const rows = fgIds.map(id => {
            const it = items.find(i => i.id === id);
            const comps = (boms[id] || []).map(b => b.itemId).join(", ");
            return {id, name: it?.name || "(unknown)", uom: it?.uom || "", comps};
        });
        if (!q) return rows;
        const qq = q.toLowerCase();
        return rows.filter(r => r.id.toLowerCase().includes(qq) || r.name.toLowerCase().includes(qq) || r.comps.toLowerCase().includes(qq));
    }, [q, items, boms]);

    return (
        <Modal open={open} onClose={onClose} title="Select Bill of Materials"
               footer={<button onClick={onClose}
                               className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">Close</button>}>
            <div className="mb-3">
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by FG ID, name, or component"
                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
            </div>
            <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                <table className="min-w-full divide-y divide-gray-800 text-sm">
                    <thead className="bg-gray-900/80">
                    <tr>
                        <th className="px-4 py-3 text-left">FG</th>
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Components</th>
                        <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                    {bomRows.map(r => (
                        <tr key={r.id} className="hover:bg-gray-800/40">
                            <td className="px-4 py-3 font-mono">{r.id}</td>
                            <td className="px-4 py-3">{r.name}</td>
                            <td className="px-4 py-3 text-xs text-gray-400">{r.comps}</td>
                            <td className="px-4 py-3 text-right">
                                <button onClick={() => onPick(r.id)}
                                        className="px-2.5 py-1.5 rounded-md border text-xs bg-blue-600/90 text-white border-blue-400/30 hover:bg-blue-600">
                                    Use BOM
                                </button>
                            </td>
                        </tr>
                    ))}
                    {bomRows.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-gray-400">No matches</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </Modal>
    );
}

// Availability/Reservation modal
function AvailabilityModal({open, onClose, requirements, lots, onReserve, onCreatePO}) {
    const rows = useMemo(() => {
        return requirements.map(req => {
            const itemLots = lots.filter(l => l.itemId === req.itemId).slice().sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
            let need = req.required;
            const alloc = [];
            for (const lot of itemLots) {
                if (need <= 0) break;
                const take = Math.min(need, lot.qty);
                if (take > 0) {
                    alloc.push({...lot, alloc: take});
                    need -= take;
                }
            }
            return {
                ...req,
                allocations: alloc,
                shortage: Math.max(0, need)
            };
        });
    }, [requirements, lots]);

    const hasShortage = rows.some(r => r.shortage > 0);

    return (
        <Modal open={open} onClose={onClose} title="Availability & Reservation (FEFO)"
               footer={
                   <>
                       {hasShortage && (
                           <button onClick={() => onCreatePO(rows)}
                                   className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm">
                               Create PO for Shortage
                           </button>
                       )}
                       <button onClick={() => onReserve(rows)}
                               className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                           Reserve Lots
                       </button>
                       <button onClick={onClose}
                               className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">
                           Close
                       </button>
                   </>
               }>
            <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                <table className="min-w-full divide-y divide-gray-800 text-sm">
                    <thead className="bg-gray-900/80">
                    <tr>
                        <th className="px-4 py-3 text-left">Item</th>
                        <th className="px-4 py-3 text-left">Required</th>
                        <th className="px-4 py-3 text-left">Allocations (FEFO)</th>
                        <th className="px-4 py-3 text-left">Shortage</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                    {rows.map(r => {
                        const it = MOCK_ITEMS.find(i => i.id === r.itemId);
                        return (
                            <tr key={r.itemId} className="align-top">
                                <td className="px-4 py-3">
                                    <div className="font-mono">{r.itemId}</div>
                                    <div className="text-xs text-gray-400">{it?.name}</div>
                                </td>
                                <td className="px-4 py-3">{r.required} <span
                                    className="text-xs text-gray-400">{it?.uom}</span></td>
                                <td className="px-4 py-3">
                                    {r.allocations.length === 0 ? <span className="text-gray-500">—</span> :
                                        <div className="space-y-1">
                                            {r.allocations.map(a => (
                                                <div key={a.lotId} className="text-xs">
                                                    <span
                                                        className="font-mono text-gray-200">{a.lotId}</span> • {a.alloc} (exp {a.expiry})
                                                </div>
                                            ))}
                                        </div>
                                    }
                                </td>
                                <td className="px-4 py-3">
                                    {r.shortage > 0
                                        ? <span
                                            className="px-2 py-1 text-xs rounded-full bg-red-600/30 text-red-200">{r.shortage}</span>
                                        : <span
                                            className="px-2 py-1 text-xs rounded-full bg-emerald-600/30 text-emerald-200">OK</span>}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
            <div className="mt-3 text-xs text-gray-400">
                FEFO = First-Expired-First-Out. The earliest expiry lots are allocated first for each component.
            </div>
        </Modal>
    );
}

// PO creation modal
function CreatePoModal({open, onClose, shortageRows, onCreate}) {
    const [vendor, setVendor] = useState("Preferred Supplier Ltd.");
    const [expected, setExpected] = useState(() => new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10));
    const [lines, setLines] = useState([]);

    useEffect(() => {
        if (open) {
            const lns = (shortageRows || [])
                .filter(r => r.shortage > 0)
                .map(r => ({
                    itemId: r.itemId,
                    qty: r.shortage,
                    uom: (MOCK_ITEMS.find(i => i.id === r.itemId)?.uom) || "",
                    notes: "For WO shortage"
                }));
            setLines(lns);
        }
    }, [open, shortageRows]);

    const updateLine = (idx, patch) => setLines(ls => ls.map((l, i) => i === idx ? {...l, ...patch} : l));

    return (
        <Modal open={open} onClose={onClose} title="Create Purchase Order"
               footer={
                   <>
                       <button onClick={() => onCreate({vendor, expected, lines})}
                               className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm">
                           Create PO
                       </button>
                       <button onClick={onClose}
                               className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">Cancel
                       </button>
                   </>
               }>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Vendor</label>
                    <input value={vendor} onChange={e => setVendor(e.target.value)}
                           className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Expected Date</label>
                    <input type="date" value={expected} onChange={e => setExpected(e.target.value)}
                           className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                </div>
            </div>
            <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                <table className="min-w-full divide-y divide-gray-800 text-sm">
                    <thead className="bg-gray-900/80">
                    <tr>
                        <th className="px-4 py-3 text-left">Item</th>
                        <th className="px-4 py-3 text-left">Qty</th>
                        <th className="px-4 py-3 text-left">UoM</th>
                        <th className="px-4 py-3 text-left">Notes</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                    {lines.map((l, idx) => (
                        <tr key={l.itemId} className="hover:bg-gray-800/40">
                            <td className="px-4 py-3">
                                <div className="font-mono">{l.itemId}</div>
                                <div
                                    className="text-xs text-gray-400">{MOCK_ITEMS.find(i => i.id === l.itemId)?.name}</div>
                            </td>
                            <td className="px-4 py-3">
                                <input inputMode="decimal" value={l.qty}
                                       onChange={e => updateLine(idx, {qty: Number(e.target.value || 0)})}
                                       className="w-28 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </td>
                            <td className="px-4 py-3">
                                <input value={l.uom} onChange={e => updateLine(idx, {uom: e.target.value})}
                                       className="w-24 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </td>
                            <td className="px-4 py-3">
                                <input value={l.notes} onChange={e => updateLine(idx, {notes: e.target.value})}
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </td>
                        </tr>
                    ))}
                    {lines.length === 0 && <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-gray-400">No shortages</td>
                    </tr>}
                    </tbody>
                </table>
            </div>
        </Modal>
    );
}

// Close WO modal (Good / Scrap / Rework)
function CloseWoModal({open, onClose, plannedQty, onSubmit}) {
    const [good, setGood] = useState("");
    const [scrap, setScrap] = useState("");
    const [rework, setRework] = useState("");
    const [err, setErr] = useState("");

    useEffect(() => {
        if (open) {
            setGood("");
            setScrap("");
            setRework("");
            setErr("");
        }
    }, [open]);

    const validate = () => {
        const g = Number(good || 0), s = Number(scrap || 0), r = Number(rework || 0);
        if ([good, scrap, rework].some(v => v === "")) return "All fields are required.";
        if ([g, s, r].some(x => isNaN(x) || x < 0)) return "Quantities must be non-negative numbers.";
        if (g + s + r !== Number(plannedQty || 0)) return "Good + Scrap + Rework must equal planned Quantity.";
        return "";
    };

    const submit = () => {
        const v = validate();
        if (v) {
            setErr(v);
            return;
        }
        onSubmit({good: Number(good), scrap: Number(scrap), rework: Number(rework)});
    };

    return (
        <Modal open={open} onClose={onClose} title="Close Work Order — Record Results"
               footer={
                   <>
                       <button onClick={submit}
                               className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm">
                           Submit & Close WO
                       </button>
                       <button onClick={onClose}
                               className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">Cancel
                       </button>
                   </>
               }>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Good qty</label>
                    <input value={good} onChange={e => setGood(e.target.value)} inputMode="decimal"
                           className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Scrap qty</label>
                    <input value={scrap} onChange={e => setScrap(e.target.value)} inputMode="decimal"
                           className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Rework</label>
                    <input value={rework} onChange={e => setRework(e.target.value)} inputMode="decimal"
                           className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                </div>
            </div>
            <div className="text-xs text-gray-400 mt-3">
                Planned Quantity: <span className="text-gray-200">{plannedQty || 0}</span>
            </div>
            {err && <div
                className="mt-3 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">{err}</div>}
        </Modal>
    );
}

export default function WorkOrderDetailsPage() {
    const navigate = useNavigate();

    // ----- General form -----
    const [woId, setWoId] = useState(nextWO());
    const [parentItemId, setParentItemId] = useState("");
    const [qty, setQty] = useState("");
    const [status, setStatus] = useState("Draft");
    const [priority, setPriority] = useState("Medium");
    const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10));
    const [assignee, setAssignee] = useState("");
    const [notes, setNotes] = useState("");

    // Operations
    const [ops, setOps] = useState([
        {...newOpRow(), step: "10", workstation: "Assembly", setupMin: "15", runMinPer: "1.5"},
    ]);

    // Autosave
    const [dirty, setDirty] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const saveTimer = useRef(null);
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
    }, [woId, parentItemId, qty, status, priority, startDate, dueDate, assignee, notes, ops]);

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

    // Derived
    const qtyNum = Number(qty || 0);
    const parentItem = useMemo(() => MOCK_ITEMS.find(i => i.id === parentItemId) || null, [parentItemId]);

    // Requirements from BOM × WO qty
    const requirements = useMemo(() => {
        const bom = MOCK_BOMS[parentItemId] || [];
        return bom.map(b => ({itemId: b.itemId, required: (Number(b.qty) || 0) * (qtyNum || 0), per: b.qty}));
    }, [parentItemId, qtyNum]);

    // Buildable now (max units from available lots vs BOM)
    const buildableInfo = useMemo(() => {
        const bom = MOCK_BOMS[parentItemId] || [];
        if (bom.length === 0) return {max: 0, limiting: [], details: []};
        let maxUnits = Infinity;
        const details = bom.map(b => {
            const totalAvail = MOCK_LOTS.filter(l => l.itemId === b.itemId).reduce((s, l) => s + l.qty, 0);
            const per = Number(b.qty) || 0;
            const maxFromThis = per > 0 ? Math.floor(totalAvail / per) : Infinity;
            if (maxFromThis < maxUnits) maxUnits = maxFromThis;
            return {itemId: b.itemId, per, available: totalAvail, maxFromThis};
        });
        const limiting = details.filter(d => d.maxFromThis === maxUnits).map(d => d.itemId);
        return {max: Number.isFinite(maxUnits) ? maxUnits : 0, limiting, details};
    }, [parentItemId]);

    // Material cost (mock)
    const materialCost = useMemo(() => {
        return requirements.reduce((sum, r) => {
            const it = MOCK_ITEMS.find(i => i.id === r.itemId);
            return sum + (it ? (it.cost || 0) * r.required : 0);
        }, 0);
    }, [requirements]);

    const runtimeMin = useMemo(() => {
        return ops.reduce((sum, r) => {
            const setup = Number(r.setupMin || 0);
            const runPer = Number(r.runMinPer || 0);
            return sum + setup + runPer * qtyNum;
        }, 0);
    }, [ops, qtyNum]);

    // FEFO reservation state
    const [reservedLots, setReservedLots] = useState([]); // {itemId, lotId, expiry, qty}
    const [availabilityChecked, setAvailabilityChecked] = useState(false);
    const [lastAvailabilityResult, setLastAvailabilityResult] = useState(null);
    const [hasShortage, setHasShortage] = useState(false);

    // POs
    const [createdPOs, setCreatedPOs] = useState([]); // {poId, vendor, expected, lines}

    // Close WO result
    const [closeResult, setCloseResult] = useState(null); // {good, scrap, rework}

    // UI: modals & toasts
    const [showBomPicker, setShowBomPicker] = useState(false);
    const [showAvailability, setShowAvailability] = useState(false);
    const [poDraftRows, setPoDraftRows] = useState(null);
    const [showCreatePo, setShowCreatePo] = useState(false);
    const [showCloseWo, setShowCloseWo] = useState(false);
    const [toasts, setToasts] = useState([]);

    const addToast = (t) => {
        const id = crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2);
        setToasts(ts => [...ts, {id, ...t}]);
        setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 3500);
    };
    const dismissToast = (id) => setToasts(ts => ts.filter(t => t.id !== id));

    // Ops helpers & shortcuts
    const addOp = () => setOps(rs => [...rs, newOpRow()]);
    const cloneOp = (key) => setOps(rs => {
        const i = rs.findIndex(r => r.key === key);
        if (i === -1) return rs;
        const nr = {...rs[i], key: crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)};
        return [...rs.slice(0, i + 1), nr, ...rs.slice(i + 1)];
    });
    const removeOp = (key) => setOps(rs => rs.filter(r => r.key !== key));
    const updateOp = (key, patch) => setOps(rs => rs.map(r => r.key === key ? {...r, ...patch} : r));
    const opRef = useRef(null);
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Enter" && e.target?.dataset?.rowkey) {
                if (e.metaKey || e.ctrlKey) cloneOp(e.target.dataset.rowkey);
                else if (!e.shiftKey) addOp();
            }
            if (e.key === "Delete" && e.target?.dataset?.rowkey) removeOp(e.target.dataset.rowkey);
        };
        const b = opRef.current;
        b && b.addEventListener("keydown", handler);
        return () => {
            b && b.removeEventListener("keydown", handler);
        };
    }, []);

    // Validation
    const errors = useMemo(() => {
        const list = [];
        if (!woId) list.push("WO ID is required.");
        if (!parentItemId) list.push("Parent Item is required.");
        if (!qty || qtyNum <= 0) list.push("Quantity must be > 0.");
        if (startDate && dueDate && startDate > dueDate) list.push("Due date must be after start date.");
        ops.forEach((r, idx) => {
            if (!r.step) list.push(`Operation row ${idx + 1}: Step is required.`);
            if (!r.workstation) list.push(`Operation row ${idx + 1}: Workstation is required.`);
            if (Number(r.setupMin || 0) < 0) list.push(`Operation row ${idx + 1}: Setup cannot be negative.`);
            if (Number(r.runMinPer || 0) < 0) list.push(`Operation row ${idx + 1}: Run per unit cannot be negative.`);
        });
        return list;
    }, [woId, parentItemId, qty, qtyNum, startDate, dueDate, ops]);

    // Actions
    const saveDraft = () => {
        setLastSavedAt(new Date());
        setDirty(false);
        addToast({title: "Draft saved", message: `${woId} saved locally.`, variant: "success"});
    };

    const openAvailability = () => {
        if (!parentItemId || !qtyNum) {
            addToast({
                title: "Set Parent & Quantity",
                message: "Select a BOM and enter Quantity to check availability.",
                variant: "error"
            });
            return;
        }
        setShowAvailability(true);
    };

    const handleReserve = (rows) => {
        const allocations = rows.flatMap(r => r.allocations.map(a => ({
            itemId: r.itemId, lotId: a.lotId, expiry: a.expiry, qty: a.alloc
        })));
        setReservedLots(allocations);
        setAvailabilityChecked(true);
        const shortage = rows.some(r => r.shortage > 0);
        setHasShortage(shortage);
        setLastAvailabilityResult(rows);
        setShowAvailability(false);
        addToast({
            title: shortage ? "Partial reservation" : "Lots reserved",
            message: shortage ? "Shortages remain — consider creating a PO." : "All required components reserved (mock).",
            variant: shortage ? "" : "success"
        });
    };

    const handleCreatePoFromAvailability = (rows) => {
        setPoDraftRows(rows);
        setShowCreatePo(true);
    };

    const handleCreatePo = (payload) => {
        const poId = nextPO();
        const data = {poId, ...payload};
        setCreatedPOs(ps => [...ps, data]);
        setShowCreatePo(false);
        addToast({
            title: "PO created",
            message: `${poId} for ${payload.vendor} • ${payload.lines.length} line(s)`,
            variant: "success"
        });
    };
    const handleCloseWoSubmit = (res) => {
        setCloseResult(res);
        setStatus("Completed");
        setShowCloseWo(false);

        const planned = Number(qty || 0);
        const yieldPct = planned > 0 ? ((res.good / planned) * 100).toFixed(1) : "0.0";

        addToast({
            title: "WO completed",
            message: `Good ${res.good} • Scrap ${res.scrap} • Rework ${res.rework} • Yield ${yieldPct}%`,
            variant: "success",
        });
    };


    const releaseWO = () => {
        if (errors.length) {
            addToast({title: "Fix validation errors", message: "Resolve errors before release.", variant: "error"});
            return;
        }
        if (!availabilityChecked) {
            setShowAvailability(true);
            addToast({title: "Availability required", message: "Run FEFO availability before release.", variant: ""});
            return;
        }
        const shortageStill = (lastAvailabilityResult || []).some(r => r.shortage > 0);
        const hasCoveringPO = shortageStill && createdPOs.length > 0;
        if (shortageStill && !hasCoveringPO) {
            addToast({
                title: "Shortage detected",
                message: "Create a PO for deficits before release.",
                variant: "error"
            });
            return;
        }
        setStatus("Released");
        addToast({title: "Work order released", message: `${woId} moved to Released.`, variant: "success"});
    };

    const cancel = () => navigate("/work-orders");

    const openCloseWo = () => {
        if (status !== "Released" && status !== "In Progress") {
            addToast({
                title: "Cannot close",
                message: "Close is available when WO is Released or In Progress.",
                variant: "error"
            });
            return;
        }
        setShowCloseWo(true);
    };

    // Reset availability state when FG or qty changes
    useEffect(() => {
        setReservedLots([]);
        setAvailabilityChecked(false);
        setHasShortage(false);
        setLastAvailabilityResult(null);
    }, [parentItemId, qty]);

    const pill = (value, cls) => (
        <span className={`px-2 py-1 text-xs rounded-full ${cls}`}>{value}</span>
    );

    return (
        <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">New Work Order</h1>
                        <p className="mt-2 text-gray-400">Create and release a production order — start in Draft,
                            release when ready.</p>
                    </div>
                    {/* Right-aligned buttons (duplicate FEFO removed) */}
                    <div className="flex flex-wrap gap-3 ml-auto">
                        <button onClick={saveDraft}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">
                            Save Draft
                        </button>
                        <button onClick={releaseWO}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                                disabled={errors.length > 0}>
                            Release WO
                        </button>
                        <button onClick={openCloseWo}
                                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-sm">
                            Close WO
                        </button>
                        <button onClick={cancel}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">
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
            WO ID: <span className="font-mono text-gray-300">{woId}</span>
          </span>
                </div>
            </header>

            {/* Content */}
            <section className="mx-auto max-w-6xl px-4 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* General */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">General</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">WO ID</label>
                                <input value={woId} onChange={(e) => setWoId(e.target.value)}
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Parent Item / Finished Good</label>
                                <div className="flex gap-2">
                                    <input list="wo-items" value={parentItemId}
                                           onChange={(e) => setParentItemId(e.target.value)}
                                           placeholder="e.g. ITM-006"
                                           className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                    <button onClick={() => setShowBomPicker(true)}
                                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm whitespace-nowrap">
                                        Pick BOM
                                    </button>
                                </div>
                                <datalist id="wo-items">
                                    {MOCK_ITEMS.map(i => <option key={i.id}
                                                                 value={i.id}>{`${i.id} — ${i.name}`}</option>)}
                                </datalist>
                                {parentItem && (
                                    <div className="mt-1 text-xs text-gray-500 flex items-center gap-3">
                                        <span>{parentItem.name} • UoM: {parentItem.uom} • Status: {parentItem.status}</span>
                                        <a href={`/boms/${parentItemId}`}
                                           className="text-sky-300 hover:text-sky-200 underline offset-2"
                                           onClick={(e) => e.preventDefault()}>
                                            View BOM
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                                <input inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)}
                                       placeholder="0"
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Priority</label>
                                <select value={priority} onChange={(e) => setPriority(e.target.value)}
                                        className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm">
                                    <option>Low</option>
                                    <option>Medium</option>
                                    <option>High</option>
                                    <option>Rush</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Status</label>
                                <select value={status} onChange={(e) => setStatus(e.target.value)}
                                        className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm">
                                    <option>Draft</option>
                                    <option>Released</option>
                                    <option>In Progress</option>
                                    <option>Completed</option>
                                    <option>Hold</option>
                                    <option>Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Assignee</label>
                                <input value={assignee} onChange={(e) => setAssignee(e.target.value)}
                                       placeholder="e.g. K. Adams"
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Due Date</label>
                                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)}
                                          placeholder="Optional shop traveler notes."
                                          className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>
                        </div>
                    </div>

                    {/* BOM */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-semibold text-white">Bill of Materials</h2>
                                {/* Buildable now badge (compact) */}
                                {parentItemId && (
                                    <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-gray-800 border border-white/10">
                      Buildable now: <span className="text-gray-200 font-semibold">{buildableInfo.max}</span>
                    </span>
                                        {buildableInfo.limiting.length > 0 && (
                                            <span className="text-gray-400">
                        limit: {buildableInfo.limiting.join(", ")}
                      </span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <button onClick={() => setShowBomPicker(true)}
                                        className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700">
                                    Select / Search BOM
                                </button>
                                <button onClick={openAvailability}
                                        className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                                    Check & Reserve
                                </button>
                            </div>
                        </div>

                        {/* Buildable details panel */}
                        {parentItemId && (
                            <div className="mb-3 rounded-xl bg-gray-900/50 border border-white/10 p-3">
                                <div className="text-sm text-gray-300">
                                    You can make <span
                                    className="font-semibold text-gray-100">{buildableInfo.max}</span> unit(s) now with
                                    current lots.
                                </div>
                                {buildableInfo.details.length > 0 && (
                                    <div className="mt-2 overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-800 text-xs">
                                            <thead className="bg-gray-900/60">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Component</th>
                                                <th className="px-3 py-2 text-left">Avail</th>
                                                <th className="px-3 py-2 text-left">Per FG</th>
                                                <th className="px-3 py-2 text-left">Max Units by This</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800">
                                            {buildableInfo.details.map(d => {
                                                const it = MOCK_ITEMS.find(i => i.id === d.itemId);
                                                const isLimit = buildableInfo.limiting.includes(d.itemId);
                                                return (
                                                    <tr key={d.itemId} className={isLimit ? "bg-red-500/5" : ""}>
                                                        <td className="px-3 py-2">
                                                            <div className="font-mono">{d.itemId}</div>
                                                            <div className="text-[11px] text-gray-400">{it?.name}</div>
                                                        </td>
                                                        <td className="px-3 py-2">{d.available} <span
                                                            className="text-[11px] text-gray-400">{it?.uom}</span></td>
                                                        <td className="px-3 py-2">{d.per}</td>
                                                        <td className="px-3 py-2">
                                <span className={classNames(
                                    "px-2 py-0.5 rounded-full",
                                    isLimit ? "bg-red-600/30 text-red-200" : "bg-gray-700/40 text-gray-200"
                                )}>
                                  {d.maxFromThis}
                                </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                            <table className="min-w-full divide-y divide-gray-800 text-sm">
                                <thead className="bg-gray-900/80">
                                <tr>
                                    <th className="px-4 py-3 text-left">Component Item</th>
                                    <th className="px-4 py-3 text-left">Qty per</th>
                                    <th className="px-4 py-3 text-left">Required (Qty × Per)</th>
                                    <th className="px-4 py-3 text-left">UoM</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {(MOCK_BOMS[parentItemId] || []).map((b) => {
                                    const it = MOCK_ITEMS.find(i => i.id === b.itemId);
                                    const required = (Number(b.qty) || 0) * (qtyNum || 0);
                                    return (
                                        <tr key={b.itemId} className="hover:bg-gray-800/40 transition">
                                            <td className="px-4 py-3">
                                                <div className="font-mono">{b.itemId}</div>
                                                <div className="text-xs text-gray-500">{it?.name}</div>
                                            </td>
                                            <td className="px-4 py-3">{b.qty}</td>
                                            <td className="px-4 py-3">{required}</td>
                                            <td className="px-4 py-3">{it?.uom}</td>
                                        </tr>
                                    );
                                })}
                                {(!parentItemId || (MOCK_BOMS[parentItemId] || []).length === 0) && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-center text-gray-400">Pick a BOM to
                                            see components.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>

                        {/* Reserved lots summary */}
                        <div className="mt-4">
                            <h3 className="text-sm font-semibold text-gray-200 mb-2">Reserved Lots (Traceability)</h3>
                            {reservedLots.length === 0 ? (
                                <div className="text-xs text-gray-500">No lots reserved yet. Run <span
                                    className="text-gray-300">Check &amp; Reserve</span>.</div>
                            ) : (
                                <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                                    <table className="min-w-full divide-y divide-gray-800 text-sm">
                                        <thead className="bg-gray-900/80">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Item</th>
                                            <th className="px-4 py-3 text-left">Lot</th>
                                            <th className="px-4 py-3 text-left">Expiry</th>
                                            <th className="px-4 py-3 text-left">Qty</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                        {reservedLots.map((r, idx) => (
                                            <tr key={`${r.itemId}-${r.lotId}-${idx}`}>
                                                <td className="px-4 py-3 font-mono">{r.itemId}</td>
                                                <td className="px-4 py-3 font-mono">{r.lotId}</td>
                                                <td className="px-4 py-3">{r.expiry}</td>
                                                <td className="px-4 py-3">{r.qty}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Operations */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-white">Operations</h2>
                            <div className="flex items-center gap-2 text-sm">
                                <button onClick={addOp}
                                        className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700">
                                    + Add Operation
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                            <table ref={opRef} className="min-w-full divide-y divide-gray-800 text-sm">
                                <thead className="bg-gray-900/80">
                                <tr>
                                    <th className="px-4 py-3 text-left">Step</th>
                                    <th className="px-4 py-3 text-left">Workstation</th>
                                    <th className="px-4 py-3 text-left">Setup (min)</th>
                                    <th className="px-4 py-3 text-left">Run / Unit (min)</th>
                                    <th className="px-4 py-3 text-left">Notes</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {ops.map((r) => {
                                    const setup = Number(r.setupMin || 0);
                                    const run = Number(r.runMinPer || 0);
                                    const total = setup + run * qtyNum;
                                    return (
                                        <tr key={r.key} className="hover:bg-gray-800/40 transition">
                                            <td className="px-4 py-3">
                                                <input data-rowkey={r.key} data-table="ops"
                                                       value={r.step}
                                                       onChange={(e) => updateOp(r.key, {step: e.target.value})}
                                                       placeholder="10"
                                                       className="w-24 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input data-rowkey={r.key} data-table="ops"
                                                       value={r.workstation}
                                                       onChange={(e) => updateOp(r.key, {workstation: e.target.value})}
                                                       placeholder="Assembly / Paint / QA"
                                                       className="w-48 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input data-rowkey={r.key} data-table="ops" inputMode="decimal"
                                                       value={r.setupMin}
                                                       onChange={(e) => updateOp(r.key, {setupMin: e.target.value})}
                                                       placeholder="0"
                                                       className="w-28 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input data-rowkey={r.key} data-table="ops" inputMode="decimal"
                                                       value={r.runMinPer}
                                                       onChange={(e) => updateOp(r.key, {runMinPer: e.target.value})}
                                                       placeholder="0.0"
                                                       className="w-28 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input data-rowkey={r.key} data-table="ops"
                                                       value={r.notes}
                                                       onChange={(e) => updateOp(r.key, {notes: e.target.value})}
                                                       placeholder="Optional notes"
                                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs text-gray-400">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="hidden md:inline">Est: <span
                                                        className="text-gray-300">{total.toFixed(1)} min</span></span>
                                                    <button onClick={() => cloneOp(r.key)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs bg-gray-800/60 border-white/10 hover:bg-gray-700/60">Clone
                                                    </button>
                                                    <button onClick={() => removeOp(r.key)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20">Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 text-xs text-gray-500">
                            Shortcuts: <span className="text-gray-300">Enter</span> add operation • <span
                            className="text-gray-300">Ctrl/⌘+D</span> duplicate • <span
                            className="text-gray-300">Delete</span> remove
                        </div>
                    </div>

                    {/* Attachments (placeholder) */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">Attachments</h2>
                        <div className="text-sm text-gray-400">Upload drawings/specs here in the future. (Placeholder)
                        </div>
                    </div>

                    {/* Error summary */}
                    {errors.length > 0 && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
                            <div className="font-semibold text-red-300 mb-1">Please fix the following before release:
                            </div>
                            <ul className="list-disc pl-5 space-y-1 text-red-200">
                                {errors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Right column: sticky summary */}
                <aside className="lg:sticky lg:top-6 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h3 className="text-base font-semibold text-white">Summary</h3>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">BOM</div>
                                <div className="text-sm text-gray-200 min-h-[20px]">
                                    {parentItem ? <a href={`/boms/${parentItemId}`} onClick={(e) => e.preventDefault()}
                                                     className="text-sky-300 hover:text-sky-200 underline">{parentItem.id} — {parentItem.name}</a> :
                                        <span className="text-gray-500">(not set)</span>}
                                </div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Quantity</div>
                                <div className="text-lg font-semibold text-gray-100">{qty || 0}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Buildable Now</div>
                                <div
                                    className="text-lg font-semibold text-gray-100">{parentItemId ? buildableInfo.max : "-"}</div>
                                {buildableInfo.limiting.length > 0 && (
                                    <div
                                        className="text-[11px] text-gray-400 mt-1">Limit: {buildableInfo.limiting.join(", ")}</div>
                                )}
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Mat. Cost (mock)</div>
                                <div className="text-lg font-semibold text-gray-100">€{materialCost.toFixed(2)}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Est. Runtime</div>
                                <div className="text-lg font-semibold text-gray-100">{runtimeMin.toFixed(1)} min</div>
                            </div>
                            <div
                                className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Priority</span>
                                    {pill(priority,
                                        priority === "Rush" ? "bg-red-600/30 text-red-300" :
                                            priority === "High" ? "bg-orange-600/30 text-orange-300" :
                                                priority === "Medium" ? "bg-sky-600/30 text-sky-300" :
                                                    "bg-gray-600/30 text-gray-300")}
                                </div>
                                <div className="text-xs text-gray-400">Due <span
                                    className="text-gray-200">{dueDate || "-"}</span></div>
                            </div>

                            {/* Availability / Reservation status */}
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2">
                                <div className="text-xs text-gray-400 mb-1">Availability</div>
                                {availabilityChecked ? (
                                    <div className="flex items-center gap-2">
                                        {hasShortage
                                            ? pill("Shortage", "bg-red-600/30 text-red-200")
                                            : pill("All reserved", "bg-emerald-600/30 text-emerald-200")}
                                        <span className="text-xs text-gray-400">
                      {reservedLots.length} lot(s) reserved
                    </span>
                                    </div>
                                ) : <span className="text-xs text-gray-500">Not checked</span>}
                            </div>

                            {/* Close summary */}
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2">
                                <div className="text-xs text-gray-400 mb-1">Completion</div>
                                {closeResult ? (
                                    <div className="text-sm">
                                        Good <span className="text-gray-200">{closeResult.good}</span> •
                                        Scrap <span className="text-gray-200">{closeResult.scrap}</span> •
                                        Rework <span className="text-gray-200">{closeResult.rework}</span>
                                    </div>
                                ) : <span className="text-xs text-gray-500">Not closed</span>}
                            </div>

                            {/* POs */}
                            {createdPOs.length > 0 && (
                                <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2">
                                    <div className="text-xs text-gray-400 mb-1">Linked POs (mock)</div>
                                    <ul className="text-sm list-disc pl-5 space-y-1">
                                        {createdPOs.map(po => (
                                            <li key={po.poId}>
                                                <span
                                                    className="font-mono">{po.poId}</span> — {po.vendor} • {po.lines.length} line(s)
                                                • ETA {po.expected}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 text-xs text-gray-400">
                        <div className="font-semibold text-gray-300 mb-2">Tips</div>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Select a BOM via the picker; components appear from its structure (mock).</li>
                            <li><span className="text-gray-300">Buildable now</span> shows the max units you can produce
                                with current inventory.
                            </li>
                            <li>Use <span className="text-gray-300">Check &amp; Reserve</span> to allocate FEFO lots and
                                see shortages.
                            </li>
                            <li>Create a PO for any deficit before releasing.</li>
                            <li>Close WO requires Good / Scrap / Rework that sum to planned Quantity.</li>
                        </ul>
                    </div>
                </aside>
            </section>

            {/* Modals */}
            <BomPickerModal
                open={showBomPicker}
                onClose={() => setShowBomPicker(false)}
                onPick={(fgId) => {
                    setParentItemId(fgId);
                    setShowBomPicker(false);
                }}
                items={MOCK_ITEMS}
                boms={MOCK_BOMS}
            />

            <AvailabilityModal
                open={showAvailability}
                onClose={() => setShowAvailability(false)}
                requirements={requirements}
                lots={MOCK_LOTS}
                onReserve={handleReserve}
                onCreatePO={handleCreatePoFromAvailability}
            />

            <CreatePoModal
                open={showCreatePo}
                onClose={() => setShowCreatePo(false)}
                shortageRows={poDraftRows}
                onCreate={handleCreatePo}
            />

            <CloseWoModal
                open={showCloseWo}
                onClose={() => setShowCloseWo(false)}
                plannedQty={qtyNum}
                onSubmit={handleCloseWoSubmit}
            />

            {/* Toasts */}
            <Toasts toasts={toasts} dismiss={dismissToast}/>
        </div>
    );
}

export {WorkOrderDetailsPage};
