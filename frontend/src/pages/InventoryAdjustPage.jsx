import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";

/**
 * InventoryAdjustPage — React + Tailwind (plain JS)
 * Aligned with WorkOrders/Inventory styles.
 * - Mock items + stock
 * - Document details + multi-line adjustments
 * - Increase / Decrease / Set To types
 * - Client-side validation, autosave, keyboard shortcuts
 */

// ---- Mock master data ----
const ITEMS = [
    {id: "ITM-001", name: "Warm Yellow LED", uom: "pcs"},
    {id: "ITM-002", name: "Large Widget", uom: "pcs"},
    {id: "ITM-003", name: "Plastic Case", uom: "pcs"},
    {id: "ITM-004", name: "Lion Bracket", uom: "pcs"},
    {id: "ITM-005", name: "Chain Bracket", uom: "pcs"},
    {id: "ITM-006", name: "Front Assembly", uom: "ea"},
    {id: "ITM-007", name: "Steel Frame", uom: "pcs"},
    {id: "ITM-008", name: "Blue Paint (RAL5010)", uom: "L"},
    {id: "ITM-009", name: "Screws M3×8", uom: "ea"},
    {id: "ITM-010", name: "Assembly Kit 10", uom: "kit"},
];

// on-hand per (itemId, location, bin, lot) — mock
const STOCK = [
    {itemId: "ITM-006", location: "Main WH", bin: "A1", lot: "", onHand: 208},
    {itemId: "ITM-002", location: "Main WH", bin: "B4", lot: "LW-2502", onHand: 310},
    {itemId: "ITM-003", location: "Main WH", bin: "C2", lot: "", onHand: 1350},
    {itemId: "ITM-005", location: "Main WH", bin: "D1", lot: "CB-0101", onHand: 1320},
    {itemId: "ITM-004", location: "Main WH", bin: "D3", lot: "", onHand: 350},
    {itemId: "ITM-008", location: "Chem Store", bin: "PA-1", lot: "P-2025-02", onHand: 12},
    {itemId: "ITM-009", location: "Main WH", bin: "H8", lot: "", onHand: 1500},
    {itemId: "ITM-007", location: "Yard", bin: "ST-OUT", lot: "", onHand: 90},
    {itemId: "ITM-001", location: "Electronics", bin: "E1", lot: "LED-01", onHand: 5000},
    {itemId: "ITM-010", location: "Main WH", bin: "KIT-1", lot: "", onHand: 5},
];

const LOCATIONS = ["Main WH", "Chem Store", "Yard", "Electronics"];
const BINS = {
    "Main WH": ["A1", "B4", "C2", "D1", "D3", "H8", "KIT-1"],
    "Chem Store": ["PA-1", "PA-2"],
    Yard: ["ST-OUT", "ST-IN"],
    Electronics: ["E1", "E2"],
};

const nextDocId = (() => {
    let n = 3001;
    return () => `ADJ-${String(n++)}`;
})();

const newLine = () => ({
    key: crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
    itemId: "",
    uom: "",
    location: "",
    bin: "",
    lot: "",
    type: "Increase", // Increase | Decrease | Set To
    qty: "",
    notes: "",
});

export default function InventoryAdjustPage() {
    const navigate = useNavigate();

    // ---- Header fields ----
    const [docId, setDocId] = useState(nextDocId());
    const [docDate, setDocDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [reason, setReason] = useState("Cycle Count");
    const [reference, setReference] = useState("");
    const [headerNotes, setHeaderNotes] = useState("");

    // ---- Lines ----
    const [lines, setLines] = useState([newLine()]);

    // ---- Autosave (fake) ----
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
    }, [docId, docDate, reason, reference, headerNotes, lines]);

    // ---- Unsaved-changes guard ----
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

    // ---- Helpers ----
    const findItem = (id) => ITEMS.find((i) => i.id === id);
    const onHandFor = (l) => {
        if (!l.itemId || !l.location || !l.bin) return 0;
        const s = STOCK.find(
            (s) =>
                s.itemId === l.itemId &&
                s.location === l.location &&
                s.bin === l.bin &&
                (s.lot || "") === (l.lot || "")
        );
        return s?.onHand ?? 0;
    };

    const netChangeFor = (l) => {
        const q = Number(l.qty || 0) || 0;
        if (l.type === "Increase") return q;
        if (l.type === "Decrease") return -q;
        // Set To -> delta = newCount - onHand
        return (Number(q) || 0) - onHandFor(l);
    };

    // ---- Validation ----
    const errors = useMemo(() => {
        const list = [];
        if (!docId) list.push("Document ID is required.");
        if (!docDate) list.push("Document date is required.");
        const active = lines.filter(
            (l) => l.itemId || l.location || l.bin || l.lot || l.qty || l.notes
        );
        if (active.length === 0) list.push("Add at least one line.");

        active.forEach((l, idx) => {
            const tag = `Line ${idx + 1}`;
            if (!l.itemId) list.push(`${tag}: Item is required.`);
            if (!l.uom) list.push(`${tag}: UoM is required.`);
            if (!l.location) list.push(`${tag}: Location is required.`);
            if (!l.bin) list.push(`${tag}: Bin is required.`);
            const q = Number(l.qty || 0);
            if (!q && l.type !== "Set To") list.push(`${tag}: Quantity must be > 0.`);
            if (l.type === "Set To" && q < 0) list.push(`${tag}: New count cannot be negative.`);
            if (l.type === "Decrease" && q > onHandFor(l))
                list.push(`${tag}: Decrease exceeds available (${onHandFor(l)}).`);
        });

        return list;
    }, [lines, docId, docDate]);

    // ---- Derived totals ----
    const totalLines = lines.filter((l) => l.itemId && (Number(l.qty || 0) > 0 || l.type === "Set To")).length;
    const netChange = lines.reduce((s, l) => s + netChangeFor(l), 0);
    const issueCount = errors.length;

    // ---- Line operations ----
    const addLine = () => setLines((rs) => [...rs, newLine()]);
    const removeLine = (key) => setLines((rs) => rs.filter((r) => r.key !== key));
    const cloneLine = (key) =>
        setLines((rs) => {
            const i = rs.findIndex((r) => r.key === key);
            if (i === -1) return rs;
            const nr = {...rs[i], key: crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)};
            return [...rs.slice(0, i + 1), nr, ...rs.slice(i + 1)];
        });
    const updateLine = (key, patch) =>
        setLines((rs) => rs.map((r) => (r.key === key ? {...r, ...patch} : r)));

    // Keyboard shortcuts on table
    const tableRef = useRef(null);
    useEffect(() => {
        const handler = (e) => {
            const key = e.target?.dataset?.rowkey;
            if (!key) return;
            if (e.key === "Enter") {
                if (e.metaKey || e.ctrlKey) cloneLine(key);
                else if (!e.shiftKey) addLine();
            }
            if (e.key === "Delete") removeLine(key);
        };
        const el = tableRef.current;
        el && el.addEventListener("keydown", handler);
        return () => el && el.removeEventListener("keydown", handler);
    }, []);

    // ---- Actions (mock) ----
    const saveDraft = () => {
        setLastSavedAt(new Date());
        setDirty(false);
        alert("Adjustment draft saved (mock).");
    };
    const postAdjustment = () => {
        if (errors.length) {
            alert("Fix errors before posting.");
            return;
        }
        alert("Adjustment posted (mock). Stock would be updated and GL entry created.");
        navigate("/inventory");
    };
    const cancel = () => {
        if (dirty && !window.confirm("Discard unsaved changes?")) return;
        navigate("/inventory");
    };

    // ---- UI ----
    return (
        <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Inventory Adjustment</h1>
                        <p className="mt-2 text-gray-400">Increase, decrease, or set counts with full audit context.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={saveDraft}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                        >
                            Save Draft
                        </button>
                        <button
                            onClick={postAdjustment}
                            disabled={errors.length > 0}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-40"
                        >
                            Post Adjustment
                        </button>
                        <button
                            onClick={cancel}
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
            Doc ID: <span className="font-mono text-gray-300">{docId}</span>
          </span>
                </div>
            </header>

            {/* Content */}
            <section className="mx-auto max-w-6xl px-4 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Details */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">Details</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Document ID</label>
                                <input
                                    value={docId}
                                    onChange={(e) => setDocId(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Date</label>
                                <input
                                    type="date"
                                    value={docDate}
                                    onChange={(e) => setDocDate(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Reason</label>
                                <select
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                >
                                    <option>Cycle Count</option>
                                    <option>Damage</option>
                                    <option>Scrap</option>
                                    <option>Found</option>
                                    <option>Correction</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Reference</label>
                                <input
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    placeholder="e.g. CC-2025-02-18, WO-1002"
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                                <textarea
                                    rows={3}
                                    value={headerNotes}
                                    onChange={(e) => setHeaderNotes(e.target.value)}
                                    placeholder="Add context for audit (who, where, why)."
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Lines */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-white">Lines</h2>
                            <div className="flex items-center gap-2 text-sm">
                                <button
                                    onClick={addLine}
                                    className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700"
                                >
                                    + Add Line
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                            <table ref={tableRef} className="min-w-full divide-y divide-gray-800 text-sm">
                                <thead className="bg-gray-900/80">
                                <tr>
                                    <th className="px-4 py-3 text-left">Item</th>
                                    <th className="px-4 py-3 text-left">UoM</th>
                                    <th className="px-4 py-3 text-left">Location</th>
                                    <th className="px-4 py-3 text-left">Bin</th>
                                    <th className="px-4 py-3 text-left">Lot/Serial</th>
                                    <th className="px-4 py-3 text-left">Type</th>
                                    <th className="px-4 py-3 text-left">Qty / New Count</th>
                                    <th className="px-4 py-3 text-left">Notes</th>
                                    <th className="px-4 py-3 text-right">On hand</th>
                                    <th className="px-4 py-3 text-right">Δ</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {lines.map((l) => {
                                    const item = findItem(l.itemId);
                                    const oh = onHandFor(l);
                                    const q = Number(l.qty || 0) || 0;
                                    const delta = netChangeFor(l);
                                    const willGoNegative = l.type !== "Increase" && oh + delta < 0;
                                    return (
                                        <tr key={l.key} className="hover:bg-gray-800/40 transition">
                                            {/* Item */}
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    list="pick-items"
                                                    value={l.itemId}
                                                    data-rowkey={l.key}
                                                    onChange={(e) =>
                                                        updateLine(l.key, {
                                                            itemId: e.target.value,
                                                            uom: findItem(e.target.value)?.uom || l.uom,
                                                        })
                                                    }
                                                    placeholder="e.g. ITM-005"
                                                    className={`w-44 rounded-lg bg-gray-800 border ${
                                                        !l.itemId ? "border-red-500/60" : "border-white/10"
                                                    } px-3 py-2 text-sm`}
                                                />
                                                <datalist id="pick-items">
                                                    {ITEMS.map((i) => (
                                                        <option key={i.id} value={i.id}>{`${i.id} — ${i.name}`}</option>
                                                    ))}
                                                </datalist>
                                                {item && <div
                                                    className="text-xs text-gray-500 mt-1 truncate">{item.name}</div>}
                                            </td>

                                            {/* UoM */}
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={l.key}
                                                    value={l.uom}
                                                    onChange={(e) => updateLine(l.key, {uom: e.target.value})}
                                                    placeholder={item ? item.uom : "pcs"}
                                                    className={`w-20 rounded-lg bg-gray-800 border ${
                                                        !l.uom ? "border-red-500/60" : "border-white/10"
                                                    } px-3 py-2 text-sm`}
                                                />
                                            </td>

                                            {/* Location/Bin/Lot */}
                                            <td className="px-4 py-3 align-top">
                                                <select
                                                    data-rowkey={l.key}
                                                    value={l.location}
                                                    onChange={(e) => updateLine(l.key, {
                                                        location: e.target.value,
                                                        bin: ""
                                                    })}
                                                    className={`w-36 rounded-lg bg-gray-800 border ${
                                                        !l.location ? "border-red-500/60" : "border-white/10"
                                                    } px-3 py-2 text-sm`}
                                                >
                                                    <option value="">— Location —</option>
                                                    {LOCATIONS.map((x) => (
                                                        <option key={x} value={x}>
                                                            {x}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <select
                                                    data-rowkey={l.key}
                                                    value={l.bin}
                                                    onChange={(e) => updateLine(l.key, {bin: e.target.value})}
                                                    className={`w-28 rounded-lg bg-gray-800 border ${
                                                        !l.bin ? "border-red-500/60" : "border-white/10"
                                                    } px-3 py-2 text-sm`}
                                                >
                                                    <option value="">— Bin —</option>
                                                    {(BINS[l.location] || []).map((b) => (
                                                        <option key={b} value={b}>
                                                            {b}
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={l.key}
                                                    value={l.lot}
                                                    onChange={(e) => updateLine(l.key, {lot: e.target.value})}
                                                    placeholder="(optional)"
                                                    className="w-28 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </td>

                                            {/* Type */}
                                            <td className="px-4 py-3 align-top">
                                                <select
                                                    data-rowkey={l.key}
                                                    value={l.type}
                                                    onChange={(e) => updateLine(l.key, {type: e.target.value})}
                                                    className="w-32 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                >
                                                    <option>Increase</option>
                                                    <option>Decrease</option>
                                                    <option>Set To</option>
                                                </select>
                                            </td>

                                            {/* Qty / New Count */}
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={l.key}
                                                    inputMode="decimal"
                                                    value={l.qty}
                                                    onChange={(e) => updateLine(l.key, {qty: e.target.value})}
                                                    placeholder={l.type === "Set To" ? "New count" : "0"}
                                                    className={`w-28 rounded-lg bg-gray-800 border ${
                                                        (l.type !== "Set To" && (!l.qty || Number(l.qty) <= 0)) ||
                                                        (l.type === "Set To" && Number(l.qty) < 0)
                                                            ? "border-red-500/60"
                                                            : "border-white/10"
                                                    } px-3 py-2 text-sm`}
                                                />
                                                {willGoNegative && (
                                                    <div className="text-xs text-red-400 mt-1">Would go negative</div>
                                                )}
                                            </td>

                                            {/* Notes */}
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={l.key}
                                                    value={l.notes}
                                                    onChange={(e) => updateLine(l.key, {notes: e.target.value})}
                                                    placeholder="Optional"
                                                    className="w-48 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </td>

                                            {/* On hand / Δ */}
                                            <td className="px-4 py-3 align-top text-right text-gray-300">{oh}</td>
                                            <td
                                                className={`px-4 py-3 align-top text-right ${
                                                    delta < 0 ? "text-red-300" : delta > 0 ? "text-green-300" : "text-gray-300"
                                                }`}
                                            >
                                                {delta > 0 ? `+${delta}` : delta}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        onClick={() => cloneLine(l.key)}
                                                        className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-800/60 border-white/10 hover:bg-gray-700/60"
                                                    >
                                                        Clone
                                                    </button>
                                                    <button
                                                        onClick={() => removeLine(l.key)}
                                                        className="px-2.5 py-1.5 rounded-md border text-xs bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20"
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

                        {/* Table footer info */}
                        <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
                            <div>
                                Shortcuts: <span className="text-gray-300">Enter</span> add •{" "}
                                <span className="text-gray-300">Ctrl/⌘+D</span> clone •{" "}
                                <span className="text-gray-300">Delete</span> remove
                            </div>
                            <div className="flex items-center gap-3">
                                <span>Valid lines: <span className="text-gray-300">{totalLines}</span></span>
                                <span>Net change:{" "}
                                    <span
                                        className={`${netChange < 0 ? "text-red-300" : netChange > 0 ? "text-green-300" : "text-gray-300"}`}>
                    {netChange > 0 ? `+${netChange}` : netChange}
                  </span>
                </span>
                            </div>
                        </div>
                    </div>

                    {/* Attachments (placeholder) */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">Attachments</h2>
                        <div className="text-sm text-gray-400">Upload count sheets or photos here later. (Placeholder)
                        </div>
                    </div>

                    {/* Error summary */}
                    {errors.length > 0 && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
                            <div className="font-semibold text-red-300 mb-1">Please fix the following before posting:
                            </div>
                            <ul className="list-disc pl-5 space-y-1 text-red-200">
                                {errors.map((e, i) => (
                                    <li key={i}>{e}</li>
                                ))}
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
                                <div className="text-xs text-gray-400">Lines</div>
                                <div className="text-lg font-semibold text-gray-100">{totalLines}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Net Change</div>
                                <div
                                    className={`text-lg font-semibold ${
                                        netChange < 0 ? "text-red-300" : netChange > 0 ? "text-green-300" : "text-gray-100"
                                    }`}
                                >
                                    {netChange > 0 ? `+${netChange}` : netChange}
                                </div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2">
                                <div className="text-xs text-gray-400">Reason</div>
                                <div className="text-sm text-gray-200">{reason}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2">
                                <div className="text-xs text-gray-400">Date</div>
                                <div className="text-sm text-gray-200">{docDate}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2">
                                <div className="text-xs text-gray-400">Issues</div>
                                <div className={`text-sm ${issueCount ? "text-yellow-300" : "text-gray-300"}`}>
                                    {issueCount ? `${issueCount} validation issue(s)` : "None"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 text-xs text-gray-400">
                        <div className="font-semibold text-gray-300 mb-2">Tips</div>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Use <em>Set To</em> for cycle counts; Increase/Decrease for event-based changes.</li>
                            <li>Decrease lines cannot exceed available stock.</li>
                            <li>Lots/serials are optional; include for traceability.</li>
                            <li>Keyboard shortcuts speed up data entry.</li>
                        </ul>
                    </div>
                </aside>
            </section>
        </div>
    );
}

export {InventoryAdjustPage};
