// InventoryBatchCustomDetailsPage.jsx
import React, {useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";

const STORAGE_KEY = (itemId, batchId) => `inv:${itemId}:${batchId}:customFields`;

export default function InventoryBatchCustomDetailsPage() {
    const navigate = useNavigate();
    const {routeItemId, routeBatchId} = useParams();

    // Mock items dict for header context
    const items = {
        "ITM-002": {name: "Large Widget", uom: "pcs"},
        "ITM-003": {name: "Plastic Case", uom: "pcs"},
        "ITM-004": {name: "Lion Bracket", uom: "pcs"},
        "ITM-005": {name: "Chain Bracket", uom: "pcs"},
        "ITM-006": {name: "Front Assembly", uom: "ea"},
        "ITM-008": {name: "Blue Paint (RAL5010)", uom: "L"},
        "ITM-009": {name: "Screws M3×8", uom: "ea"},
        "ITM-010": {name: "Assembly Kit 10", uom: "kit"},
    };

    const itemId = routeItemId || "ITM-000";
    const batchId = routeBatchId || "B-0000";
    const itemInfo = items[itemId] || {name: "Unknown Item", uom: "ea"};

    // Load & save helpers
    const load = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY(itemId, batchId));
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const [rows, setRows] = useState(() => load());
    const [dirty, setDirty] = useState(false);
    const [query, setQuery] = useState(""); // filter by name/note

    useEffect(() => {
        setRows(load());
        setDirty(false);
    }, [itemId, batchId]);

    const save = () => {
        localStorage.setItem(STORAGE_KEY(itemId, batchId), JSON.stringify(rows));
        setDirty(false);
    };

    // Debounced autosave on changes
    useEffect(() => {
        if (!dirty) return;
        const t = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY(itemId, batchId), JSON.stringify(rows));
            setDirty(false);
        }, 400);
        return () => clearTimeout(t);
    }, [rows, dirty]);

    // CRUD
    const addRow = () => {
        const newRow = {
            id: `cf_${Date.now()}`,
            name: "",
            type: "text", // "text" | "date" | "date-range"
            value: "",
            note: "",
        };
        setRows((r) => [newRow, ...r]); // prepend new at top
        setDirty(true);
    };

    const deleteRow = (id) => {
        setRows((r) => r.filter((x) => x.id !== id));
        setDirty(true);
    };

    const setField = (id, patch) => {
        setRows((r) => r.map((x) => (x.id === id ? {...x, ...patch} : x)));
        setDirty(true);
    };

    // Filter (preserve manual order; no sorting to respect custom ordering)
    const filtered = useMemo(() => {
        if (!query) return rows;
        const q = query.toLowerCase();
        return rows.filter(
            (r) =>
                (r.name || "").toLowerCase().includes(q) ||
                (r.note || "").toLowerCase().includes(q)
        );
    }, [rows, query]);

    // --- Reordering ---

    const moveItem = (list, fromIndex, toIndex) => {
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return list;
        const next = list.slice();
        const [m] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, m);
        return next;
    };

    const moveTop = (id) => {
        setRows((prev) => {
            const from = prev.findIndex((r) => r.id === id);
            return moveItem(prev, from, 0);
        });
        setDirty(true);
    };

    const moveBottom = (id) => {
        setRows((prev) => {
            const from = prev.findIndex((r) => r.id === id);
            return moveItem(prev, from, prev.length - 1);
        });
        setDirty(true);
    };

    // Drag & Drop state
    const [dragId, setDragId] = useState(null);
    const [overId, setOverId] = useState(null);

    const onDragStart = (id) => (e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
        setDragId(id);
        setOverId(null);
    };

    const onDragOver = (id) => (e) => {
        e.preventDefault(); // needed to allow drop
        if (overId !== id) setOverId(id);
    };

    const onDragLeave = () => {
        setOverId(null);
    };

    const onDrop = (targetId) => (e) => {
        e.preventDefault();
        const sourceId = e.dataTransfer.getData("text/plain") || dragId;
        if (!sourceId) return;
        setRows((prev) => {
            const from = prev.findIndex((r) => r.id === sourceId);
            const to = prev.findIndex((r) => r.id === targetId);
            return moveItem(prev, from, to);
        });
        setDirty(true);
        setDragId(null);
        setOverId(null);
    };

    const onDragEnd = () => {
        setDragId(null);
        setOverId(null);
    };

    // UI
    return (
        <div
            className="min-h-[calc(100vh-140px)] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">
                            Inventory • <span className="font-mono">{itemId}</span> • Batch{" "}
                            <span className="font-mono">{batchId}</span> • Custom details
                        </h1>
                        <p className="mt-2 text-gray-400">
                            {itemInfo.name} — UoM: {itemInfo.uom}. Add and reorder your own fields for this batch.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            className={`px-4 py-2 ${
                                dirty ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 text-gray-300"
                            } rounded-lg text-sm`}
                            onClick={save}
                            title="Save custom details"
                        >
                            {dirty ? "Save" : "Saved"}
                        </button>
                        <button
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                            onClick={() =>
                                navigate(
                                    `/inventory/${encodeURIComponent(itemId)}`
                                )
                            }
                            title="Back to Batch Lines"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className="mx-auto px-4 pb-4">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1">
                            <input
                                placeholder="Search Name or Note…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full rounded-lg bg-gray-800 border border-white/10 pl-3 pr-10 py-2 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">⌕</span>
                        </div>
                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                onClick={addRow}
                                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                                title="Add custom field"
                            >
                                + Add field
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <section className="mx-auto px-4 pb-12">
                <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/60">
                    <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-gray-900/80">
                        <tr>
                            <th className="px-4 py-3 w-10 text-gray-500 font-semibold"></th>
                            <th className="px-4 py-3 font-semibold text-gray-300 text-left">Name</th>
                            <th className="px-4 py-3 font-semibold text-gray-300 text-left">Type</th>
                            <th className="px-4 py-3 font-semibold text-gray-300 text-left">Value</th>
                            <th className="px-4 py-3 font-semibold text-gray-300 text-left">Note</th>
                            <th className="px-4 py-3 font-semibold text-gray-300 text-right">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                        {filtered.map((r) => {
                            const isDateRange = r.type === "date-range";
                            const isDate = r.type === "date";
                            const isText = r.type === "text";
                            const ensureRange = (val) =>
                                typeof val === "object" && val ? val : {from: "", to: ""};
                            const val = isDateRange ? ensureRange(r.value) : r.value ?? "";

                            const isOver = overId === r.id;
                            const rowRing = isOver ? "ring-2 ring-blue-500/50" : "";

                            return (
                                <tr
                                    key={r.id}
                                    onDragOver={onDragOver(r.id)}
                                    onDrop={onDrop(r.id)}
                                    onDragLeave={onDragLeave}
                                    onDragEnd={onDragEnd}
                                    className={`hover:bg-gray-800/40 transition ${rowRing}`}
                                >
                                    {/* Drag handle */}
                                    <td className="px-4 py-3">
                      <span
                          draggable
                          onDragStart={onDragStart(r.id)}
                          className="inline-flex cursor-grab select-none text-gray-400 hover:text-gray-200"
                          title="Drag to reorder"
                          aria-label="Drag handle"
                      >
                        ⋮⋮
                      </span>
                                    </td>

                                    {/* Name */}
                                    <td className="px-4 py-3">
                                        <input
                                            value={r.name}
                                            onChange={(e) => setField(r.id, {name: e.target.value})}
                                            className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                            placeholder="e.g. Certificate No."
                                        />
                                    </td>

                                    {/* Type */}
                                    <td className="px-4 py-3">
                                        <select
                                            value={r.type}
                                            onChange={(e) => {
                                                const nextType = e.target.value;
                                                const nextValue = nextType === "date-range" ? {from: "", to: ""} : "";
                                                setField(r.id, {type: nextType, value: nextValue});
                                            }}
                                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                        >
                                            <option value="text">Text</option>
                                            <option value="date">Date</option>
                                            <option value="date-range">Date range</option>
                                        </select>
                                    </td>

                                    {/* Value (dynamic) */}
                                    <td className="px-4 py-3">
                                        {isText && (
                                            <input
                                                value={val}
                                                onChange={(e) => setField(r.id, {value: e.target.value})}
                                                className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                placeholder="Enter value…"
                                            />
                                        )}
                                        {isDate && (
                                            <input
                                                type="date"
                                                value={val || ""}
                                                onChange={(e) => setField(r.id, {value: e.target.value})}
                                                className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                            />
                                        )}
                                        {isDateRange && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="date"
                                                    value={val.from || ""}
                                                    onChange={(e) =>
                                                        setField(r.id, {value: {...val, from: e.target.value}})
                                                    }
                                                    className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                                <span className="text-gray-500">→</span>
                                                <input
                                                    type="date"
                                                    value={val.to || ""}
                                                    onChange={(e) =>
                                                        setField(r.id, {value: {...val, to: e.target.value}})
                                                    }
                                                    className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </div>
                                        )}
                                    </td>

                                    {/* Note */}
                                    <td className="px-4 py-3">
                                        <input
                                            value={r.note}
                                            onChange={(e) => setField(r.id, {note: e.target.value})}
                                            className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                            placeholder="Optional note…"
                                        />
                                    </td>

                                    {/* Actions */}
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => moveTop(r.id)}
                                                className="px-2 py-1 rounded bg-gray-800 border border-white/10 text-sm hover:bg-gray-700"
                                                title="Move to top"
                                            >
                                                Move top
                                            </button>
                                            <button
                                                onClick={() => moveBottom(r.id)}
                                                className="px-2 py-1 rounded bg-gray-800 border border-white/10 text-sm hover:bg-gray-700"
                                                title="Move to bottom"
                                            >
                                                Move bottom
                                            </button>
                                            <button
                                                onClick={() => deleteRow(r.id)}
                                                className="px-2 py-1 rounded bg-red-600/80 hover:bg-red-600 text-white text-sm"
                                                title="Remove field"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {filtered.length === 0 && (
                            <tr>
                                <td className="px-4 py-6 text-center text-gray-400" colSpan={6}>
                                    No custom fields yet. Click <span className="text-gray-200">+ Add field</span> to
                                    create one.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

export {InventoryBatchCustomDetailsPage};
