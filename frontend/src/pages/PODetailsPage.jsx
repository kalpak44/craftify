// POCreationPage.jsx
import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";

/**
 * POCreationPage — lightweight ERP-style "New Purchase Order"
 * - Mock suppliers + items
 * - General info, Ship/Bill sections
 * - Line items table (add/clone/remove, qty/price/tax/discount)
 * - Other charges, live totals
 * - Client-side validation
 * - Fake autosave banner with debounce
 * - Unsaved-changes guard
 * - Sticky summary
 * - Actions are placeholders (alert/disabled)
 *
 * Styling matches the provided pages (dark gradient, rounded cards, chips, toolbar buttons).
 */

// ---- Mock masters ----
const SUPPLIERS = [
    {id: "SUP-001", name: "Acme Components", currency: "€", terms: "Net 30", status: "Active"},
    {id: "SUP-002", name: "NordFab Metals", currency: "€", terms: "Net 15", status: "Active"},
    {id: "SUP-003", name: "BrightChem", currency: "€", terms: "Prepaid", status: "Active"},
];

const ITEMS = [
    {id: "ITM-001", name: "Warm Yellow LED", uom: "pcs", price: 0.12},
    {id: "ITM-002", name: "Large Widget", uom: "pcs", price: 9.5},
    {id: "ITM-003", name: "Plastic Case", uom: "pcs", price: 1.2},
    {id: "ITM-004", name: "Lion Bracket", uom: "pcs", price: 2.1},
    {id: "ITM-005", name: "Chain Bracket", uom: "pcs", price: 1.85},
    {id: "ITM-007", name: "Steel Frame", uom: "pcs", price: 7.2},
    {id: "ITM-008", name: "Blue Paint (RAL5010)", uom: "L", price: 14.0},
    {id: "ITM-009", name: "Screws M3x8", uom: "ea", price: 0.03},
];

const nextPO = (() => {
    let n = 5004; // pretend last was PO-5003
    return () => `PO-${String(n++).padStart(4, "0")}`;
})();

const uid = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : String(Math.random()).slice(2);

// Empty line template
const emptyLine = () => ({
    key: uid(),
    itemId: "",
    desc: "",
    uom: "",
    qty: "",
    price: "",
    taxPct: "0",
    discountPct: "0",
    notes: "",
});

export default function PODetailsPage() {
    const navigate = useNavigate();

    // ---------- Form state ----------
    const [poId, setPoId] = useState(nextPO());
    const [supplierId, setSupplierId] = useState("");
    const [buyer, setBuyer] = useState("K. Adams");
    const [currency, setCurrency] = useState("€");
    const [orderDate, setOrderDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        return d.toISOString().slice(0, 10);
    });
    const [status, setStatus] = useState("Draft");
    const [notes, setNotes] = useState("");

    const [shipTo, setShipTo] = useState("Main WH\nIndustrial Park 1\n75000 City");
    const [billTo, setBillTo] = useState("Craftify GmbH\nFinance Dept\n75000 City");

    const [lines, setLines] = useState([emptyLine()]);
    const [otherCharges, setOtherCharges] = useState("0"); // shipping/handling

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
        }, 800);
    };

    useEffect(() => {
        requestSave();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [poId, supplierId, buyer, currency, orderDate, dueDate, status, notes, shipTo, billTo, lines, otherCharges]);

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

    // ---------- Derived ----------
    const supplier = useMemo(
        () => SUPPLIERS.find((s) => s.id === supplierId) || null,
        [supplierId]
    );

    const validLines = useMemo(
        () =>
            lines.filter((l) => l.itemId && Number(l.qty) > 0 && Number(l.price) >= 0),
        [lines]
    );

    const totals = useMemo(() => {
        let sub = 0;
        let tax = 0;
        validLines.forEach((l) => {
            const qty = Number(l.qty || 0);
            const price = Number(l.price || 0);
            const disc = Number(l.discountPct || 0) / 100;
            const lineSub = qty * price * (1 - disc);
            const lineTax = lineSub * (Number(l.taxPct || 0) / 100);
            sub += lineSub;
            tax += lineTax;
        });
        const other = Number(otherCharges || 0);
        const grand = sub + tax + other;
        return {sub, tax, other, grand};
    }, [validLines, otherCharges]);

    // ---------- Validation ----------
    const errors = useMemo(() => {
        const list = [];
        if (!supplierId) list.push("Supplier is required.");
        if (!poId) list.push("PO ID is required.");
        if (new Date(dueDate) < new Date(orderDate)) list.push("Due Date cannot be before Order Date.");
        if (validLines.length === 0) list.push("Add at least one valid line (item, qty > 0, price ≥ 0).");
        return list;
    }, [supplierId, poId, orderDate, dueDate, validLines]);

    // ---------- Line operations ----------
    const tableRef = useRef(null);
    const addLine = () => setLines((ls) => [...ls, emptyLine()]);
    const removeLine = (key) => setLines((ls) => ls.filter((l) => l.key !== key));
    const cloneLine = (key) =>
        setLines((ls) => {
            const idx = ls.findIndex((l) => l.key === key);
            if (idx === -1) return ls;
            const n = {...ls[idx], key: uid()};
            return [...ls.slice(0, idx + 1), n, ...ls.slice(idx + 1)];
        });
    const updateLine = (key, patch) =>
        setLines((ls) => ls.map((l) => (l.key === key ? {...l, ...patch} : l)));

    // keyboard shortcuts on table (Enter add, Ctrl/⌘+D clone focused, Delete remove)
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Enter" && e.target && e.target.tagName === "INPUT") {
                if (e.metaKey || e.ctrlKey) {
                    const key = e.target.getAttribute("data-rowkey");
                    if (key) cloneLine(key);
                } else if (!e.shiftKey) {
                    addLine();
                }
            }
            if (e.key === "Delete") {
                const key = e.target && e.target.getAttribute("data-rowkey");
                if (key) removeLine(key);
            }
        };
        const el = tableRef.current;
        el && el.addEventListener("keydown", handler);
        return () => el && el.removeEventListener("keydown", handler);
    }, []);

    // ---------- Actions (mock) ----------
    const handleSaveDraft = () => {
        setLastSavedAt(new Date());
        setDirty(false);
        alert("PO draft saved (mock).");
    };

    const handleSubmitForApproval = () => {
        if (errors.length) {
            alert("Please resolve errors before submitting.");
            return;
        }
        setStatus("Pending Approval");
        alert("Submitted for approval (mock).");
    };

    const handleCancel = () => {
        if (dirty && !window.confirm("Discard unsaved changes?")) return;
        navigate("/purchasing");
    };

    // ---------- Item search helper ----------
    const [itemQuery, setItemQuery] = useState("");
    const filteredItems = useMemo(() => {
        const q = itemQuery.trim().toLowerCase();
        if (!q) return ITEMS;
        return ITEMS.filter((i) => i.id.toLowerCase().includes(q) || i.name.toLowerCase().includes(q));
    }, [itemQuery]);

    // ---------- Render ----------
    return (
        <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">New Purchase Order</h1>
                        <p className="mt-2 text-gray-400">Create a PO — start in Draft and submit for approval when
                            ready.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveDraft}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                        >
                            Save Draft
                        </button>
                        <button
                            onClick={handleSubmitForApproval}
                            disabled={errors.length > 0 || status !== "Draft"}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-40"
                        >
                            Submit for Approval
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
            PO ID: <span className="font-mono text-gray-300">{poId}</span>
          </span>
                </div>
            </header>

            {/* Content */}
            <section className="mx-auto px-4 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">General</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">PO ID</label>
                                <input
                                    value={poId}
                                    onChange={(e) => setPoId(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Supplier</label>
                                <select
                                    value={supplierId}
                                    onChange={(e) => {
                                        const s = e.target.value;
                                        setSupplierId(s);
                                        const sup = SUPPLIERS.find((x) => x.id === s);
                                        if (sup) setCurrency(sup.currency || "€");
                                    }}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                >
                                    <option value="">— Select supplier —</option>
                                    {SUPPLIERS.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.id} — {s.name}
                                        </option>
                                    ))}
                                </select>
                                {supplier && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Terms: {supplier.terms} • Status: {supplier.status}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Buyer</label>
                                <input
                                    value={buyer}
                                    onChange={(e) => setBuyer(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Currency</label>
                                <input
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Order Date</label>
                                <input
                                    type="date"
                                    value={orderDate}
                                    onChange={(e) => setOrderDate(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    placeholder="Optional note for the supplier."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ship / Bill */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">Ship / Bill</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Ship To</label>
                                <textarea
                                    value={shipTo}
                                    onChange={(e) => setShipTo(e.target.value)}
                                    rows={4}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Bill To</label>
                                <textarea
                                    value={billTo}
                                    onChange={(e) => setBillTo(e.target.value)}
                                    rows={4}
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
                                <input
                                    placeholder="Search items…"
                                    value={itemQuery}
                                    onChange={(e) => setItemQuery(e.target.value)}
                                    className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
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
                                    <th className="px-4 py-3 text-left">Desc</th>
                                    <th className="px-4 py-3 text-left">UoM</th>
                                    <th className="px-4 py-3 text-left">Qty</th>
                                    <th className="px-4 py-3 text-left">Price</th>
                                    <th className="px-4 py-3 text-left">Tax %</th>
                                    <th className="px-4 py-3 text-left">Disc %</th>
                                    <th className="px-4 py-3 text-left">Notes</th>
                                    <th className="px-4 py-3 text-right">Line Total</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {lines.map((l) => {
                                    const item = ITEMS.find((i) => i.id === l.itemId);
                                    const qty = Number(l.qty || 0);
                                    const price = Number(l.price || 0);
                                    const disc = Number(l.discountPct || 0) / 100;
                                    const lineSub = qty * price * (1 - disc);
                                    const lineTax = lineSub * (Number(l.taxPct || 0) / 100);
                                    const lineTotal = lineSub + lineTax;

                                    const rowErrors = {
                                        itemId: !l.itemId,
                                        qty: !l.qty || qty <= 0,
                                        price: l.price === "" || price < 0,
                                    };

                                    return (
                                        <tr key={l.key} className="hover:bg-gray-800/40 transition">
                                            <td className="px-4 py-3 align-top">
                                                <select
                                                    data-rowkey={l.key}
                                                    value={l.itemId}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        const it = ITEMS.find((x) => x.id === val);
                                                        updateLine(l.key, {
                                                            itemId: val,
                                                            uom: it ? it.uom : l.uom,
                                                            desc: it ? it.name : l.desc,
                                                            price: it ? it.price : l.price,
                                                        });
                                                    }}
                                                    className={`w-52 rounded-lg bg-gray-800 border ${
                                                        rowErrors.itemId ? "border-red-500/60" : "border-white/10"
                                                    } px-3 py-2 text-sm`}
                                                >
                                                    <option value="">— Select item —</option>
                                                    {filteredItems.map((i) => (
                                                        <option key={i.id} value={i.id}>
                                                            {i.id} — {i.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {item && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Default UoM: {item.uom} • Guide Price: {currency}
                                                        {item.price.toFixed(2)}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={l.key}
                                                    value={l.desc}
                                                    onChange={(e) => updateLine(l.key, {desc: e.target.value})}
                                                    placeholder="Description"
                                                    className="w-64 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={l.key}
                                                    value={l.uom}
                                                    onChange={(e) => updateLine(l.key, {uom: e.target.value})}
                                                    placeholder={item ? item.uom : "pcs"}
                                                    className="w-24 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={l.key}
                                                    inputMode="decimal"
                                                    value={l.qty}
                                                    onChange={(e) => updateLine(l.key, {qty: e.target.value})}
                                                    placeholder="0"
                                                    className={`w-24 rounded-lg bg-gray-800 border ${
                                                        rowErrors.qty ? "border-red-500/60" : "border-white/10"
                                                    } px-3 py-2 text-sm`}
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={l.key}
                                                    inputMode="decimal"
                                                    value={l.price}
                                                    onChange={(e) => updateLine(l.key, {price: e.target.value})}
                                                    placeholder="0.00"
                                                    className={`w-28 rounded-lg bg-gray-800 border ${
                                                        rowErrors.price ? "border-red-500/60" : "border-white/10"
                                                    } px-3 py-2 text-sm`}
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={l.key}
                                                    inputMode="decimal"
                                                    value={l.taxPct}
                                                    onChange={(e) => updateLine(l.key, {taxPct: e.target.value})}
                                                    placeholder="0"
                                                    className="w-24 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={l.key}
                                                    inputMode="decimal"
                                                    value={l.discountPct}
                                                    onChange={(e) => updateLine(l.key, {discountPct: e.target.value})}
                                                    placeholder="0"
                                                    className="w-24 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={l.key}
                                                    value={l.notes}
                                                    onChange={(e) => updateLine(l.key, {notes: e.target.value})}
                                                    placeholder="Optional"
                                                    className="w-56 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top text-right font-medium text-gray-200">
                                                {currency}
                                                {lineTotal.toFixed(2)}
                                            </td>

                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        onClick={() => cloneLine(l.key)}
                                                        title="Clone line"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition bg-gray-800/60 border-white/10 text-gray-200 hover:bg-gray-700/60"
                                                    >
                                                        ⎘ Clone
                                                    </button>
                                                    <button
                                                        onClick={() => removeLine(l.key)}
                                                        title="Remove line"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20"
                                                    >
                                                        ✕ Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer under table */}
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div className="text-xs text-gray-500">
                                Shortcuts: <span className="text-gray-300">Enter</span> add line •{" "}
                                <span className="text-gray-300">Ctrl/⌘+D</span> duplicate focused line •{" "}
                                <span className="text-gray-300">Delete</span> remove focused line
                            </div>
                            <div className="flex items-center gap-2 sm:justify-end">
                                <label className="text-gray-400">Other charges</label>
                                <input
                                    inputMode="decimal"
                                    value={otherCharges}
                                    onChange={(e) => setOtherCharges(e.target.value)}
                                    className="w-32 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Attachments (placeholder) */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-1">Attachments</h2>
                        <div className="text-sm text-gray-400">Upload supplier quotes or drawings here in the future.
                            (Placeholder)
                        </div>
                    </div>

                    {/* Error summary */}
                    {errors.length > 0 && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
                            <div className="font-semibold text-red-300 mb-1">Please fix the following before submit:
                            </div>
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
                                <div className="text-xs text-gray-400">Supplier</div>
                                <div className="text-sm text-gray-200 min-h-[20px]">
                                    {supplier ? `${supplier.id} — ${supplier.name}` :
                                        <span className="text-gray-500">(not set)</span>}
                                </div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Valid lines</div>
                                <div className="text-lg font-semibold text-gray-100">{validLines.length}</div>
                            </div>

                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <div className="text-xs text-gray-400">Subtotal</div>
                                        <div className="text-lg font-semibold text-gray-100">
                                            {currency}
                                            {totals.sub.toFixed(2)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400">Tax</div>
                                        <div className="text-lg font-semibold text-gray-100">
                                            {currency}
                                            {totals.tax.toFixed(2)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400">Other</div>
                                        <div className="text-lg font-semibold text-gray-100">
                                            {currency}
                                            {totals.other.toFixed(2)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400">Grand Total</div>
                                        <div className="text-lg font-semibold text-gray-100">
                                            {currency}
                                            {totals.grand.toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="rounded-2xl bg-gray-900/60 p-4 text-xs text-gray-400 border border-white/10">
                                <div className="font-semibold text-gray-300 mb-2">Status</div>
                                <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                        status === "Draft"
                                            ? "bg-blue-600/30 text-blue-300"
                                            : status === "Pending Approval"
                                                ? "bg-yellow-600/30 text-yellow-400"
                                                : "bg-green-600/30 text-green-400"
                                    }`}
                                >
                  {status}
                </span>
                            </div>

                            <div
                                className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 text-xs text-gray-400">
                                <div className="font-semibold text-gray-300 mb-2">Tips</div>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Start in Draft; submit for approval when validated.</li>
                                    <li>Use the item search above the table to filter the picker.</li>
                                    <li>Clone lines with Ctrl/⌘+D, add with Enter, remove with Delete.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </aside>
            </section>
        </div>
    );
}

export {PODetailsPage};
