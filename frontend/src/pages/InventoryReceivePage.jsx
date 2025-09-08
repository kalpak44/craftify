import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";

/**
 * InventoryReceivePage — React + Tailwind (plain JS)
 * Aligned with Inventory/Adjust/Work Orders styling.
 * - Receive against PO or Without PO
 * - Mock POs & Items
 * - Scan input (mock) to add/increment lines
 * - Client validation, autosave, sticky summary
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

const LOCATIONS = ["Main WH", "Chem Store", "Yard", "Electronics"];
const BINS = {
    "Main WH": ["A1", "B4", "C2", "D1", "D3", "H8", "KIT-1", "RECV"],
    "Chem Store": ["PA-1", "PA-2", "RECV-CH"],
    Yard: ["ST-IN", "ST-OUT"],
    Electronics: ["E1", "E2", "RECV-EL"],
};

// Mock POs with remaining quantities
const POS = [
    {
        id: "PO-5001",
        supplier: "Acme Components",
        expectedDate: "2025-02-22",
        lines: [
            {itemId: "ITM-009", desc: "Screws M3×8", uom: "ea", ordered: 3000, received: 1800},
            {itemId: "ITM-005", desc: "Chain Bracket", uom: "pcs", ordered: 1000, received: 200},
        ],
    },
    {
        id: "PO-5002",
        supplier: "NordFab Metals",
        expectedDate: "2025-02-25",
        lines: [
            {itemId: "ITM-003", desc: "Plastic Case", uom: "pcs", ordered: 800, received: 0},
            {itemId: "ITM-004", desc: "Lion Bracket", uom: "pcs", ordered: 350, received: 150},
        ],
    },
];

const nextDocId = (() => {
    let n = 7001;
    return () => `RCV-${String(n++)}`;
})();

const newLine = () => ({
    key: crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
    itemId: "",
    uom: "",
    location: "",
    bin: "",
    lot: "",
    qtyReceived: "",
    qtyRejected: "",
    reason: "",
    notes: "",
    // For PO context:
    expected: null,
    remaining: null,
});

export default function InventoryReceivePage() {
    const navigate = useNavigate();

    // ---- Header / doc ----
    const [docId, setDocId] = useState(nextDocId());
    const [docDate, setDocDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [receiptType, setReceiptType] = useState("PO"); // "PO" | "Direct"
    const [poId, setPoId] = useState("");
    const [supplier, setSupplier] = useState("");
    const [blindReceive, setBlindReceive] = useState(false);
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
    }, [docId, docDate, receiptType, poId, supplier, blindReceive, reference, headerNotes, lines]);

    // ---- Unsaved guard ----
    useEffect(() => {
        const onBeforeUnload = (e) => {
            if (dirty) {
                e.preventDefault();
                e.returnValue = "";
                return "";
            }
        };
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [dirty]);

    // ---- PO handling ----
    useEffect(() => {
        if (receiptType !== "PO") return;
        const po = POS.find((p) => p.id === poId);
        if (!po) {
            setSupplier("");
            setLines((ls) => (ls.length ? ls : [newLine()]));
            return;
        }
        setSupplier(po.supplier);
        // Prefill from remaining quantities
        const prefilled = po.lines
            .map((l) => {
                const remaining = Math.max(0, (l.ordered || 0) - (l.received || 0));
                if (!remaining) return null;
                const item = ITEMS.find((i) => i.id === l.itemId);
                return {
                    ...newLine(),
                    itemId: l.itemId,
                    uom: item?.uom || l.uom,
                    location: "Main WH",
                    bin: "RECV",
                    expected: l.ordered,
                    remaining,
                    qtyReceived: "",
                    qtyRejected: "",
                    reason: "",
                };
            })
            .filter(Boolean);
        setLines(prefilled.length ? prefilled : [newLine()]);
    }, [receiptType, poId]);

    // ---- Helpers ----
    const findItem = (id) => ITEMS.find((i) => i.id === id);

    // Scan field: if matches itemId, add/increment a line by 1
    const handleScan = (code) => {
        const item = ITEMS.find((i) => i.id === code.trim());
        if (!item) return;
        setLines((rs) => {
            const i = rs.findIndex((r) => r.itemId === item.id && r.location && r.bin);
            if (i >= 0) {
                const cur = Number(rs[i].qtyReceived || 0);
                const next = [...rs];
                next[i] = {...rs[i], qtyReceived: cur + 1, uom: rs[i].uom || item.uom};
                return next;
            }
            const l = newLine();
            l.itemId = item.id;
            l.uom = item.uom;
            l.location = "Main WH";
            l.bin = "RECV";
            l.qtyReceived = 1;
            return [l, ...rs];
        });
    };

    // Lines ops
    const addLine = () => setLines((rs) => [...rs, newLine()]);
    const removeLine = (key) => setLines((rs) => rs.filter((r) => r.key !== key));
    const cloneLine = (key) =>
        setLines((rs) => {
            const i = rs.findIndex((r) => r.key === key);
            if (i === -1) return rs;
            const nl = {...rs[i], key: crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)};
            return [...rs.slice(0, i + 1), nl, ...rs.slice(i + 1)];
        });
    const updateLine = (key, patch) => setLines((rs) => rs.map((r) => (r.key === key ? {...r, ...patch} : r)));

    // Keyboard shortcuts
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

    // ---- Validation ----
    const errors = useMemo(() => {
        const list = [];
        if (!docId) list.push("Document ID is required.");
        if (!docDate) list.push("Date is required.");

        if (receiptType === "PO" && !poId) list.push("Select a PO to receive against.");
        if (receiptType === "Direct" && !supplier) list.push("Supplier is required for direct receipts.");

        const active = lines.filter(
            (l) => l.itemId || l.location || l.bin || l.lot || l.qtyReceived || l.qtyRejected || l.notes
        );
        if (active.length === 0) list.push("Add at least one line.");

        active.forEach((l, idx) => {
            const tag = `Line ${idx + 1}`;
            if (!l.itemId) list.push(`${tag}: Item is required.`);
            if (!l.uom) list.push(`${tag}: UoM is required.`);
            if (!l.location) list.push(`${tag}: Location is required.`);
            if (!l.bin) list.push(`${tag}: Bin is required.`);
            const qr = Number(l.qtyReceived || 0);
            const qx = Number(l.qtyRejected || 0);
            if (qr <= 0 && qx <= 0) list.push(`${tag}: Enter received and/or rejected qty.`);
            if (receiptType === "PO" && !blindReceive && l.remaining != null && qr > l.remaining)
                list.push(`${tag}: Received exceeds remaining (${l.remaining}).`);
        });

        return list;
    }, [docId, docDate, receiptType, poId, supplier, lines, blindReceive]);

    // ---- Derived totals ----
    const totals = useMemo(
        () =>
            lines.reduce(
                (a, l) => {
                    a.received += Number(l.qtyReceived || 0) || 0;
                    a.rejected += Number(l.qtyRejected || 0) || 0;
                    return a;
                },
                {received: 0, rejected: 0}
            ),
        [lines]
    );

    const issueCount = errors.length;
    const totalLines = lines.filter((l) => (Number(l.qtyReceived) || Number(l.qtyRejected))).length;

    // ---- Actions (mock) ----
    const saveDraft = () => {
        setLastSavedAt(new Date());
        setDirty(false);
        alert("Receipt draft saved (mock).");
    };
    const postReceipt = () => {
        if (errors.length) {
            alert("Please resolve validation errors before posting.");
            return;
        }
        alert("Receipt posted (mock). Inventory and PO would be updated.");
        navigate("/inventory");
    };
    const cancel = () => {
        if (dirty && !window.confirm("Discard unsaved changes?")) return;
        navigate("/inventory");
    };

    return (
        <div
            className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Receive Inventory</h1>
                        <p className="mt-2 text-gray-400">Record incoming goods with optional PO matching and quality
                            disposition.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={saveDraft}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">
                            Save Draft
                        </button>
                        <button
                            onClick={postReceipt}
                            disabled={errors.length > 0}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-40"
                        >
                            Post Receipt
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
            Doc ID: <span className="font-mono text-gray-300">{docId}</span>
          </span>
                </div>
            </header>

            {/* Content */}
            <section className="mx-auto px-4 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Receipt details */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">Details</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Receipt Type</label>
                                <select
                                    value={receiptType}
                                    onChange={(e) => {
                                        setReceiptType(e.target.value);
                                        setPoId("");
                                        setSupplier("");
                                        setLines([newLine()]);
                                    }}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                >
                                    <option value="PO">Against PO</option>
                                    <option value="Direct">Without PO</option>
                                </select>
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

                            {receiptType === "PO" ? (
                                <>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Purchase Order</label>
                                        <select
                                            value={poId}
                                            onChange={(e) => setPoId(e.target.value)}
                                            className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                        >
                                            <option value="">— Select PO —</option>
                                            {POS.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.id} — {p.supplier}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Supplier</label>
                                        <input value={supplier} disabled
                                               className="w-full rounded-lg bg-gray-800/60 border border-white/10 px-3 py-2 text-sm"/>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Supplier</label>
                                        <input
                                            value={supplier}
                                            onChange={(e) => setSupplier(e.target.value)}
                                            placeholder="e.g. Vendor Ltd."
                                            className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Reference</label>
                                        <input
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                            placeholder="e.g. Packing slip"
                                            className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="sm:col-span-2">
                                <div className="flex items-center gap-3">
                                    <label className="inline-flex items-center gap-2 text-xs text-gray-300">
                                        <input type="checkbox" checked={blindReceive}
                                               onChange={(e) => setBlindReceive(e.target.checked)}/>
                                        Blind receiving (hide expected/remaining)
                                    </label>
                                    <span className="text-xs text-gray-500">Doc ID <span
                                        className="font-mono text-gray-300">{docId}</span></span>
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                                <textarea
                                    rows={3}
                                    value={headerNotes}
                                    onChange={(e) => setHeaderNotes(e.target.value)}
                                    placeholder="Add receiving notes (damages, carrier, who received, etc.)"
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Scan & lines */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-white">Lines</h2>
                            <div className="flex items-center gap-2 text-sm">
                                <input
                                    placeholder="Scan item ID… (e.g. ITM-009)"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleScan(e.currentTarget.value);
                                            e.currentTarget.value = "";
                                        }
                                    }}
                                    className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm w-56"
                                />
                                <button onClick={addLine}
                                        className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700">
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
                                    {!blindReceive && <th className="px-4 py-3 text-right">Expected</th>}
                                    {!blindReceive && <th className="px-4 py-3 text-right">Remaining</th>}
                                    <th className="px-4 py-3 text-left">Location</th>
                                    <th className="px-4 py-3 text-left">Bin</th>
                                    <th className="px-4 py-3 text-left">Lot/Serial</th>
                                    <th className="px-4 py-3 text-right">Qty Received</th>
                                    <th className="px-4 py-3 text-right">Qty Rejected</th>
                                    <th className="px-4 py-3 text-left">Reason</th>
                                    <th className="px-4 py-3 text-left">Notes</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {lines.map((l) => {
                                    const item = findItem(l.itemId);
                                    return (
                                        <tr key={l.key} className="hover:bg-gray-800/40 transition">
                                            {/* Item */}
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    list="items"
                                                    value={l.itemId}
                                                    data-rowkey={l.key}
                                                    onChange={(e) =>
                                                        updateLine(l.key, {
                                                            itemId: e.target.value,
                                                            uom: findItem(e.target.value)?.uom || l.uom
                                                        })
                                                    }
                                                    placeholder="e.g. ITM-003"
                                                    className={`w-44 rounded-lg bg-gray-800 border ${!l.itemId ? "border-red-500/60" : "border-white/10"} px-3 py-2 text-sm`}
                                                />
                                                <datalist id="items">
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
                                                    className={`w-20 rounded-lg bg-gray-800 border ${!l.uom ? "border-red-500/60" : "border-white/10"} px-3 py-2 text-sm`}
                                                />
                                            </td>

                                            {/* Expected/Remaining */}
                                            {!blindReceive && (
                                                <td className="px-4 py-3 align-top text-right text-gray-300">
                                                    {l.expected != null ? l.expected : "—"}
                                                </td>
                                            )}
                                            {!blindReceive && (
                                                <td className="px-4 py-3 align-top text-right text-gray-300">
                                                    {l.remaining != null ? l.remaining : "—"}
                                                </td>
                                            )}

                                            {/* Location / Bin / Lot */}
                                            <td className="px-4 py-3 align-top">
                                                <select
                                                    data-rowkey={l.key}
                                                    value={l.location}
                                                    onChange={(e) => updateLine(l.key, {
                                                        location: e.target.value,
                                                        bin: ""
                                                    })}
                                                    className={`w-36 rounded-lg bg-gray-800 border ${!l.location ? "border-red-500/60" : "border-white/10"} px-3 py-2 text-sm`}
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
                                                    className={`w-28 rounded-lg bg-gray-800 border ${!l.bin ? "border-red-500/60" : "border-white/10"} px-3 py-2 text-sm`}
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

                                            {/* Quantities */}
                                            <td className="px-4 py-3 align-top text-right">
                                                <input
                                                    data-rowkey={l.key}
                                                    inputMode="decimal"
                                                    value={l.qtyReceived}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        // update remaining if PO
                                                        if (l.remaining != null && !blindReceive) {
                                                            const rem = Math.max(0, Number(l.expected || 0) - (Number(v || 0) + Number(l.qtyRejected || 0)));
                                                            updateLine(l.key, {qtyReceived: v, remaining: rem});
                                                        } else {
                                                            updateLine(l.key, {qtyReceived: v});
                                                        }
                                                    }}
                                                    placeholder="0"
                                                    className={`w-24 text-right rounded-lg bg-gray-800 border ${Number(l.qtyReceived || 0) <= 0 && Number(l.qtyRejected || 0) <= 0 ? "border-red-500/60" : "border-white/10"} px-3 py-2 text-sm`}
                                                />
                                            </td>
                                            <td className="px-4 py-3 align-top text-right">
                                                <input
                                                    data-rowkey={l.key}
                                                    inputMode="decimal"
                                                    value={l.qtyRejected}
                                                    onChange={(e) => {
                                                        const v = e.target.value;
                                                        if (l.remaining != null && !blindReceive) {
                                                            const rem = Math.max(0, Number(l.expected || 0) - (Number(l.qtyReceived || 0) + Number(v || 0)));
                                                            updateLine(l.key, {qtyRejected: v, remaining: rem});
                                                        } else {
                                                            updateLine(l.key, {qtyRejected: v});
                                                        }
                                                    }}
                                                    placeholder="0"
                                                    className="w-24 text-right rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </td>

                                            {/* Reason / Notes */}
                                            <td className="px-4 py-3 align-top">
                                                <select
                                                    data-rowkey={l.key}
                                                    value={l.reason}
                                                    onChange={(e) => updateLine(l.key, {reason: e.target.value})}
                                                    className="w-36 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                >
                                                    <option value="">— Reason —</option>
                                                    <option>OK</option>
                                                    <option>Damaged</option>
                                                    <option>Wrong Item</option>
                                                    <option>Overage</option>
                                                    <option>Other</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={l.key}
                                                    value={l.notes}
                                                    onChange={(e) => updateLine(l.key, {notes: e.target.value})}
                                                    placeholder="Optional"
                                                    className="w-48 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
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
                                Shortcuts: <span className="text-gray-300">Enter</span> add • <span
                                className="text-gray-300">Ctrl/⌘+D</span> clone •{" "}
                                <span className="text-gray-300">Delete</span> remove
                            </div>
                            <div className="flex items-center gap-3">
                <span>
                  Lines: <span className="text-gray-300">{totalLines}</span>
                </span>
                                <span>
                  Received: <span className="text-green-300">{totals.received}</span>
                </span>
                                <span>
                  Rejected: <span className="text-red-300">{totals.rejected}</span>
                </span>
                            </div>
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

                {/* Right: sticky summary */}
                <aside className="lg:sticky lg:top-6 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h3 className="text-base font-semibold text-white">Summary</h3>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Lines</div>
                                <div className="text-lg font-semibold text-gray-100">{totalLines}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Supplier</div>
                                <div className="text-sm text-gray-200 truncate">{supplier || "—"}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Received</div>
                                <div className="text-lg font-semibold text-green-300">{totals.received}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Rejected</div>
                                <div className="text-lg font-semibold text-red-300">{totals.rejected}</div>
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
                            <li>Use the scan box to quickly increment items by 1 (mock).</li>
                            <li>Toggle “Blind receiving” to hide PO expectations.</li>
                            <li>Rejected quantities do not increase stock.</li>
                            <li>Choose a receiving bin (e.g., <span className="text-gray-300">RECV</span>) and move
                                later.
                            </li>
                        </ul>
                    </div>
                </aside>
            </section>
        </div>
    );
}

export {InventoryReceivePage};
