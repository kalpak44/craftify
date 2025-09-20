/**
 * WorkOrderOperationsPage.jsx
 *
 * Purpose:
 * - Simplified operations Kanban board for a Work Order.
 * - Mobile-first UX: horizontal scroll & snap columns, large tap targets, and a "Move" action for touch devices.
 * - Fix (mobile Move modal): prevent header overlay/glitch by disabling sticky on mobile, using dvh, and safe-area padding.
 * - Shows a top BOM Components section with allocation & usage bars.
 * - Allows deleting operation cards with a confirmation modal.
 * - Output for Completed operations is editable via modal.
 * - No inline editing for title/assignee/estimate; clicking the title opens details.
 * - Users can drag tickets across statuses (desktop) or tap "Move" (mobile) to change statuses.
 * - Change: Increase space for the "Updated" text on cards so it stays on a single line.
 * - Change: Replace "Availability" wording with "Allocation" in the top BOM table.
 *
 * Notes:
 * - Mock data only; no backend calls.
 * - Raw JS React component for Vite + Tailwind; no external libs.
 */

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

// Minimal modal shell — fixed: mobile header/foot not sticky; dvh + safe-area paddings
function Modal({open, title, onClose, children, footer}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
            <div className="absolute inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
                <div
                    className="w-full h-[92dvh] sm:h-auto sm:max-h-[80dvh] sm:max-w-4xl rounded-t-2xl sm:rounded-2xl border border-white/10 bg-gray-900 text-gray-200 shadow-2xl"
                >
                    <div
                        className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-gray-900"
                        style={{paddingTop: "env(safe-area-inset-top)"}}
                    >
                        <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
                        <button onClick={onClose}
                                className="text-gray-400 hover:text-gray-200 text-xl leading-none">&times;</button>
                    </div>

                    <div className="p-4 sm:p-5 overflow-y-auto max-h-[calc(92dvh-120px)] sm:max-h-[calc(80dvh-120px)]">
                        {children}
                    </div>

                    <div
                        className="px-4 sm:px-5 py-3 sm:py-4 border-t border-white/10 bg-gray-900/60 flex items-center justify-end gap-2"
                        style={{paddingBottom: "env(safe-area-inset-bottom)"}}
                    >
                        {footer}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Compute usage totals
const sumUsage = (ops) => {
    let consumed = 0, scrap = 0;
    for (const o of ops) {
        for (const r of (o.bom || [])) {
            consumed += Number(r.consumed || 0);
            scrap += Number(r.scrap || 0);
        }
    }
    return {consumed, scrap};
};

const WorkOrderOperationsPage = () => {
    const {id: woId} = useParams();
    const navigate = useNavigate();

    // ---- Work Order Plan (mocked)
    const [woPlan] = useState(() => ({
        startDate: "2025-02-18",
        dueDate: "2025-02-25",
        itemId: "ITM-002",
        itemName: "Large Widget",
        expectedQty: 10
    }));

    // Seed example BOM & op-local tracking fields — include mock reserve allocation
    const seedBom = (mult = 1) => ([
        {itemId: "ITM-003", name: "Plastic Case", per: 1 * mult, consumed: 0, scrap: 0, reserve: 120},
        {itemId: "ITM-009", name: "Screws M3×8", per: 6 * mult, consumed: 0, scrap: 0, reserve: 450},
        {itemId: "ITM-007", name: "Steel Frame", per: 1 * mult, consumed: 0, scrap: 0, reserve: 35},
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
    const [query, setQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [assigneeFilter, setAssigneeFilter] = useState("all");

    // Action modals
    const [holdModal, setHoldModal] = useState({open: false, opId: null, reason: "", viewOnly: false});

    const [completeModal, setCompleteModal] = useState({
        open: false,
        opId: null,
        draftRows: [],
        produced: 0,
        notes: "",
        viewOnly: false,
        targetStatus: "Completed",
    });

    const [releaseModal, setReleaseModal] = useState({
        open: false,
        title: "",
        variant: "info",
        proceedLabel: "",
        pending: [],
        releaseQty: 0,
        expiryDate: "",
    });

    const [deleteModal, setDeleteModal] = useState({open: false, opId: null}); // confirm deletion

    // Mobile move modal
    const [moveModal, setMoveModal] = useState({open: false, opId: null});

    // Request log (mock)
    const [requestLog, setRequestLog] = useState([]); // {opId?, itemId, qty, at}
    const [topRequests, setTopRequests] = useState({}); // { itemId: qty }

    // --- Derived
    const assignees = useMemo(() => Array.from(new Set(ops.map((o) => o.assignee))).sort(), [ops]);

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

    // Output progress vs expected
    const producedSoFar = useMemo(
        () => ops.filter(o => o.status === "Completed").reduce((s, o) => s + (Number(o.producedQty || 0)), 0),
        [ops]
    );
    const expectedQty = Number(woPlan.expectedQty || 0);
    const outputPct = expectedQty > 0 ? Math.min(100, Math.round((producedSoFar / expectedQty) * 100)) : 0;

    // Usage banner totals
    const usageTotals = useMemo(() => sumUsage(ops), [ops]);

    // Aggregated BOM (consumed/scrap across ops)
    const aggregatedBom = useMemo(() => {
        const map = new Map();
        for (const o of ops) {
            for (const r of (o.bom || [])) {
                const key = r.itemId;
                const current = map.get(key) || {
                    itemId: r.itemId,
                    name: r.name || "",
                    consumed: 0,
                    scrap: 0,
                    reserve: 0
                };
                current.consumed += Number(r.consumed || 0);
                current.scrap += Number(r.scrap || 0);
                current.reserve = Math.max(current.reserve, Number(r.reserve || 0));
                map.set(key, current);
            }
        }
        return Array.from(map.values());
    }, [ops]);

    // --- DnD (desktop)
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

    const applyStatusChange = (opId, newStatus) => {
        const op = ops.find(o => o.id === opId);
        if (!op) return;

        if (newStatus === "Hold") {
            setHoldModal({open: true, opId, reason: "", viewOnly: false});
            setDragOverCol(null);
            return;
        }

        if (newStatus === "Completed") {
            const rows = (op.bom || []).map(r => ({...r}));
            setCompleteModal({
                open: true,
                opId,
                draftRows: rows,
                produced: op.producedQty ?? 0,
                notes: op.varianceNote || "",
                viewOnly: false,
                targetStatus: "Completed",
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

    const onDrop = (e, newStatus) => {
        e.preventDefault();
        const opId = e.dataTransfer.getData("text/plain");
        applyStatusChange(opId, newStatus);
    };

    // --- Actions
    const gotoNew = () => navigate(`/work-orders/${woId}/operations/new`);
    const gotoEdit = (opId) => navigate(`/work-orders/${woId}/operations/${opId}/edit`);

    const handleRelease = () => {
        const pending = ops.filter(o => o.status !== "Completed");
        const variant = pending.length > 0 ? "warn" : "ok";
        const title = pending.length > 0 ? "Release with Pending Operations?" : "Ready to Release";

        setReleaseModal({
            open: true,
            title,
            variant,
            proceedLabel: pending.length > 0 ? "Proceed Anyway" : "Confirm Release",
            pending,
            releaseQty: Math.max(0, producedSoFar),
            expiryDate: ""
        });
    };

    // Hold modal handlers
    const saveHold = () => {
        const {opId, reason} = holdModal;
        if (!reason.trim()) return;
        setOps(prev => prev.map(o => {
            if (o.id !== opId) return o;
            const at = new Date().toISOString().slice(0, 10);
            const hist = Array.isArray(o.holdHistory) ? [...o.holdHistory] : [];
            hist.push({reason: reason.trim(), at});
            return {...o, status: "Hold", updated: at, holdReason: reason.trim(), holdHistory: hist};
        }));
        setHoldModal({open: false, opId: null, reason: "", viewOnly: false});
    };

    // Complete modal handlers
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

    // Delete flow
    const requestDeleteOp = (opId) => setDeleteModal({open: true, opId});
    const confirmDeleteOp = () => {
        setOps(prev => prev.filter(o => o.id !== deleteModal.opId));
        setDeleteModal({open: false, opId: null});
    };

    // Top-level requests (per component in header section)
    const setTopReqQty = (itemId, qty) => setTopRequests(prev => ({...prev, [itemId]: Math.max(0, Number(qty || 0))}));
    const submitTopRequest = (itemId) => {
        const qty = Number(topRequests[itemId] || 0);
        if (qty > 0) {
            const at = new Date().toISOString().slice(0, 10);
            setRequestLog(prev => [...prev, {opId: null, itemId, qty, at}]);
            setTopRequests(prev => {
                const n = {...prev};
                delete n[itemId];
                return n;
            });
        }
    };

    // ---- Column
    const Column = ({title, items}) => (
        <div
            className={`flex flex-col rounded-xl border border-white/10 bg-gray-900/60 min-h-[520px] md:min-h-[520px] md:w-auto w-[84%] sm:w-[70%] snap-center ${dragOverCol === title ? "ring-2 ring-blue-500/60" : ""}`}
            onDragOver={(e) => onDragOver(e, title)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, title)}
            role="list"
            aria-label={`${title} column`}
        >
            <div
                className="flex items-center justify-between px-3 py-2 border-b border-gray-800/60 bg-gray-900/60 backdrop-blur z-10">
                <div className="flex items-center gap-2">
          <span
              className={`h-2.5 w-2.5 rounded-full ${title === "Open" ? "bg-blue-400" : title === "In Progress" ? "bg-indigo-400" : title === "Completed" ? "bg-green-400" : "bg-yellow-400"}`}/>
                    <h3 className="font-semibold text-gray-200 text-sm">{title}</h3>
                </div>
                <span className="text-xs text-gray-400">{items.length}</span>
            </div>

            <div className="flex flex-col gap-3 p-3">
                {items.map((op) => (
                    <div
                        key={op.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, op.id)}
                        className={`group border-l-4 ${PRIORITY_BORDER[op.priority]} rounded-lg bg-gray-800/70 border border-gray-800/80 hover:bg-gray-800 transition shadow-sm`}
                        role="listitem"
                        aria-label={`${op.id} card`}
                    >
                        <div className="flex items-start gap-3 p-3">
                            <div className="flex-1 space-y-2">
                                {/* Header: ID + Title (click to open details) + Priority */}
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono text-white shrink-0">{op.id}</span>
                                        <span className="text-xs text-gray-500 shrink-0">•</span>
                                        <button
                                            className="text-sm text-blue-200 hover:underline truncate"
                                            onClick={() => gotoEdit(op.id)}
                                            title="Open operation details"
                                        >
                                            {op.title}
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[op.priority]}`}
                          title={`Priority: ${op.priority}`}/>
                                        {pill(op.priority, PRIORITY_CLS)}
                                    </div>
                                </div>

                                {/* Meta row (read-only) — widened space for Updated */}
                                <div className="grid grid-cols-6 gap-2 text-xs text-gray-400">
                                    <div className="col-span-3 sm:col-span-2 flex items-center gap-1 min-w-0">
                                        <span className="text-gray-500">Assignee:</span>
                                        <span className="text-gray-300 truncate">{op.assignee}</span>
                                    </div>
                                    <div className="col-span-2 hidden sm:flex items-center gap-1">
                                        <span className="text-gray-500">Est:</span>
                                        <span className="text-gray-300">{op.estimate}</span>
                                    </div>
                                    <div
                                        className="col-span-3 sm:col-span-2 text-right whitespace-nowrap">Updated {op.updated}</div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-1">
                                    <div className="flex items-center gap-2">
                                        {/* Mobile: priority pill inline */}
                                        <div className="sm:hidden">{pill(op.priority, PRIORITY_CLS)}</div>

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

                                        {/* Output only for Completed */}
                                        {op.status === "Completed" && (
                                            <button
                                                className="px-2.5 py-1 rounded bg-gray-900/60 border border-white/10 text-xs hover:bg-gray-800 flex items-center gap-1"
                                                title="Production & materials"
                                                onClick={() => {
                                                    const rows = (op.bom || []).map(r => ({...r}));
                                                    setCompleteModal({
                                                        open: true,
                                                        opId: op.id,
                                                        draftRows: rows,
                                                        produced: op.producedQty ?? 0,
                                                        notes: op.varianceNote || "",
                                                        viewOnly: false,
                                                        targetStatus: "Completed",
                                                    });
                                                }}
                                            >
                                                <IconCheck className="h-3.5 w-3.5 text-emerald-300"/><span>Output</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Mobile: Move button (tap to change status) */}
                                        <button
                                            className="sm:hidden px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs"
                                            onClick={() => setMoveModal({open: true, opId: op.id})}
                                            title="Move card"
                                        >
                                            Move
                                        </button>

                                        {/* Remove with confirmation */}
                                        <button
                                            className="px-2.5 py-1 rounded bg-gray-900/60 border border-white/10 text-xs hover:bg-gray-800 text-red-300 flex items-center gap-1"
                                            onClick={() => requestDeleteOp(op.id)}
                                            title="Remove operation"
                                        >
                                            <IconTrash className="h-3.5 w-3.5"/><span>Remove</span>
                                        </button>
                                    </div>
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
            <header className="mx-auto px-4 pt-8 sm:pt-10 pb-4 sm:pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">Operations • {woId}</h1>
                        <p className="mt-2 text-gray-400 text-sm sm:text-base">Kanban board. Drag on desktop; tap “Move”
                            on mobile. Click a title to view details.</p>
                    </div>
                    <div className="flex gap-2 sm:gap-3 items-center w-full sm:w-auto">
                        <button
                            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm"
                            onClick={handleRelease}
                            title="Release Work Order"
                        >
                            Release
                        </button>
                        <button
                            className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                            onClick={gotoNew}
                            title="Create a new operation"
                        >
                            + New
                        </button>
                        <button
                            className="hidden sm:inline-flex px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                            onClick={() => navigate(`/work-orders/${woId}/edit`)}
                        >
                            Edit Work Order
                        </button>
                        <button
                            className="hidden sm:inline-flex px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                            onClick={() => navigate("/work-orders")}
                        >
                            Back to List
                        </button>
                    </div>
                </div>
            </header>

            {/* Work Order Plan + Output + BOM Allocation */}
            <div className="mx-auto px-4 pb-4">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 space-y-5">
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
                    </div>

                    {/* Output progress */}
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-300">
                            Output Progress: <span
                            className="text-gray-100 font-semibold">{producedSoFar}</span> / {expectedQty}
                        </div>
                        <div className="text-xs text-gray-400">{outputPct}% of expected output</div>
                    </div>
                    <div className="w-full h-2 rounded-full bg-gray-800 border border-white/10 overflow-hidden">
                        <div className="h-full bg-sky-500/80" style={{width: `${outputPct}%`}}
                             title={`${outputPct}% of expected quantity`}/>
                    </div>

                    {/* BOM Components — Allocation & Usage */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold">BOM Components —
                            Allocation & Usage
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-800 text-sm">
                                <thead className="bg-gray-900/80">
                                <tr>
                                    <th className="px-4 py-2 text-left">Component</th>
                                    <th className="px-4 py-2 text-left">Name</th>
                                    <th className="px-4 py-2 text-left">Allocated</th>
                                    <th className="px-4 py-2 text-left">Consumed</th>
                                    <th className="px-4 py-2 text-left">Scrap</th>
                                    <th className="px-4 py-2 text-left w-64">Allocation / Usage</th>
                                    <th className="px-4 py-2 text-left w-56">Request Additional</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {aggregatedBom.map((r) => {
                                    const reserve = Number(r.reserve || 0);
                                    const used = Number(r.consumed || 0) + Number(r.scrap || 0);
                                    const remain = Math.max(0, reserve - used);
                                    const pct = reserve > 0 ? Math.min(100, Math.round((used / reserve) * 100)) : 0;
                                    return (
                                        <tr key={r.itemId}>
                                            <td className="px-4 py-2 font-mono">{r.itemId}</td>
                                            <td className="px-4 py-2">{r.name}</td>
                                            <td className="px-4 py-2 font-mono">{reserve}</td>
                                            <td className="px-4 py-2">{r.consumed}</td>
                                            <td className="px-4 py-2">{r.scrap}</td>
                                            <td className="px-4 py-2">
                                                <div className="text-[11px] text-gray-400 mb-1">
                                                    Remaining Allocation: <span
                                                    className="text-gray-200 font-mono">{remain}</span>
                                                </div>
                                                <div
                                                    className="w-full h-2 rounded-full bg-gray-800 border border-white/10 overflow-hidden"
                                                    title={`${pct}% of allocation used`}>
                                                    <div className="h-full bg-emerald-500/80"
                                                         style={{width: `${pct}%`}}/>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        inputMode="decimal"
                                                        className="w-28 rounded bg-gray-800 border border-white/10 px-2 py-1"
                                                        placeholder="Qty"
                                                        value={topRequests[r.itemId] ?? ""}
                                                        onChange={(e) => setTopReqQty(r.itemId, e.target.value)}
                                                    />
                                                    <button
                                                        onClick={() => submitTopRequest(r.itemId)}
                                                        disabled={!(Number(topRequests[r.itemId]) > 0)}
                                                        className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white text-xs disabled:opacity-50"
                                                    >
                                                        Request
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {aggregatedBom.length === 0 && (
                                    <tr>
                                        <td className="px-4 py-3 text-gray-500" colSpan={7}>No components found.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-4 py-2 text-[11px] text-gray-400 border-t border-white/10">
                            Requests here are general (not tied to a specific operation). See recent requests below.
                        </div>
                    </div>

                    {/* Recent Requests Snapshot */}
                    <div className="rounded-xl bg-gray-900/40 border border-white/10 overflow-hidden">
                        <div className="px-4 py-2 border-b border-white/10 text-sm font-semibold">Recent Component
                            Requests
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-800 text-xs">
                                <thead className="bg-gray-900/80">
                                <tr>
                                    <th className="px-3 py-2 text-left">When</th>
                                    <th className="px-3 py-2 text-left">Operation</th>
                                    <th className="px-3 py-2 text-left">Component</th>
                                    <th className="px-3 py-2 text-left">Qty</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {requestLog.slice().reverse().slice(0, 8).map((r, i) => (
                                    <tr key={i}>
                                        <td className="px-3 py-2">{r.at}</td>
                                        <td className="px-3 py-2 font-mono">{r.opId ||
                                            <span className="text-gray-500">—</span>}</td>
                                        <td className="px-3 py-2 font-mono">{r.itemId}</td>
                                        <td className="px-3 py-2">{r.qty}</td>
                                    </tr>
                                ))}
                                {requestLog.length === 0 && (
                                    <tr>
                                        <td className="px-3 py-3 text-gray-500" colSpan={4}>No requests yet.</td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>
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

                        <div className="grid grid-cols-2 md:flex md:flex-row gap-3">
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
            </div>

            {/* Kanban — horizontal scroll on mobile, grid on desktop */}
            <section className="mx-auto w-full px-4 pb-16 sm:pb-12">
                <div
                    className="flex md:grid md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto snap-x snap-mandatory [-webkit-overflow-scrolling:touch] scrollbar-thin">
                    {STATUS_LIST.map((s) => (
                        <Column key={s} title={s} items={filtered.filter((o) => o.status === s)}/>
                    ))}
                </div>
                <div className="mt-4 text-xs text-gray-500 mx-auto px-1 sm:px-4">
                    Tip: Drag cards to change status on desktop. On mobile, use <span
                    className="text-blue-200">Move</span>. Click the <span className="text-gray-300">title</span> to
                    open details. The <span className="text-emerald-200">Output</span> button appears only on Completed
                    cards.
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

            {/* Complete / Materials Modal (editable) */}
            <Modal
                open={completeModal.open}
                title={"Production & Materials"}
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
                            Save
                        </button>
                    </>
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
                                        <input
                                            inputMode="decimal"
                                            className="w-28 rounded bg-gray-800 border border-white/10 px-2 py-1"
                                            value={r.consumed ?? 0}
                                            onChange={(e) => updateRow(idx, "consumed", e.target.value)}
                                        />
                                    </td>
                                    <td className="px-3 py-2">
                                        <input
                                            inputMode="decimal"
                                            className="w-28 rounded bg-gray-800 border border-white/10 px-2 py-1"
                                            value={r.scrap ?? 0}
                                            onChange={(e) => updateRow(idx, "scrap", e.target.value)}
                                        />
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Output confirmation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Produced</label>
                            <input
                                inputMode="decimal"
                                className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                value={completeModal.produced}
                                onChange={(e) => setCompleteModal(m => ({...m, produced: Number(e.target.value || 0)}))}
                            />
                        </div>
                    </div>

                    {/* Notes (optional) */}
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">Notes</label>
                        <textarea
                            rows={3}
                            value={completeModal.notes}
                            onChange={(e) => setCompleteModal(m => ({...m, notes: e.target.value}))}
                            placeholder="Optional notes"
                            className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                        />
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                open={deleteModal.open}
                title="Remove Operation?"
                onClose={() => setDeleteModal({open: false, opId: null})}
                footer={
                    <>
                        <button
                            onClick={() => setDeleteModal({open: false, opId: null})}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={confirmDeleteOp}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm"
                        >
                            Delete
                        </button>
                    </>
                }
            >
                <div className="text-sm text-gray-300">
                    This will permanently remove the operation{" "}
                    <span className="font-mono">{deleteModal.opId}</span> from this board. This action cannot be undone.
                </div>
            </Modal>

            {/* Release Modal */}
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
                            onClick={() => {
                                if (!releaseModal.expiryDate || Number(releaseModal.releaseQty) <= 0) return;
                                setReleaseModal({
                                    open: false,
                                    title: "",
                                    variant: "info",
                                    proceedLabel: "",
                                    pending: [],
                                    releaseQty: 0,
                                    expiryDate: ""
                                });
                            }}
                            disabled={!releaseModal.expiryDate || Number(releaseModal.releaseQty) <= 0}
                            className={`px-4 py-2 rounded-lg text-sm disabled:opacity-50 ${releaseModal.variant === "warn" ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
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
                                You can still release, but ensure the output and materials are correct.
                            </div>
                        </div>
                    )}

                    {/* Output section */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60">
                        <div className="px-4 py-3 border-b border-white/10 text-sm font-semibold">Output (Finished
                            Good)
                        </div>
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="text-xs text-gray-400">Item ID</div>
                                <div
                                    className="px-3 py-2 rounded-lg bg-gray-800/60 border border-white/10 font-mono">{woPlan.itemId}</div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-xs text-gray-400">Item Name</div>
                                <div
                                    className="px-3 py-2 rounded-lg bg-gray-800/60 border border-white/10">{woPlan.itemName}</div>
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
                </div>
            </Modal>

            {/* Move Modal (mobile-friendly status change) */}
            <Modal
                open={moveModal.open}
                title="Move Operation"
                onClose={() => setMoveModal({open: false, opId: null})}
                footer={
                    <button
                        onClick={() => setMoveModal({open: false, opId: null})}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                    >
                        Close
                    </button>
                }
            >
                <div className="space-y-4">
                    <div className="text-sm text-gray-300">Select a target column:</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {STATUS_LIST.map(s => (
                            <button
                                key={s}
                                onClick={() => {
                                    const id = moveModal.opId;
                                    setMoveModal({open: false, opId: null});
                                    applyStatusChange(id, s);
                                }}
                                className="px-3 py-2 rounded-lg border border-white/10 bg-gray-800 hover:bg-gray-700 text-sm"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className="text-xs text-gray-500">Hold and Completed may require additional input.</div>
                </div>
            </Modal>
        </div>
    );
};

export default WorkOrderOperationsPage;
