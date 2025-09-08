import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";

/**
 * WorkOrderCreationPage — React + Tailwind (plain JS)
 * Adjusted per request:
 * - Only Save + Cancel in header + Operations button (navigate to /work-orders/{id}/operations)
 * - Remove Release / Close actions and Operations editor section
 * - BOM picker separated from Parent Item (own picker modal). Selecting BOM sets Parent, but Parent can be changed.
 * - BOM modal: search + pagination (mock data unchanged)
 * - Availability: on shortage, redirect to Purchasing page instead of creating PO
 * - Summary contains BOM and Parent as separate fields
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

// Pagination footer
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

// BOM search & select modal (with search + pagination)
function BomPickerModal({open, onClose, onPick, items, boms}) {
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const allRows = useMemo(() => {
        const fgIds = Object.keys(boms);
        return fgIds.map(id => {
            const it = items.find(i => i.id === id);
            const comps = (boms[id] || []).map(b => b.itemId).join(", ");
            return {id, name: it?.name || "(unknown)", uom: it?.uom || "", comps};
        });
    }, [items, boms]);

    const filtered = useMemo(() => {
        if (!q) return allRows;
        const qq = q.toLowerCase();
        return allRows.filter(r =>
            r.id.toLowerCase().includes(qq) ||
            r.name.toLowerCase().includes(qq) ||
            r.comps.toLowerCase().includes(qq)
        );
    }, [q, allRows]);

    const start = (page - 1) * pageSize;
    const pageRows = filtered.slice(start, start + pageSize);
    useEffect(() => {
        setPage(1);
    }, [q, pageSize, open]);

    return (
        <Modal open={open} onClose={onClose} title="Select Bill of Materials" footer={
            <button onClick={onClose}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">Close</button>
        }>
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
                    {pageRows.map(r => (
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
                    {pageRows.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-4 py-6 text-center text-gray-400">No matches</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
            <Pager page={page} pageSize={pageSize} total={filtered.length}
                   onPage={setPage} onPageSize={setPageSize}/>
            <div className="mt-2 text-xs text-gray-400">Tip: type components (e.g. “ITM-009”) to find BOMs using them.
            </div>
        </Modal>
    );
}

// Item picker (Parent Item) with search + pagination
function ItemPickerModal({open, onClose, onPick, items}) {
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
        <Modal open={open} onClose={onClose} title="Select Parent Item" footer={
            <button onClick={onClose}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">Close</button>
        }>
            <div className="mb-3">
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by ID, name, UoM, status"
                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
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
                                <button onClick={() => onPick(it.id)}
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
            <Pager page={page} pageSize={pageSize} total={filtered.length}
                   onPage={setPage} onPageSize={setPageSize}/>
        </Modal>
    );
}

// Availability/Reservation modal
function AvailabilityModal({open, onClose, requirements, lots, onReserve, onGoPurchasing}) {
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
                           <button onClick={() => onGoPurchasing()}
                                   className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm">
                               Go to Purchasing
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

export default function WorkOrderDetailsPage() {
    const navigate = useNavigate();

    // ----- General form -----
    const [woId, setWoId] = useState(nextWO());

    // Separate BOM FG and Parent Item
    const [bomFgId, setBomFgId] = useState("");
    const [parentItemId, setParentItemId] = useState("");

    const [qty, setQty] = useState("");
    const [status, setStatus] = useState("Draft");
    const [priority, setPriority] = useState("Medium");
    const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10));
    const [assignee, setAssignee] = useState("");
    const [notes, setNotes] = useState("");

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
    }, [woId, bomFgId, parentItemId, qty, status, priority, startDate, dueDate, assignee, notes]);

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
    const bomForParent = useMemo(() => MOCK_BOMS[bomFgId] || [], [bomFgId]);
    const parentItem = useMemo(() => MOCK_ITEMS.find(i => i.id === parentItemId) || null, [parentItemId]);

    // Requirements from BOM × WO qty (based on selected BOM)
    const requirements = useMemo(() => {
        return (MOCK_BOMS[bomFgId] || []).map(b => ({
            itemId: b.itemId,
            required: (Number(b.qty) || 0) * (qtyNum || 0),
            per: b.qty
        }));
    }, [bomFgId, qtyNum]);

    // Buildable now (max units from available lots vs BOM)
    const buildableInfo = useMemo(() => {
        const bom = MOCK_BOMS[bomFgId] || [];
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
    }, [bomFgId]);

    // Material cost (mock)
    const materialCost = useMemo(() => {
        return requirements.reduce((sum, r) => {
            const it = MOCK_ITEMS.find(i => i.id === r.itemId);
            return sum + (it ? (it.cost || 0) * r.required : 0);
        }, 0);
    }, [requirements]);

    // FEFO reservation state
    const [reservedLots, setReservedLots] = useState([]); // {itemId, lotId, expiry, qty}
    const [availabilityChecked, setAvailabilityChecked] = useState(false);
    const [lastAvailabilityResult, setLastAvailabilityResult] = useState(null);
    const [hasShortage, setHasShortage] = useState(false);

    // UI: modals & toasts
    const [showBomPicker, setShowBomPicker] = useState(false);
    const [showItemPicker, setShowItemPicker] = useState(false);
    const [showAvailability, setShowAvailability] = useState(false);
    const [toasts, setToasts] = useState([]);

    const addToast = (t) => {
        const id = crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2);
        setToasts(ts => [...ts, {id, ...t}]);
        setTimeout(() => setToasts(ts => ts.filter(x => x.id !== id)), 3500);
    };
    const dismissToast = (id) => setToasts(ts => ts.filter(t => t.id !== id));

    // Validation (minimal)
    const errors = useMemo(() => {
        const list = [];
        if (!woId) list.push("WO ID is required.");
        if (!bomFgId) list.push("BOM (Finished Good) is required.");
        if (!parentItemId) list.push("Parent Item is required.");
        if (!qty || qtyNum <= 0) list.push("Quantity must be > 0.");
        if (startDate && dueDate && startDate > dueDate) list.push("Due date must be after start date.");
        return list;
    }, [woId, bomFgId, parentItemId, qty, qtyNum, startDate, dueDate]);

    // Actions
    const saveDraft = () => {
        setLastSavedAt(new Date());
        setDirty(false);
        addToast({title: "Draft saved", message: `${woId} saved locally.`, variant: "success"});
    };

    const openAvailability = () => {
        if (!bomFgId || !qtyNum) {
            addToast({
                title: "Set BOM & Quantity",
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
            message: shortage ? "Shortages remain — go to Purchasing to cover deficits." : "All required components reserved (mock).",
            variant: shortage ? "" : "success"
        });
    };

    const gotoPurchasing = () => {
        navigate("/purchasing");
    };

    const cancel = () => navigate("/work-orders");

    const gotoOperations = () => {
        navigate(`/work-orders/${woId}/operations`);
    };

    // Reset availability state when BOM or qty changes
    useEffect(() => {
        setReservedLots([]);
        setAvailabilityChecked(false);
        setHasShortage(false);
        setLastAvailabilityResult(null);
    }, [bomFgId, qty]);

    const pill = (value, cls) => (
        <span className={`px-2 py-1 text-xs rounded-full ${cls}`}>{value}</span>
    );

    return (
        <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">New Work Order</h1>
                        <p className="mt-2 text-gray-400">Create a production order. Adjust status as needed.</p>
                    </div>
                    {/* Right-aligned buttons: Operations + Save + Cancel */}
                    <div className="flex flex-wrap gap-3 ml-auto">
                        <button onClick={gotoOperations}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm">
                            Operations
                        </button>
                        <button onClick={saveDraft}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">
                            Save
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
            <section className="mx-auto px-4 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
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

                            {/* BOM (separate field) */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">BOM (Finished Good)</label>
                                <div className="flex gap-2">
                                    <input value={bomFgId}
                                           onChange={(e) => setBomFgId(e.target.value)}
                                           placeholder="e.g. ITM-006"
                                           className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                    <button onClick={() => setShowBomPicker(true)}
                                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm whitespace-nowrap">
                                        Pick BOM
                                    </button>
                                </div>
                                {bomFgId && (
                                    <div className="mt-1 text-xs text-gray-500 flex items-center gap-3">
                                        <a href={`/boms/${bomFgId}`}
                                           className="text-sky-300 hover:text-sky-200 underline offset-2"
                                           onClick={(e) => e.preventDefault()}>
                                            View BOM
                                        </a>
                                        <span className="text-gray-400">Selecting a BOM will set Parent Item if empty (you can still override Parent).</span>
                                    </div>
                                )}
                            </div>

                            {/* Parent Item (separate + picker) */}
                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Parent Item / Finished Good</label>
                                <div className="flex gap-2">
                                    <input value={parentItemId}
                                           onChange={(e) => setParentItemId(e.target.value)}
                                           placeholder="e.g. ITM-006"
                                           className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                    <button onClick={() => setShowItemPicker(true)}
                                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm whitespace-nowrap">
                                        Pick Parent
                                    </button>
                                </div>
                                {parentItem && (
                                    <div className="mt-1 text-xs text-gray-500">
                                        {parentItem.name} • UoM: {parentItem.uom} • Status: {parentItem.status}
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

                    {/* BOM Components & Availability */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-semibold text-white">Bill of Materials</h2>
                                {/* Buildable now badge (compact) */}
                                {bomFgId && (
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
                        {bomFgId && (
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
                                {(bomForParent || []).map((b) => {
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
                                {(!bomFgId || (bomForParent || []).length === 0) && (
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

                    {/* Attachments (placeholder) */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">Attachments</h2>
                        <div className="text-sm text-gray-400">Upload drawings/specs here in the future. (Placeholder)
                        </div>
                    </div>

                    {/* Error summary */}
                    {errors.length > 0 && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
                            <div className="font-semibold text-red-300 mb-1">Please fix the following:</div>
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
                                    {bomFgId ? (
                                        <a href={`/boms/${bomFgId}`} onClick={(e) => e.preventDefault()}
                                           className="text-sky-300 hover:text-sky-200 underline">{bomFgId}</a>
                                    ) : <span className="text-gray-500">(not set)</span>}
                                </div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Parent Item</div>
                                <div className="text-sm text-gray-200 min-h-[20px]">
                                    {parentItem ? `${parentItem.id} — ${parentItem.name}` :
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
                                    className="text-lg font-semibold text-gray-100">{bomFgId ? buildableInfo.max : "-"}</div>
                                {buildableInfo.limiting.length > 0 && (
                                    <div
                                        className="text-[11px] text-gray-400 mt-1">Limit: {buildableInfo.limiting.join(", ")}</div>
                                )}
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Mat. Cost (mock)</div>
                                <div className="text-lg font-semibold text-gray-100">€{materialCost.toFixed(2)}</div>
                            </div>
                            <div
                                className="rounded-2xl bg-gray-800/60 p-3 border border-white/10 col-span-2 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Priority</span>
                                    {(() => {
                                        const v = priority;
                                        const cls =
                                            v === "Rush" ? "bg-red-600/30 text-red-300" :
                                                v === "High" ? "bg-orange-600/30 text-orange-300" :
                                                    v === "Medium" ? "bg-sky-600/30 text-sky-300" :
                                                        "bg-gray-600/30 text-gray-300";
                                        return <span className={`px-2 py-1 text-xs rounded-full ${cls}`}>{v}</span>;
                                    })()}
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
                                            ? <span
                                                className="px-2 py-1 text-xs rounded-full bg-red-600/30 text-red-200">Shortage</span>
                                            : <span
                                                className="px-2 py-1 text-xs rounded-full bg-emerald-600/30 text-emerald-200">All reserved</span>}
                                        <span className="text-xs text-gray-400">
                      {reservedLots.length} lot(s) reserved
                    </span>
                                    </div>
                                ) : <span className="text-xs text-gray-500">Not checked</span>}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 text-xs text-gray-400">
                        <div className="font-semibold text-gray-300 mb-2">Tips</div>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Select a BOM; components appear from its structure (mock).</li>
                            <li>Picking a BOM sets Parent if it’s empty; you can still override the Parent Item.</li>
                            <li>Use <span className="text-gray-300">Check &amp; Reserve</span> to allocate FEFO lots and
                                see shortages.
                            </li>
                            <li>If there’s a shortage, use the header’s status or navigate to Purchasing to cover it.
                            </li>
                        </ul>
                    </div>
                </aside>
            </section>

            {/* Modals */}
            <BomPickerModal
                open={showBomPicker}
                onClose={() => setShowBomPicker(false)}
                onPick={(fgId) => {
                    setBomFgId(fgId);
                    // If Parent not set or equals previous BOM, align it to selected BOM
                    setParentItemId(prev => prev ? prev : fgId);
                    setShowBomPicker(false);
                }}
                items={MOCK_ITEMS}
                boms={MOCK_BOMS}
            />

            <ItemPickerModal
                open={showItemPicker}
                onClose={() => setShowItemPicker(false)}
                onPick={(itemId) => {
                    setParentItemId(itemId);
                    setShowItemPicker(false);
                }}
                items={MOCK_ITEMS}
            />

            <AvailabilityModal
                open={showAvailability}
                onClose={() => setShowAvailability(false)}
                requirements={requirements}
                lots={MOCK_LOTS}
                onReserve={handleReserve}
                onGoPurchasing={gotoPurchasing}
            />

            {/* Toasts */}
            <Toasts toasts={toasts} dismiss={dismissToast}/>
        </div>
    );
}

export {WorkOrderDetailsPage};
