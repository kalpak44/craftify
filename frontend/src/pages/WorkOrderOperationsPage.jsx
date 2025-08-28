// WorkOrderOperationsPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

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
    <span
        className={`px-2 py-1 text-xs rounded-full ${
            map[value] || "bg-gray-600/30 text-gray-300"
        }`}
    >
    {value}
  </span>
);

const WorkOrderOperationsPage = () => {
    const { id: woId } = useParams();
    const navigate = useNavigate();

    // --- Example operations (6-7+)
    const initialOps = [
        {
            id: "OP-0001",
            title: "Cut raw sheets",
            status: "Open",
            priority: "High",
            estimate: "6h",
            assignee: "Alice Chen",
            updated: "2025-02-18",
        },
        {
            id: "OP-0002",
            title: "CNC milling",
            status: "In Progress",
            priority: "Rush",
            estimate: "10h",
            assignee: "Bob Martin",
            updated: "2025-02-19",
        },
        {
            id: "OP-0003",
            title: "Anodize frame",
            status: "Hold",
            priority: "Medium",
            estimate: "2d",
            assignee: "Carla Diaz",
            updated: "2025-02-17",
        },
        {
            id: "OP-0004",
            title: "Sub-assembly QA",
            status: "Open",
            priority: "Low",
            estimate: "3h",
            assignee: "Deepak Rao",
            updated: "2025-02-18",
        },
        {
            id: "OP-0005",
            title: "Final assembly",
            status: "In Progress",
            priority: "High",
            estimate: "1d",
            assignee: "Alice Chen",
            updated: "2025-02-19",
        },
        {
            id: "OP-0006",
            title: "Packaging",
            status: "Completed",
            priority: "Low",
            estimate: "4h",
            assignee: "Bob Martin",
            updated: "2025-02-16",
        },
        {
            id: "OP-0007",
            title: "Labeling & docs",
            status: "Open",
            priority: "Medium",
            estimate: "5h",
            assignee: "Carla Diaz",
            updated: "2025-02-18",
        },
    ];

    // --- State
    const [ops, setOps] = useState(initialOps);
    const [dragOverCol, setDragOverCol] = useState(null);
    const [editing, setEditing] = useState(null); // { id, field } | null
    const [query, setQuery] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [assigneeFilter, setAssigneeFilter] = useState("all");

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

    // --- DnD (raw JS)
    const onDragStart = (e, opId) => {
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
        setOps((old) =>
            old.map((o) =>
                o.id === opId
                    ? {
                        ...o,
                        status: newStatus,
                        updated: new Date().toISOString().slice(0, 10),
                    }
                    : o
            )
        );
        setDragOverCol(null);
    };

    // --- Inline edit
    const startEdit = (id, field) => setEditing({ id, field });
    const commitEdit = (id, field, value) => {
        setOps((prev) =>
            prev.map((o) => (o.id === id ? { ...o, [field]: value, updated: new Date().toISOString().slice(0, 10) } : o))
        );
        setEditing(null);
    };

    // --- Actions
    const removeOp = (id) => setOps((prev) => prev.filter((o) => o.id !== id));
    const gotoNew = () => navigate(`/work-orders/${woId}/operations/new`);
    const gotoEdit = (opId) => navigate(`/work-orders/${woId}/operations/${opId}/edit`);

    // --- Column
    const Column = ({ title, items }) => (
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
                  title === "Open"
                      ? "bg-blue-400"
                      : title === "In Progress"
                          ? "bg-indigo-400"
                          : title === "Completed"
                              ? "bg-green-400"
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
                        draggable
                        onDragStart={(e) => onDragStart(e, op.id)}
                        className={`group border-l-4 ${PRIORITY_BORDER[op.priority]} rounded-lg bg-gray-800/70 border border-gray-800/80 hover:bg-gray-800 transition shadow-sm`}
                        role="listitem"
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
                                        <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[op.priority]}`} title={`Priority: ${op.priority}`} />
                                        {pill(op.priority, PRIORITY_CLS)}
                                    </div>
                                </div>

                                {/* Meta row */}
                                <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                                    {/* Assignee editable */}
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

                                    {/* Estimate editable */}
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
                                    </div>
                                    <button
                                        className="px-2.5 py-1 rounded bg-gray-900/60 border border-white/10 text-xs hover:bg-gray-800 text-red-300"
                                        onClick={() => removeOp(op.id)}
                                        title="Remove operation"
                                    >
                                        Remove
                                    </button>
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
            <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Operations • {woId}</h1>
                        <p className="mt-2 text-gray-400">Manage operations on a Kanban board. Drag to change status.</p>
                    </div>
                    <div className="flex gap-3 items-center">
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

            {/* Toolbar */}
            <div className="mx-auto max-w-6xl px-4 pb-4">
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
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>

                        <select
                            value={assigneeFilter}
                            onChange={(e) => setAssigneeFilter(e.target.value)}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                        >
                            <option value="all">All Assignees</option>
                            {assignees.map((a) => (
                                <option key={a} value={a}>
                                    {a}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Kanban */}
            <section className="mx-auto w-full px-4 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {STATUS_LIST.map((s) => (
                        <Column key={s} title={s} items={filtered.filter((o) => o.status === s)} />
                    ))}
                </div>
                <div className="mt-4 text-xs text-gray-500 mx-auto max-w-6xl px-4">
                    Tip: Double-click the <span className="text-gray-300">title</span>, <span className="text-gray-300">assignee</span>, or{" "}
                    <span className="text-gray-300">estimation</span> to edit. Drag cards between columns to change status.
                </div>
            </section>
        </div>
    );
};

export default WorkOrderOperationsPage;
