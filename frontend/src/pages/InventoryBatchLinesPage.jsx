// InventoryLotCustomDetailsPage.jsx
import React, {useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";

/**
 * InventoryLotCustomDetailsPage
 *
 * Mobile-optimized custom fields editor for a single inventory lot.
 * Improvements for mobile UX (while keeping desktop table intact):
 * - Dedicated mobile card view (md:hidden) with large tap targets and stacked inputs.
 * - Sticky bottom action bar on small screens for quick Save / Add field.
 * - Drag & drop kept for desktop; on mobile, use Move Up/Down buttons.
 * - Touch-friendly input paddings, larger controls, and improved spacing.
 */
const STORAGE_KEY = (itemId, lotId) => `inv:${itemId}:${lotId}:customFields`;

export default function InventoryLotCustomDetailsPage() {
    const navigate = useNavigate();
    const {routeItemId, routeLotId} = useParams();

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
    const lotId = routeLotId || "L-0000";
    const itemInfo = items[itemId] || {name: "Unknown Item", uom: "ea"};

    // Load & save helpers
    const load = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY(itemId, lotId));
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
    }, [itemId, lotId]);

    const save = () => {
        localStorage.setItem(STORAGE_KEY(itemId, lotId), JSON.stringify(rows));
        setDirty(false);
    };

    // Debounced autosave on changes
    useEffect(() => {
        if (!dirty) return;
        const t = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY(itemId, lotId), JSON.stringify(rows));
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

    // Filter (preserve manual order)
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

    const moveUp = (id) => {
        setRows((prev) => {
            const from = prev.findIndex((r) => r.id === id);
            return moveItem(prev, from, Math.max(0, from - 1));
        });
        setDirty(true);
    };

    const moveDown = (id) => {
        setRows((prev) => {
            const from = prev.findIndex((r) => r.id === id);
            return moveItem(prev, from, Math.min(prev.length - 1, from + 1));
        });
        setDirty(true);
    };

    // Drag & Drop state (desktop only UI shows handle)
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
            <header className="mx-auto px-4 pt-8 pb-4 md:pt-10 md:pb-6">
                <div className="flex items-start md:items-end justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                        <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                            Inventory • <span className="font-mono">{itemId}</span> • Lot{" "}
                            <span className="font-mono">{lotId}</span>
                        </h1>
                        <p className="mt-1 md:mt-2 text-gray-400 text-sm md:text-base">
                            {itemInfo.name} — UoM: {itemInfo.uom}. Custom fields for this lot.
                        </p>
                    </div>

                    {/* Desktop actions */}
                    <div className="hidden sm:flex gap-2 md:gap-3">
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
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                            onClick={addRow}
                            title="Add custom field"
                        >
                            + Add field
                        </button>
                        <button
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                            onClick={() => navigate(`/inventory/${encodeURIComponent(itemId)}`)}
                            title="Back to Lot Lines"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className="mx-auto px-4 pb-3 md:pb-4">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-3 md:p-4">
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <input
                                placeholder="Search Name or Note…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full rounded-lg bg-gray-800 border border-white/10 pl-3 pr-10 py-2.5 text-sm md:text-base"
                                inputMode="text"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">⌕</span>
                        </div>
                        <div className="hidden md:flex items-center gap-2 ml-auto">
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

            {/* Mobile card list */}
            <section className="mx-auto px-4 md:hidden pb-28"> {/* bottom padding for sticky bar */}
                <div className="space-y-3">
                    {filtered.map((r, idx) => {
                        const isDateRange = r.type === "date-range";
                        const isDate = r.type === "date";
                        const isText = r.type === "text";
                        const ensureRange = (val) => (typeof val === "object" && val ? val : {from: "", to: ""});
                        const val = isDateRange ? ensureRange(r.value) : r.value ?? "";

                        return (
                            <div key={r.id}
                                 className="rounded-xl border border-white/10 bg-gray-900/70 p-3 active:bg-gray-800/40">
                                <div className="flex items-center justify-between gap-2">
                                    <input
                                        value={r.name}
                                        onChange={(e) => setField(r.id, {name: e.target.value})}
                                        className="flex-1 rounded-lg bg-gray-800 border border-white/10 px-3 py-2.5 text-base"
                                        placeholder="Field name (e.g., Certificate No.)"
                                        aria-label="Field name"
                                    />
                                    <button
                                        onClick={() => deleteRow(r.id)}
                                        className="shrink-0 px-3 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm"
                                        title="Remove field"
                                        aria-label="Delete field"
                                    >
                                        Delete
                                    </button>
                                </div>

                                <div className="mt-2 grid grid-cols-2 gap-2">
                                    <select
                                        value={r.type}
                                        onChange={(e) => {
                                            const nextType = e.target.value;
                                            const nextValue = nextType === "date-range" ? {from: "", to: ""} : "";
                                            setField(r.id, {type: nextType, value: nextValue});
                                        }}
                                        className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2.5 text-base col-span-2"
                                        aria-label="Field type"
                                    >
                                        <option value="text">Text</option>
                                        <option value="date">Date</option>
                                        <option value="date-range">Date range</option>
                                    </select>

                                    {/* Value */}
                                    {isText && (
                                        <input
                                            value={val}
                                            onChange={(e) => setField(r.id, {value: e.target.value})}
                                            className="col-span-2 rounded-lg bg-gray-800 border border-white/10 px-3 py-2.5 text-base"
                                            placeholder="Enter value…"
                                            aria-label="Field value"
                                        />
                                    )}
                                    {isDate && (
                                        <input
                                            type="date"
                                            value={val || ""}
                                            onChange={(e) => setField(r.id, {value: e.target.value})}
                                            className="col-span-2 rounded-lg bg-gray-800 border border-white/10 px-3 py-2.5 text-base"
                                            aria-label="Field date"
                                        />
                                    )}
                                    {isDateRange && (
                                        <>
                                            <input
                                                type="date"
                                                value={val.from || ""}
                                                onChange={(e) => setField(r.id, {
                                                    value: {
                                                        ...val,
                                                        from: e.target.value
                                                    }
                                                })}
                                                className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2.5 text-base"
                                                aria-label="Date from"
                                            />
                                            <input
                                                type="date"
                                                value={val.to || ""}
                                                onChange={(e) => setField(r.id, {value: {...val, to: e.target.value}})}
                                                className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2.5 text-base"
                                                aria-label="Date to"
                                            />
                                        </>
                                    )}

                                    <input
                                        value={r.note}
                                        onChange={(e) => setField(r.id, {note: e.target.value})}
                                        className="col-span-2 rounded-lg bg-gray-800 border border-white/10 px-3 py-2.5 text-base"
                                        placeholder="Optional note…"
                                        aria-label="Field note"
                                    />
                                </div>

                                {/* Mobile ordering controls */}
                                <div className="mt-3 flex items-center justify-between gap-2">
                                    <div className="text-xs text-gray-400">Position: {idx + 1}</div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => moveUp(r.id)}
                                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm"
                                            aria-label="Move up"
                                        >
                                            ↑
                                        </button>
                                        <button
                                            onClick={() => moveDown(r.id)}
                                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm"
                                            aria-label="Move down"
                                        >
                                            ↓
                                        </button>
                                        <button
                                            onClick={() => moveTop(r.id)}
                                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm"
                                            aria-label="Move to top"
                                        >
                                            Top
                                        </button>
                                        <button
                                            onClick={() => moveBottom(r.id)}
                                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm"
                                            aria-label="Move to bottom"
                                        >
                                            Bottom
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filtered.length === 0 && (
                        <div className="rounded-xl border border-white/10 bg-gray-900/60 p-6 text-center text-gray-400">
                            No custom fields yet. Tap <span className="text-gray-200">+ Add field</span> below to create
                            one.
                        </div>
                    )}
                </div>
            </section>

            {/* Desktop table (>= md) */}
            <section className="mx-auto px-4 hidden md:block pb-12">
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

            {/* Sticky bottom action bar (mobile) */}
            <div
                className="fixed bottom-0 left-0 right-0 md:hidden border-t border-white/10 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/70">
                <div className="mx-auto px-4 py-3 flex items-center gap-2">
                    <button
                        className={`flex-1 px-4 py-3 rounded-xl text-base ${
                            dirty ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 text-gray-300"
                        }`}
                        onClick={save}
                        aria-label="Save custom details"
                    >
                        {dirty ? "Save" : "Saved"}
                    </button>
                    <button
                        className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base"
                        onClick={addRow}
                        aria-label="Add custom field"
                    >
                        + Add field
                    </button>
                    <button
                        className="px-4 py-3 rounded-xl bg-gray-800 border border-white/10 text-base"
                        onClick={() => navigate(`/inventory/${encodeURIComponent(itemId)}`)}
                        aria-label="Back to lot lines"
                    >
                        Back
                    </button>
                </div>
            </div>
        </div>
    );
}

export {InventoryLotCustomDetailsPage};