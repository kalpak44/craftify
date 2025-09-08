// WorkOrderOperationsCreationPage.jsx
import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";

/**
 * WorkOrderOperationsCreationPage — "New Operation" for a Work Order
 * - Fields: Operation ID, Title, Status, Priority, Assignee (text), Estimation, Notes
 * - Client-side validation (Title, Status, Priority, Assignee required; estimation pattern)
 * - Fake autosave banner with debounce (no alerts/console)
 * - Unsaved-changes guard (beforeunload)
 * - Sticky summary card
 * - Actions: Create Operation (navigate back to Kanban), Cancel
 * - Styling matches existing dark theme
 */

const STATUS_LIST = ["Open", "In Progress", "Hold", "Completed"];
const PRIORITIES = ["Low", "Medium", "High", "Rush"];

const PRIORITY_CLS = {
    Low: "bg-gray-600/30 text-gray-300",
    Medium: "bg-sky-600/30 text-sky-300",
    High: "bg-orange-600/30 text-orange-300",
    Rush: "bg-red-600/30 text-red-300",
};
const PRIORITY_DOT = {
    Low: "bg-gray-400",
    Medium: "bg-sky-400",
    High: "bg-orange-400",
    Rush: "bg-red-400",
};

// simple incremental op-id generator for mock data
const nextOpId = (() => {
    let n = 8; // assuming OP-0007 exists on the board
    return () => `OP-${String(n++).padStart(4, "0")}`;
})();

export default function WorkOrderOperationsDetailsPage() {
    const {id: woId} = useParams();
    const navigate = useNavigate();

    // ---------- Form state ----------
    const [opId, setOpId] = useState(nextOpId());
    const [title, setTitle] = useState("");
    const [status, setStatus] = useState("Open");
    const [priority, setPriority] = useState("Medium");
    const [assignee, setAssignee] = useState(""); // text field
    const [estimate, setEstimate] = useState(""); // e.g., "6h" or "2d"
    const [notes, setNotes] = useState("");

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
        }, 600);
    };

    useEffect(() => {
        requestSave();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [opId, title, status, priority, assignee, estimate, notes]);

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

    // ---------- Validation ----------
    const errors = useMemo(() => {
        const list = [];
        if (!opId.trim()) list.push("Operation ID is required.");
        if (!title.trim()) list.push("Operation title is required.");
        if (!status) list.push("Status is required.");
        if (!priority) list.push("Priority is required.");
        if (!assignee.trim()) list.push("Assignee is required.");

        if (estimate.trim()) {
            // allow patterns like "6h", "1.5h", "2d", "30m" (m/h/d)
            const ok = /^(\d+(\.\d+)?)(m|h|d)$/.test(estimate.trim());
            if (!ok) list.push("Estimation must be like 30m, 6h, or 2d.");
        }

        return list;
    }, [opId, title, status, priority, assignee, estimate]);

    const isValid = errors.length === 0;

    // ---------- Actions (mock) ----------
    const handleCreate = () => {
        if (!isValid) return;
        navigate(`/work-orders/${woId}/operations`, {
            state: {
                created: {
                    id: opId,
                    title,
                    status,
                    priority,
                    assignee,
                    estimate,
                    notes,
                    updated: new Date().toISOString().slice(0, 10),
                },
            },
            replace: false,
        });
    };

    const handleCancel = () => {
        navigate(`/work-orders/${woId}/operations`);
    };

    const PriorityBadge = ({value}) => (
        <span
            className={`inline-flex items-center gap-2 px-2 py-1 text-xs rounded-full ${PRIORITY_CLS[value]}`}
            title={`Priority: ${value}`}
        >
      <span className={`h-2 w-2 rounded-full ${PRIORITY_DOT[value]}`}/>
            {value}
    </span>
    );

    return (
        <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200 min-h-screen">
            {/* Header */}
            <header className="mx-auto px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">New Operation • {woId}</h1>
                        <p className="mt-2 text-gray-400">Create an operation for this work order. Fields marked with *
                            are required.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCreate}
                            disabled={!isValid}
                            className={`px-4 py-2 rounded-lg text-sm ${
                                isValid
                                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                                    : "bg-blue-600/50 text-white/70 cursor-not-allowed"
                            }`}
                        >
                            Create Operation
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
            Operation ID: <span className="font-mono text-gray-300">{opId}</span>
          </span>
                </div>
            </header>

            {/* Content */}
            <section className="mx-auto px-4 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left column (form) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">General</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Operation ID *</label>
                                <input
                                    value={opId}
                                    onChange={(e) => setOpId(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Status *</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                >
                                    {STATUS_LIST.map((s) => (
                                        <option key={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Title *</label>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. CNC milling, Final assembly, QA inspection"
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Priority *</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                >
                                    {PRIORITIES.map((p) => (
                                        <option key={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Assignee *</label>
                                <input
                                    value={assignee}
                                    onChange={(e) => setAssignee(e.target.value)}
                                    placeholder="e.g. Alice Chen"
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Estimation</label>
                                <input
                                    value={estimate}
                                    onChange={(e) => setEstimate(e.target.value)}
                                    placeholder="e.g. 30m, 6h, 2d"
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                                <textarea
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Optional description, work instructions, fixtures, etc."
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
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
                                <div className="text-xs text-gray-400">Work Order</div>
                                <div className="text-sm text-gray-200">{woId}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Operation</div>
                                <div className="text-sm text-gray-200 font-mono">{opId || "—"}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Status</div>
                                <div className="text-sm text-gray-200">{status}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Priority</div>
                                <div className="text-sm text-gray-200">
                                    <PriorityBadge value={priority}/>
                                </div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Assignee</div>
                                <div className="text-sm text-gray-200">{assignee ||
                                    <span className="text-gray-500">(not set)</span>}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Estimation</div>
                                <div className="text-lg font-semibold text-gray-100">{estimate || "—"}</div>
                            </div>

                            <div
                                className="col-span-2 rounded-2xl bg-gray-900/60 p-4 text-xs text-gray-400 border border-white/10">
                                <div className="font-semibold text-gray-300 mb-2">Tips</div>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Use clear, action-based titles (e.g., “CNC milling – top plate”).</li>
                                    <li>
                                        Estimation supports minutes (m), hours (h), and days (d), e.g., <span
                                        className="text-gray-300">30m</span>,{" "}
                                        <span className="text-gray-300">6h</span>, <span
                                        className="text-gray-300">2d</span>.
                                    </li>
                                    <li>You can edit fields on the Kanban card later via inline editing.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </aside>
            </section>
        </div>
    );
}

export {WorkOrderOperationsDetailsPage};
