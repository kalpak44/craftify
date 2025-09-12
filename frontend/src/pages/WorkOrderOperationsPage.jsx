// WorkOrderOperationsPage.jsx
import React, {useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";

const STATUS_LIST = ["Open", "In Progress", "Hold", "Completed"];
const PRIORITY_CLS = {
    Low: "bg-gray-600/30 text-gray-300",
    Medium: "bg-sky-600/30 text-sky-300",
    High: "bg-orange-600/30 text-orange-300",
    Rush: "bg-red-600/30 text-red-300",
};
const PRIORITY_BORDER = {
    Low: "border-l-gray-500",
    Medium: "border-l-sky-500",
    High: "border-l-orange-500",
    Rush: "border-l-red-500",
};
const PRIORITY_DOT = {
    Low: "bg-gray-400",
    Medium: "bg-sky-400",
    High: "bg-orange-400",
    Rush: "bg-red-400",
};

const pill = (value, map) => (
    <span className={`px-2 py-1 text-xs rounded-full ${map[value] || "bg-gray-600/30 text-gray-300"}`}>{value}</span>
);

// Tiny icons
const IconInfo = (props) => (
    <svg viewBox="0 0 24 24" className={props.className || "h-4 w-4"} fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="9" strokeWidth="1.5"/>
        <path d="M12 8h.01M11 12h1v4h1" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
);
const IconCheck = (props) => (
    <svg viewBox="0 0 24 24" className={props.className || "h-4 w-4"} fill="none" stroke="currentColor">
        <path d="M20 6L9 17l-5-5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);
const IconTrash = (props) => (
    <svg viewBox="0 0 24 24" className={props.className || "h-4 w-4"} fill="none" stroke="currentColor">
        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10L18 6" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
);

// Minimal modal shell
function Modal({open, title, onClose, children, footer}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50">
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

// Compute produced from consumption vs BOM per-qty: min floor(consumed/per)
// (kept for potential future use; not used in the simplified Complete modal)
const calcProducedFromConsumption = (rows) => {
    if (!rows || rows.length === 0) return 0;
    let minKits = Infinity;
    for (const r of rows) {
        const per = Number(r.per || 0);
        const consumed = Number(r.consumed || 0);
        if (per <= 0) continue;
        const kits = Math.floor(consumed / per);
        if (kits < minKits) minKits = kits;
    }
    return Number.isFinite(minKits) ? Math.max(0, minKits) : 0;
};

const WorkOrderOperationsPage = () => {
    const {id: woId} = useParams();
    const navigate = useNavigate();

    // ---- Work Order Plan (mocked here; hydrate from WO details in real app)
    const [woPlan] = useState(() => ({
        startDate: "2025-02-18",
        dueDate: "2025-02-25",
        itemId: "ITM-002",
        itemName: "Large Widget",
        expectedQty: 10
    }));

    // Seed example BOM & op-local tracking fields
    const seedBom = (mult = 1) => ([
        {itemId: "ITM-003", name: "Plastic Case", per: 1 * mult, consumed: 0, scrap: 0},
        {itemId: "ITM-009", name: "Screws M3×8", per: 6 * mult, consumed: 0, scrap: 0},
        {itemId: "ITM-007", name: "Steel Frame", per: 1 * mult, consumed: 0, scrap: 0},
    ]);

    const initialOps = [
        {
            id: "OP-0001",
            title: "Cut raw sheets",
            status: "Open",
            priority: "High",
            estimate: "6h",
            assignee: "Alice Chen",
            updated: "2025-02-18",
            bom: seedBom(1),
            producedQty: null,
            varianceNote: "",
            holdReason: null,
            holdHistory: []
        },
        {
            id: "OP-0002",
            title: "CNC milling",
            status: "In Progress",
            priority: "Rush",
            estimate: "10h",
            assignee: "Bob Martin",
            updated: "2025-02-19",
            bom: seedBom(1),
            producedQty: null,
            varianceNote: "",
            holdReason: null,
            holdHistory: []
        },
        {
            id: "OP-0003",
            title: "Anodize frame",
            status: "Hold",
            priority: "Medium",
            estimate: "2d",
            assignee: "Carla Diaz",
            updated: "2025-02-17",
            bom: seedBom(1),
            producedQty: null,
            varianceNote: "",
            holdReason: "Awaiting line availability",
            holdHistory: [{reason: "Awaiting line availability", at: "2025-02-17"}]
        },
        {
            id: "OP-0004",
            title: "Sub-assembly QA",
            status: "Open",
            priority: "Low",
            estimate: "3h",
            assignee: "Deepak Rao",
            updated: "2025-02-18",
            bom: seedBom(1),
            producedQty: null,
            varianceNote: "",
            holdReason: null,
            holdHistory: []
        },
        {
            id: "OP-0005",
            title: "Final assembly",
            status: "In Progress",
            priority: "High",
            estimate: "1d",
            assignee: "Alice Chen",
            updated: "2025-02-19",
            bom: seedBom(2),
            producedQty: null,
            varianceNote: "",
            holdReason: null,
            holdHistory: []
        },
        {
            id: "OP-0006",
            title: "Packaging",
            status: "Completed",
            priority: "Low",
            estimate: "4h",
            assignee: "Bob Martin",
            updated: "2025-02-16",
            bom: seedBom(1).map(r => ({...r, consumed: r.per, scrap: 0})),
            producedQty: 1,
            varianceNote: "",
            holdReason: null,
            holdHistory: []
        },
        {
            id: "OP-0007",
            title: "Labeling & docs",
            status: "Open",
            priority: "Medium",
            estimate: "5h",
            assignee: "Carla Diaz",
            updated: "2025-02-18",
            bom: seedBom(1),
            producedQty: null,
            varianceNote: "",
            holdReason: null,
            holdHistory: []
        },
    ];

    // --- State
    const [ops, setOps] = useState(initialOps);
    const [dragOverCol, setDragOverCol] = useState(null);
    const [editing, setEditing] = useState(null); // { id, field } | null
    const [query, setQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [assigneeFilter, setAssigneeFilter] = useState("all");

    // Action modals
    const [holdModal, setHoldModal] = useState({open: false, opId: null, reason: "", viewOnly: false});

    // Simplified Complete modal state (no calculations)
    const [completeModal, setCompleteModal] = useState({
        open: false,
        opId: null,
        draftRows: [],
        produced: 0,
        notes: "",
        viewOnly: false,
        targetStatus: "Completed"
    });

    // Release modal state (from previous update)
    const [releaseModal, setReleaseModal] = useState({
        open: false,
        title: "",
        variant: "info",
        proceedLabel: "",
        pending: [],
        releaseQty: 0,
        expiryDate: "",
    });

    // --- Derived
    const assignees = useMemo(
        () => Array.from(new Set(ops.map((o) => o.assignee))).sort(),
        [ops]
    );
    const filtered = useMemo(() => {
        let data = ops;
        if (query) {
            const q = query.toLowerCase();
            data = data.filter(
                (o) =>
                    o.title.toLowerCase().includes(q) ||
                    o.id.toLowerCase().includes(q) ||
                    o.assignee.toLowerCase().includes(q)
            );
        }
        if (priorityFilter !== "all") data = data.filter((o) => o.priority === priorityFilter);
        if (assigneeFilter !== "all") data = data.filter((o) => o.assignee === assigneeFilter);
        return data;
    }, [ops, query, priorityFilter, assigneeFilter]);

    const totals = useMemo(() => {
        const by = STATUS_LIST.reduce((acc, s) => ({...acc, [s]: filtered.filter(o => o.status === s).length}), {});
        const all = filtered.length;
        const done = by["Completed"] || 0;
        const pct = all ? Math.round((done / all) * 100) : 0;
        return {by, all, done, pct};
    }, [filtered]);

    // Output progress vs expected
    const producedSoFar = useMemo(
        () => ops.filter(o => o.status === "Completed").reduce((s, o) => s + (Number(o.producedQty || 0)), 0),
        [ops]
    );
    const expectedQty = Number(woPlan.expectedQty || 0);
    const outputPct = expectedQty > 0 ? Math.min(100, Math.round((producedSoFar / expectedQty) * 100)) : 0;

    // Aggregated BOM (consumed/scrap across ops) for release modal
    const aggregatedBom = useMemo(() => {
        const map = new Map();
        for (const o of ops) {
            for (const r of (o.bom || [])) {
                const key = r.itemId;
                const current = map.get(key) || {itemId: r.itemId, name: r.name || "", consumed: 0, scrap: 0};
                current.consumed += Number(r.consumed || 0);
                current.scrap += Number(r.scrap || 0);
                map.set(key, current);
            }
        }
        return Array.from(map.values());
    }, [ops]);

    // --- DnD (raw JS)
    const onDragStart = (e, opId) => {
        const op = ops.find(o => o.id === opId);
        if (op?.status === "Completed") {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData("text/plain", opId);
        e.dataTransfer.effectAllowed = "move";
    };
    const onDragOver = (e, col) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverCol !== col) setDragOverCol(col);
    };
    const onDragLeave = () => setDragOverCol(null);

    const onDrop = (e, newStatus) => {
        e.preventDefault();
        const opId = e.dataTransfer.getData("text/plain");
        const op = ops.find(o => o.id === opId);
        if (!op) return;

        if (op.status === "Completed") {
            setDragOverCol(null);
            return;
        }

        if (newStatus === "Hold") {
            setHoldModal({open: true, opId, reason: "", viewOnly: false});
            setDragOverCol(null);
            return;
        }

        if (newStatus === "Completed") {
            const rows = (op.bom || []).map(r => ({...r}));
            // Simplified: don't calculate; start with produced 0
            setCompleteModal({
                open: true,
                opId,
                draftRows: rows,
                produced: 0,
                notes: "",
                viewOnly: false,
                targetStatus: "Completed"
            });
            setDragOverCol(null);
            return;
        }

        setOps((old) =>
            old.map((o) =>
                o.id === opId
                    ? {...o, status: newStatus, updated: new Date().toISOString().slice(0, 10)}
                    : o
            )
        );
        setDragOverCol(null);
    };

    // --- Inline edit
    const startEdit = (id, field) => setEditing({id, field});
    const commitEdit = (id, field, value) => {
        setOps((prev) =>
            prev.map((o) => (o.id === id ? {...o, [field]: value, updated: new Date().toISOString().slice(0, 10)} : o))
        );
        setEditing(null);
    };

    // --- Actions
    const removeOp = (id) => setOps((prev) => prev.filter((o) => o.id !== id));
    const gotoNew = () => navigate(`/work-orders/${woId}/operations/new`);
    const gotoEdit = (opId) => navigate(`/work-orders/${woId}/operations/${opId}/edit`);

    // Release logic (unchanged from previous update)
    const handleRelease = () => {
        const pending = ops.filter(o => o.status !== "Completed");
        const variant = pending.length > 0 ? "warn" : "ok";
        const title = pending.length > 0 ? "Release with Pending Operations?" : "Ready to Release";
        const proceedLabel = pending.length > 0 ? "Proceed Anyway" : "Confirm Release";

        setReleaseModal({
            open: true,
            title,
            variant,
            proceedLabel,
            pending,
            releaseQty: Math.max(0, producedSoFar),
            expiryDate: ""
        });
    };

    // ---- Hold modal handlers
    const saveHold = () => {
        const {opId, reason} = holdModal;
        if (!reason.trim()) return;
        setOps(prev => prev.map(o => {
            if (o.id !== opId) return o;
            const at = new Date().toISOString().slice(0, 10);
            const hist = Array.isArray(o.holdHistory) ? [...o.holdHistory] : [];
            hist.push({reason: reason.trim(), at});
            return {
                ...o,
                status: "Hold",
                updated: at,
                holdReason: reason.trim(),
                holdHistory: hist
            };
        }));
        setHoldModal({open: false, opId: null, reason: "", viewOnly: false});
    };

    // ---- Complete modal handlers (simplified)
    const updateRow = (idx, field, value) => {
        setCompleteModal(m => {
            const rows = m.draftRows.slice();
            const n = Number(value || 0);
            rows[idx] = {...rows[idx], [field]: isNaN(n) ? 0 : n};
            return {...m, draftRows: rows};
        });
    };

    const saveComplete = () => {
        const {opId, draftRows, produced, notes} = completeModal;
        const at = new Date().toISOString().slice(0, 10);
        setOps(prev => prev.map(o => {
            if (o.id !== opId) return o;
            return {
                ...o,
                status: "Completed",
                updated: at,
                bom: draftRows.map(r => ({...r, consumed: Number(r.consumed || 0), scrap: Number(r.scrap || 0)})),
                producedQty: Number(produced || 0),
                varianceNote: String(notes || "")
            };
        }));
        setCompleteModal({
            open: false,
            opId: null,
            draftRows: [],
            produced: 0,
            notes: "",
            viewOnly: false,
            targetStatus: "Completed"
        });
    };

    // ---- Release modal proceed (validate expiry and qty)
    const proceedRelease = () => {
        if (!releaseModal.expiryDate || Number(releaseModal.releaseQty) <= 0) {
            return;
        }
        setReleaseModal({
            open: false,
            title: "",
            variant: "info",
            proceedLabel: "",
            pending: [],
            releaseQty: 0,
            expiryDate: ""
        });
    };

    // ---- Column
    const Column = ({title, items}) => (
        <div
            className={`flex flex-col rounded-xl border border-white/10 bg-gray-900/60 min-h-[520px] ${
                dragOverCol === title ? "ring-2 ring-blue-500/60" : ""
            }`}
            onDragOver={(e) => onDragOver(e, title)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, title)}
            role="list"
            aria-label={`${title} column`}
        >
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800/60">
                <div className="flex items-center gap-2">
          <span
              className={`h-2.5 w-2.5 rounded-full ${
                  title === "Open" ? "bg-blue-400"
                      : title === "In Progress" ? "bg-indigo-400"
                          : title === "Completed" ? "bg-green-400"
                              : "bg-yellow-400"
              }`}
          />
                    <h3 className="font-semibold text-gray-200">{title}</h3>
                </div>
                <span className="text-xs text-gray-400">{items.length}</span>
            </div>

            <div className="flex flex-col gap-3 p-3">
                {items.map((op) => (
                    <div
                        key={op.id}
                        draggable={op.status !== "Completed"}
                        onDragStart={(e) => onDragStart(e, op.id)}
                        className={`group border-l-4 ${PRIORITY_BORDER[op.priority]} rounded-lg bg-gray-800/70 border border-gray-800/80 hover:bg-gray-800 transition shadow-sm`}
                        role="listitem"
                        aria-label={`${op.id} card`}
                        title={op.status === "Completed" ? "Completed operations cannot be moved" : "Drag to change status"}
                    >
                        <div className="flex items-start gap-3 p-3">
                            <div className="flex-1 space-y-2">
                                {/* Header: ID + Priority */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-white">{op.id}</span>
                                        <span className="text-xs text-gray-500">•</span>
                                        {/* Inline editable title */}
                                        <div className="text-sm text-gray-200">
                                            {editing && editing.id === op.id && editing.field === "title" ? (
                                                <input
                                                    autoFocus
                                                    defaultValue={op.title}
                                                    onBlur={(e) => commitEdit(op.id, "title", e.target.value.trim() || op.title)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") e.currentTarget.blur();
                                                        if (e.key === "Escape") setEditing(null);
                                                    }}
                                                    className="px-1 py-0.5 rounded bg-gray-900/60 border border-white/10 text-gray-100"
                                                />
                                            ) : (
                                                <button
                                                    className="hover:underline"
                                                    title="Double-click to edit title"
                                                    onDoubleClick={() => startEdit(op.id, "title")}
                                                >
                                                    {op.title}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[op.priority]}`}
                                              title={`Priority: ${op.priority}`}/>
                                        {pill(op.priority, PRIORITY_CLS)}
                                    </div>
                                </div>

                                {/* Meta row */}
                                <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-500">Assignee:</span>
                                        {editing && editing.id === op.id && editing.field === "assignee" ? (
                                            <input
                                                autoFocus
                                                defaultValue={op.assignee}
                                                onBlur={(e) => commitEdit(op.id, "assignee", e.target.value.trim() || op.assignee)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") e.currentTarget.blur();
                                                    if (e.key === "Escape") setEditing(null);
                                                }}
                                                className="px-1 py-0.5 rounded bg-gray-900/60 border border-white/10 text-gray-200"
                                            />
                                        ) : (
                                            <button
                                                className="text-gray-300 hover:underline"
                                                title="Double-click to change assignee"
                                                onDoubleClick={() => startEdit(op.id, "assignee")}
                                            >
                                                {op.assignee}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <span className="text-gray-500">Est:</span>
                                        {editing && editing.id === op.id && editing.field === "estimate" ? (
                                            <input
                                                autoFocus
                                                defaultValue={op.estimate}
                                                onBlur={(e) => commitEdit(op.id, "estimate", e.target.value.trim() || op.estimate)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") e.currentTarget.blur();
                                                    if (e.key === "Escape") setEditing(null);
                                                }}
                                                className="px-1 py-0.5 rounded bg-gray-900/60 border border-white/10 text-gray-200 w-20"
                                                placeholder="e.g. 6h, 2d"
                                            />
                                        ) : (
                                            <button
                                                className="text-gray-300 hover:underline"
                                                title="Double-click to edit estimation"
                                                onDoubleClick={() => startEdit(op.id, "estimate")}
                                            >
                                                {op.estimate}
                                            </button>
                                        )}
                                    </div>

                                    <div className="text-right">Updated {op.updated}</div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-2">
                                        <button
                                            className="px-2.5 py-1 rounded bg-gray-900/60 border border-white/10 text-xs hover:bg-gray-800"
                                            onClick={() => gotoEdit(op.id)}
                                        >
                                            Details
                                        </button>

                                        {op.status === "Hold" && (
                                            <button
                                                className="px-2.5 py-1 rounded bg-gray-900/60 border border-white/10 text-xs hover:bg-gray-800 flex items-center gap-1"
                                                title="View Hold reason/history"
                                                onClick={() => setHoldModal({
                                                    open: true,
                                                    opId: op.id,
                                                    reason: op.holdReason || "",
                                                    viewOnly: true
                                                })}
                                            >
                                                <IconInfo className="h-3.5 w-3.5 text-yellow-300"/><span>Why?</span>
                                            </button>
                                        )}

                                        {op.status === "Completed" && (
                                            <button
                                                className="px-2.5 py-1 rounded bg-gray-900/60 border border-white/10 text-xs hover:bg-gray-800 flex items-center gap-1"
                                                title="View production & materials"
                                                onClick={() => {
                                                    const rows = (op.bom || []).map(r => ({...r}));
                                                    setCompleteModal({
                                                        open: true,
                                                        opId: op.id,
                                                        draftRows: rows,
                                                        produced: op.producedQty ?? 0,
                                                        notes: op.varianceNote || "",
                                                        viewOnly: true,
                                                        targetStatus: "Completed"
                                                    });
                                                }}
                                            >
                                                <IconCheck className="h-3.5 w-3.5 text-emerald-300"/><span>Output</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* HIDE Remove for Completed */}
                                    {op.status !== "Completed" && (
                                        <button
                                            className="px-2.5 py-1 rounded bg-gray-900/60 border border-white/10 text-xs hover:bg-gray-800 text-red-300 flex items-center gap-1"
                                            onClick={() => removeOp(op.id)}
                                            title="Remove operation"
                                        >
                                            <IconTrash className="h-3.5 w-3.5"/><span>Remove</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="text-sm text-gray-500 px-2 py-4 text-center">No operations here.</div>
                )}
            </div>
        </div>
    );

    return (
        <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200 min-h-screen">
            {/* Header */}
            <header className="mx-auto px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Operations • {woId}</h1>
                        <p className="mt-2 text-gray-400">Manage operations on a Kanban board. Drag to change
                            status.</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        {/* Release button */}
                        <button
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm"
                            onClick={handleRelease}
                            title="Release Work Order"
                        >
                            Release
                        </button>
                        <button
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                            onClick={gotoNew}
                            title="Create a new operation"
                        >
                            + New Operation
                        </button>
                        <button
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                            onClick={() => navigate(`/work-orders/${woId}/edit`)}
                        >
                            Edit Work Order
                        </button>
                        <button
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                            onClick={() => navigate("/work-orders")}
                        >
                            Back to List
                        </button>
                    </div>
                </div>
            </header>

            {/* Work Order Plan */}
            <div className="mx-auto px-4 pb-4">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 space-y-4">
                    {/* Top badges: dates & item */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2 py-1 rounded bg-gray-800 border border-white/10">Start: <span
                            className="text-gray-200">{woPlan.startDate}</span></span>
                        <span className="px-2 py-1 rounded bg-gray-800 border border-white/10">Due: <span
                            className="text-gray-200">{woPlan.dueDate}</span></span>
                        <span className="px-2 py-1 rounded bg-gray-800 border border-white/10">
              Item: <span className="font-mono text-gray-100">{woPlan.itemId}</span> — <span
                            className="text-gray-200">{woPlan.itemName}</span>
            </span>
                        <span className="px-2 py-1 rounded bg-gray-800 border border-white/10">
              Expected Qty: <span className="text-gray-200">{expectedQty}</span>
            </span>
                        <span className="px-2 py-1 rounded bg-gray-800 border border-white/10">
              Produced: <span className="text-gray-200">{producedSoFar}</span>
            </span>
                    </div>

                    {/* Row 1: Operations progress */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-300 flex items-center gap-3">
                            <span
                                className="px-2 py-1 rounded bg-blue-500/20 text-blue-200">Open {totals.by["Open"] || 0}</span>
                            <span
                                className="px-2 py-1 rounded bg-indigo-500/20 text-indigo-200">In Progress {totals.by["In Progress"] || 0}</span>
                            <span
                                className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-200">Hold {totals.by["Hold"] || 0}</span>
                            <span
                                className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-200">Completed {totals.by["Completed"] || 0}</span>
                        </div>
                        <div className="text-xs text-gray-400">Total: {totals.all} • Done: {totals.done}</div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-800 border border-white/10 overflow-hidden">
                        <div
                            className="h-full bg-emerald-500/80"
                            style={{width: `${totals.pct}%`}}
                            title={`${totals.pct}% operations complete`}
                        />
                    </div>

                    {/* Row 2: Output progress */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-300">
                            Output Progress: <span
                            className="text-gray-100 font-semibold">{producedSoFar}</span> / {expectedQty}
                        </div>
                        <div className="text-xs text-gray-400">{outputPct}% of expected output</div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-800 border border-white/10 overflow-hidden">
                        <div
                            className="h-full bg-sky-500/80"
                            style={{width: `${outputPct}%`}}
                            title={`${outputPct}% of expected quantity`}
                        />
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="mx-auto px-4 pb-4">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1">
                            <input
                                placeholder="Search operations by ID, title, or assignee…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full rounded-lg bg-gray-800 border border-white/10 pl-3 pr-10 py-2 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">⌕</span>
                        </div>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                        >
                            <option value="all">All Priorities</option>
                            {["Low", "Medium", "High", "Rush"].map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>

                        <select
                            value={assigneeFilter}
                            onChange={(e) => setAssigneeFilter(e.target.value)}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                        >
                            <option value="all">All Assignees</option>
                            {assignees.map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Kanban */}
            <section className="mx-auto w-full px-4 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {STATUS_LIST.map((s) => (
                        <Column key={s} title={s} items={filtered.filter((o) => o.status === s)}/>
                    ))}
                </div>
                <div className="mt-4 text-xs text-gray-500 mx-auto px-4">
                    Tip: Double-click the <span className="text-gray-300">title</span>, <span
                    className="text-gray-300">assignee</span>, or{" "}
                    <span className="text-gray-300">estimation</span> to edit. Drag cards between columns to change
                    status.
                    <span className="ml-2 text-gray-400">Moving to <span className="text-yellow-200">Hold</span> asks for a reason. Moving to <span
                        className="text-emerald-200">Completed</span> confirms output & materials. Completed cards are locked.</span>
                </div>
            </section>

            {/* Hold Modal */}
            <Modal
                open={holdModal.open}
                title={holdModal.viewOnly ? "Hold Reason" : "Move to Hold — Reason required"}
                onClose={() => setHoldModal({open: false, opId: null, reason: "", viewOnly: false})}
                footer={
                    holdModal.viewOnly ? (
                        <button
                            onClick={() => setHoldModal({open: false, opId: null, reason: "", viewOnly: false})}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                        >
                            Close
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setHoldModal({open: false, opId: null, reason: "", viewOnly: false})}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveHold}
                                disabled={!holdModal.reason.trim()}
                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm disabled:opacity-50"
                            >
                                Save & Hold
                            </button>
                        </>
                    )
                }
            >
                {holdModal.viewOnly ? (
                    <div className="space-y-3">
                        <div className="text-sm">
                            <div className="text-gray-400 mb-1">Current reason</div>
                            <div className="px-3 py-2 rounded-lg bg-gray-800/60 border border-white/10 text-gray-200">
                                {holdModal.reason || <span className="text-gray-500">No reason stored.</span>}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs text-gray-400 mb-1">History</div>
                            <div className="rounded-xl bg-gray-900/40 border border-white/10 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-800 text-sm">
                                    <thead className="bg-gray-900/80">
                                    <tr>
                                        <th className="px-4 py-2 text-left">When</th>
                                        <th className="px-4 py-2 text-left">Reason</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                    {(ops.find(o => o.id === holdModal.opId)?.holdHistory || []).slice().reverse().map((h, i) => (
                                        <tr key={i}>
                                            <td className="px-4 py-2">{h.at}</td>
                                            <td className="px-4 py-2">{h.reason}</td>
                                        </tr>
                                    ))}
                                    {(ops.find(o => o.id === holdModal.opId)?.holdHistory || []).length === 0 && (
                                        <tr>
                                            <td className="px-4 py-3 text-gray-500" colSpan={2}>No history.</td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <label className="block text-xs text-gray-400">Reason</label>
                        <textarea
                            rows={4}
                            autoFocus
                            value={holdModal.reason}
                            onChange={(e) => setHoldModal(h => ({...h, reason: e.target.value}))}
                            placeholder="Explain why this operation must be on hold…"
                            className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                        />
                        <div className="text-xs text-gray-500">This reason will be stored and visible in history.</div>
                    </div>
                )}
            </Modal>

            {/* Complete / Materials Modal (simplified) */}
            <Modal
                open={completeModal.open}
                title={completeModal.viewOnly ? "Production & Materials" : "Complete Operation — Confirm Output & Materials"}
                onClose={() => setCompleteModal({
                    open: false,
                    opId: null,
                    draftRows: [],
                    produced: 0,
                    notes: "",
                    viewOnly: false,
                    targetStatus: "Completed"
                })}
                footer={
                    completeModal.viewOnly ? (
                        <button
                            onClick={() => setCompleteModal({
                                open: false,
                                opId: null,
                                draftRows: [],
                                produced: 0,
                                notes: "",
                                viewOnly: false,
                                targetStatus: "Completed"
                            })}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                        >
                            Close
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setCompleteModal({
                                    open: false,
                                    opId: null,
                                    draftRows: [],
                                    produced: 0,
                                    notes: "",
                                    viewOnly: false,
                                    targetStatus: "Completed"
                                })}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveComplete}
                                disabled={Number(completeModal.produced) < 0}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm disabled:opacity-50"
                            >
                                Save & Complete
                            </button>
                        </>
                    )
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    {/* Materials table */}
                    <div className="rounded-xl bg-gray-900/40 border border-white/10 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-800 text-sm">
                            <thead className="bg-gray-900/80">
                            <tr>
                                <th className="px-3 py-2 text-left">Component</th>
                                <th className="px-3 py-2 text-left">Per FG</th>
                                <th className="px-3 py-2 text-left">Consumed</th>
                                <th className="px-3 py-2 text-left">Scrap</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                            {completeModal.draftRows.map((r, idx) => (
                                <tr key={r.itemId}>
                                    <td className="px-3 py-2">
                                        <div className="font-mono">{r.itemId}</div>
                                        <div className="text-[11px] text-gray-400">{r.name || ""}</div>
                                    </td>
                                    <td className="px-3 py-2">{r.per}</td>
                                    <td className="px-3 py-2">
                                        {completeModal.viewOnly ? (
                                            <span>{r.consumed || 0}</span>
                                        ) : (
                                            <input
                                                inputMode="decimal"
                                                className="w-28 rounded bg-gray-800 border border-white/10 px-2 py-1"
                                                value={r.consumed ?? 0}
                                                onChange={(e) => updateRow(idx, "consumed", e.target.value)}
                                            />
                                        )}
                                    </td>
                                    <td className="px-3 py-2">
                                        {completeModal.viewOnly ? (
                                            <span>{r.scrap || 0}</span>
                                        ) : (
                                            <input
                                                inputMode="decimal"
                                                className="w-28 rounded bg-gray-800 border border-white/10 px-2 py-1"
                                                value={r.scrap ?? 0}
                                                onChange={(e) => updateRow(idx, "scrap", e.target.value)}
                                            />
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Output confirmation (no calculated produced) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Produced (editable)</label>
                            {completeModal.viewOnly ? (
                                <div
                                    className="px-3 py-2 rounded-lg bg-gray-800/60 border border-white/10 text-gray-100">
                                    {completeModal.produced}
                                </div>
                            ) : (
                                <input
                                    inputMode="decimal"
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    value={completeModal.produced}
                                    onChange={(e) => setCompleteModal(m => ({
                                        ...m,
                                        produced: Number(e.target.value || 0)
                                    }))}
                                />
                            )}
                        </div>
                    </div>

                    {/* Notes (optional) */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Notes</label>
                        {completeModal.viewOnly ? (
                            <div
                                className="px-3 py-2 rounded-lg bg-gray-800/60 border border-white/10 text-gray-200 min-h-[38px]">
                                {completeModal.notes || <span className="text-gray-500">—</span>}
                            </div>
                        ) : (
                            <textarea
                                rows={3}
                                value={completeModal.notes}
                                onChange={(e) => setCompleteModal(m => ({...m, notes: e.target.value}))}
                                placeholder="Optional notes"
                                className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                            />
                        )}
                    </div>
                </div>
            </Modal>

            {/* Release Modal (unchanged from previous update) */}
            <Modal
                open={releaseModal.open}
                title={releaseModal.title}
                onClose={() => setReleaseModal({
                    open: false,
                    title: "",
                    variant: "info",
                    proceedLabel: "",
                    pending: [],
                    releaseQty: 0,
                    expiryDate: ""
                })}
                footer={
                    <>
                        <button
                            onClick={() => setReleaseModal({
                                open: false,
                                title: "",
                                variant: "info",
                                proceedLabel: "",
                                pending: [],
                                releaseQty: 0,
                                expiryDate: ""
                            })}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={proceedRelease}
                            disabled={!releaseModal.expiryDate || Number(releaseModal.releaseQty) <= 0}
                            className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${
                                releaseModal.variant === "warn"
                                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                            }`}
                            title={!releaseModal.expiryDate ? "Expiration date required" : undefined}
                        >
                            {releaseModal.proceedLabel || "Confirm"}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    {releaseModal.pending.length > 0 && (
                        <div
                            className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">
                            <div className="font-medium mb-2 flex items-center gap-2">
                                <IconInfo className="h-4 w-4 text-amber-300"/> Not all operations are completed. Review
                                what’s pending:
                            </div>
                            <div className="rounded-lg bg-gray-900/40 border border-white/10 overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-800 text-xs">
                                    <thead className="bg-gray-900/80">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Operation</th>
                                        <th className="px-3 py-2 text-left">Title</th>
                                        <th className="px-3 py-2 text-left">Status</th>
                                        <th className="px-3 py-2 text-left">Assignee</th>
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                    {releaseModal.pending.map(o => (
                                        <tr key={o.id}>
                                            <td className="px-3 py-2 font-mono">{o.id}</td>
                                            <td className="px-3 py-2">{o.title}</td>
                                            <td className="px-3 py-2">{o.status}</td>
                                            <td className="px-3 py-2">{o.assignee}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="text-[11px] text-amber-200/90 mt-2">
                                You can still release, but ensure the following output and materials are correct.
                            </div>
                        </div>
                    )}

                    {/* Output section: FG details + mandatory expiration */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60">
                        <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold">Output (Finished
                            Good)
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="text-xs text-gray-400">Item ID</div>
                                <div className="px-3 py-2 rounded-lg bg-gray-800/60 border border-white/10 font-mono">
                                    {woPlan.itemId}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-gray-400">Item Name</div>
                                <div className="px-3 py-2 rounded-lg bg-gray-800/60 border border-white/10">
                                    {woPlan.itemName}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs text-gray-400">Count to Release</label>
                                <input
                                    inputMode="decimal"
                                    value={releaseModal.releaseQty}
                                    onChange={(e) => setReleaseModal(m => ({
                                        ...m,
                                        releaseQty: Math.max(0, Number(e.target.value || 0))
                                    }))}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                                {Number(releaseModal.releaseQty) > producedSoFar && (
                                    <div className="text-[11px] text-amber-300">Note: Count exceeds produced so far
                                        ({producedSoFar}).</div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs text-gray-400">Expiration Date <span
                                    className="text-red-300">*</span></label>
                                <input
                                    type="date"
                                    value={releaseModal.expiryDate}
                                    onChange={(e) => setReleaseModal(m => ({...m, expiryDate: e.target.value}))}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                                {!releaseModal.expiryDate && (
                                    <div className="text-[11px] text-red-300">Expiration date is required to
                                        release.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* BOM summary: consumed & scrap */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold">BOM Components —
                            Totals
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-800 text-sm">
                                <thead className="bg-gray-900/80">
                                <tr>
                                    <th className="px-4 py-2 text-left">Component</th>
                                    <th className="px-4 py-2 text-left">Name</th>
                                    <th className="px-4 py-2 text-left">Consumed</th>
                                    <th className="px-4 py-2 text-left">Scrap</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {aggregatedBom.map(r => (
                                    <tr key={r.itemId}>
                                        <td className="px-4 py-2 font-mono">{r.itemId}</td>
                                        <td className="px-4 py-2">{r.name}</td>
                                        <td className="px-4 py-2">{r.consumed}</td>
                                        <td className="px-4 py-2">{r.scrap}</td>
                                    </tr>
                                ))}
                                {aggregatedBom.length === 0 && (
                                    <tr>
                                        <td className="px-4 py-3 text-gray-500" colSpan={4}>No component usage
                                            recorded.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-4 py-2 text-[11px] text-gray-400 border-t border-white/10">
                            The totals reflect all operations’ recorded consumption and scrap at this time.
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default WorkOrderOperationsPage;
