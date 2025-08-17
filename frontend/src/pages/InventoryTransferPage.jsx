import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";

/**
 * InventoryTransferPage — React + Tailwind (plain JS)
 * - Consistent with Items/BOMs/WO Create
 * - Mock item/location/bin/lot availability
 * - Multiple lines, keyboard shortcuts, validation
 * - Fake autosave + unsaved-changes guard
 */

const MOCK_ITEMS = [
    {id:"ITM-001", name:"Warm Yellow LED", uom:"pcs"},
    {id:"ITM-002", name:"Large Widget", uom:"pcs"},
    {id:"ITM-003", name:"Plastic Case", uom:"pcs"},
    {id:"ITM-004", name:"Lion Bracket", uom:"pcs"},
    {id:"ITM-005", name:"Chain Bracket", uom:"pcs"},
    {id:"ITM-006", name:"Front Assembly", uom:"ea"},
    {id:"ITM-007", name:"Steel Frame", uom:"pcs"},
    {id:"ITM-008", name:"Blue Paint (RAL5010)", uom:"L"},
    {id:"ITM-009", name:"Screws M3×8", uom:"ea"},
    {id:"ITM-010", name:"Assembly Kit 10", uom:"kit"},
];

// availability per (itemId, location, bin, lot) — mock
const STOCK = [
    {itemId:"ITM-006", location:"Main WH", bin:"A1", lot:"",        onHand:208},
    {itemId:"ITM-002", location:"Main WH", bin:"B4", lot:"LW-2502", onHand:310},
    {itemId:"ITM-003", location:"Main WH", bin:"C2", lot:"",        onHand:1350},
    {itemId:"ITM-005", location:"Main WH", bin:"D1", lot:"CB-0101", onHand:1320},
    {itemId:"ITM-004", location:"Main WH", bin:"D3", lot:"",        onHand:350},
    {itemId:"ITM-008", location:"Chem Store", bin:"PA-1", lot:"P-2025-02", onHand:12},
    {itemId:"ITM-009", location:"Main WH", bin:"H8", lot:"",        onHand:1500},
    {itemId:"ITM-007", location:"Yard", bin:"ST-OUT", lot:"",       onHand:90},
    {itemId:"ITM-001", location:"Electronics", bin:"E1", lot:"LED-01", onHand:5000},
];

const LOCATIONS = ["Main WH","Chem Store","Yard","Electronics"];
const BINS = {
    "Main WH":["A1","B4","C2","D1","D3","H8","KIT-1"],
    "Chem Store":["PA-1","PA-2"],
    "Yard":["ST-OUT","ST-IN"],
    "Electronics":["E1","E2"]
};

const nextDocId = (() => {
    let n = 2001;
    return () => `XFER-${String(n++)}`;
})();

const newLine = () => ({
    key: crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
    itemId: "",
    uom: "",
    fromLoc: "",
    fromBin: "",
    fromLot: "",
    toLoc: "",
    toBin: "",
    qty: "",
    notes: "",
});

export default function InventoryTransferPage() {
    const navigate = useNavigate();

    // Header/transfer meta
    const [docId, setDocId] = useState(nextDocId());
    const [reason, setReason] = useState("Replenishment");
    const [docDate, setDocDate] = useState(() => new Date().toISOString().slice(0,10));
    const [reference, setReference] = useState("");
    const [headerNotes, setHeaderNotes] = useState("");

    // Lines
    const [lines, setLines] = useState([newLine()]);

    // Fake autosave
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
    }, [docId, reason, docDate, reference, headerNotes, lines]);

    // Unsaved-changes guard
    useEffect(() => {
        const beforeUnload = (e) => {
            if (dirty) { e.preventDefault(); e.returnValue = ""; return ""; }
        };
        window.addEventListener("beforeunload", beforeUnload);
        return () => window.removeEventListener("beforeunload", beforeUnload);
    }, [dirty]);

    // Helpers
    const findItem = (id) => MOCK_ITEMS.find(i => i.id === id);
    const stockKey = (l) => `${l.itemId}|${l.fromLoc}|${l.fromBin}|${l.fromLot||"-"}`;
    const onHandFor = (l) => {
        if (!l.itemId || !l.fromLoc || !l.fromBin) return 0;
        const s = STOCK.find(s =>
            s.itemId===l.itemId && s.location===l.fromLoc && s.bin===l.fromBin && (s.lot||"") === (l.fromLot||"")
        );
        return s?.onHand || 0;
    };

    // Validation
    const errors = useMemo(() => {
        const list = [];
        if (!docId) list.push("Document ID is required.");
        if (!docDate) list.push("Document date is required.");
        const nonEmpty = lines.filter(l =>
            l.itemId || l.fromLoc || l.fromBin || l.toLoc || l.toBin || l.qty || l.notes || l.fromLot
        );
        if (nonEmpty.length === 0) list.push("Add at least one transfer line.");
        nonEmpty.forEach((l, idx) => {
            const label = `Line ${idx+1}`;
            if (!l.itemId) list.push(`${label}: Item is required.`);
            if (!l.uom) list.push(`${label}: UoM is required.`);
            if (!l.fromLoc) list.push(`${label}: From location is required.`);
            if (!l.fromBin) list.push(`${label}: From bin is required.`);
            if (!l.toLoc) list.push(`${label}: To location is required.`);
            if (!l.toBin) list.push(`${label}: To bin is required.`);
            if (l.fromLoc && l.toLoc && l.fromLoc === l.toLoc && l.fromBin && l.toBin && l.fromBin === l.toBin)
                list.push(`${label}: From and To cannot be the same bin.`);
            const q = Number(l.qty || 0);
            if (!q || q <= 0) list.push(`${label}: Quantity must be > 0.`);
            const oh = onHandFor(l);
            if (q > oh) list.push(`${label}: Quantity (${q}) exceeds available (${oh}).`);
        });
        return list;
    }, [lines, docId, docDate]);

    // Totals
    const totalLines = lines.filter(l => l.itemId && Number(l.qty) > 0 && l.fromLoc && l.toLoc).length;
    const totalQty = lines.reduce((s,l)=>s + (Number(l.qty||0)||0), 0);

    // Line ops
    const addLine = () => setLines(rs => [...rs, newLine()]);
    const removeLine = (key) => setLines(rs => rs.filter(r => r.key !== key));
    const cloneLine = (key) => setLines(rs => {
        const i = rs.findIndex(r => r.key === key);
        if (i === -1) return rs;
        const nr = {...rs[i], key: crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)};
        return [...rs.slice(0, i+1), nr, ...rs.slice(i+1)];
    });
    const updateLine = (key, patch) => setLines(rs => rs.map(r => r.key === key ? {...r, ...patch} : r));

    // keyboard shortcuts
    const tableRef = useRef(null);
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Enter" && e.target?.dataset?.rowkey) {
                if (e.metaKey || e.ctrlKey) cloneLine(e.target.dataset.rowkey);
                else if (!e.shiftKey) addLine();
            }
            if (e.key === "Delete" && e.target?.dataset?.rowkey) removeLine(e.target.dataset.rowkey);
        };
        const el = tableRef.current;
        el && el.addEventListener("keydown", handler);
        return () => el && el.removeEventListener("keydown", handler);
    }, []);

    // Actions (mock)
    const saveDraft = () => { setLastSavedAt(new Date()); setDirty(false); alert("Transfer draft saved (mock)."); };
    const postTransfer = () => {
        if (errors.length) { alert("Fix errors before posting."); return; }
        alert("Transfer posted (mock). Stock would move and a journal entry would be created.");
        navigate("/inventory");
    };
    const cancel = () => {
        if (dirty && !window.confirm("Discard unsaved changes?")) return;
        navigate("/inventory");
    };

    // UI bits
    const badge = (text, cls) => <span className={`px-2 py-1 text-xs rounded-full ${cls}`}>{text}</span>;

    return (
        <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Inventory Transfer</h1>
                        <p className="mt-2 text-gray-400">Move stock between locations/bins with lot tracking.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={saveDraft}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">Save Draft</button>
                        <button onClick={postTransfer}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm" disabled={errors.length>0}>Post Transfer</button>
                        <button onClick={cancel}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">Cancel</button>
                    </div>
                </div>

                {/* Autosave banner */}
                <div className="mt-4 rounded-xl border border-white/10 bg-gray-900/60 px-4 py-3 text-sm flex items-center gap-3">
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
                {/* Left */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Details */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">Transfer Details</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Document ID</label>
                                <input value={docId} onChange={(e)=>setDocId(e.target.value)}
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Date</label>
                                <input type="date" value={docDate} onChange={(e)=>setDocDate(e.target.value)}
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Reason</label>
                                <select value={reason} onChange={(e)=>setReason(e.target.value)}
                                        className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm">
                                    <option>Replenishment</option>
                                    <option>Move to Staging</option>
                                    <option>Location Cleanup</option>
                                    <option>Quality Hold</option>
                                    <option>Cycle Count Adjustment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Reference</label>
                                <input value={reference} onChange={(e)=>setReference(e.target.value)} placeholder="e.g. WO-1002, PO-123"
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                                <textarea rows={3} value={headerNotes} onChange={(e)=>setHeaderNotes(e.target.value)}
                                          placeholder="Optional notes for this transfer"
                                          className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>
                        </div>
                    </div>

                    {/* Lines */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-white">Lines</h2>
                            <div className="flex items-center gap-2 text-sm">
                                <button onClick={addLine}
                                        className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700">+ Add Line</button>
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                            <table ref={tableRef} className="min-w-full divide-y divide-gray-800 text-sm">
                                <thead className="bg-gray-900/80">
                                <tr>
                                    <th className="px-4 py-3 text-left">Item</th>
                                    <th className="px-4 py-3 text-left">UoM</th>
                                    <th className="px-4 py-3 text-left">From Loc</th>
                                    <th className="px-4 py-3 text-left">From Bin</th>
                                    <th className="px-4 py-3 text-left">From Lot</th>
                                    <th className="px-4 py-3 text-left">To Loc</th>
                                    <th className="px-4 py-3 text-left">To Bin</th>
                                    <th className="px-4 py-3 text-left">Qty</th>
                                    <th className="px-4 py-3 text-left">Notes</th>
                                    <th className="px-4 py-3 text-right">Avail</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {lines.map((l) => {
                                    const it = findItem(l.itemId);
                                    const oh = onHandFor(l);
                                    const q = Number(l.qty || 0);
                                    const over = q > oh && q > 0;
                                    return (
                                        <tr key={l.key} className="hover:bg-gray-800/40 transition">
                                            {/* Item */}
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex flex-col gap-1">
                                                    <input
                                                        list="item-list"
                                                        value={l.itemId}
                                                        data-rowkey={l.key}
                                                        onChange={(e)=>updateLine(l.key, { itemId:e.target.value, uom: findItem(e.target.value)?.uom || l.uom })}
                                                        placeholder="e.g. ITM-005"
                                                        className={`w-44 rounded-lg bg-gray-800 border ${!l.itemId ? "border-red-500/60":"border-white/10"} px-3 py-2 text-sm`}
                                                    />
                                                    <datalist id="item-list">
                                                        {MOCK_ITEMS.map(i => <option key={i.id} value={i.id}>{`${i.id} — ${i.name}`}</option>)}
                                                    </datalist>
                                                    {it && <div className="text-xs text-gray-500 truncate">{it.name}</div>}
                                                </div>
                                            </td>

                                            {/* UoM */}
                                            <td className="px-4 py-3 align-top">
                                                <input data-rowkey={l.key}
                                                       value={l.uom}
                                                       onChange={(e)=>updateLine(l.key, {uom:e.target.value})}
                                                       placeholder={it ? it.uom : "pcs"}
                                                       className={`w-20 rounded-lg bg-gray-800 border ${!l.uom ? "border-red-500/60":"border-white/10"} px-3 py-2 text-sm`}/>
                                            </td>

                                            {/* From */}
                                            <td className="px-4 py-3 align-top">
                                                <select data-rowkey={l.key}
                                                        value={l.fromLoc}
                                                        onChange={(e)=>updateLine(l.key, {fromLoc:e.target.value, fromBin:""})}
                                                        className={`w-36 rounded-lg bg-gray-800 border ${!l.fromLoc ? "border-red-500/60":"border-white/10"} px-3 py-2 text-sm`}>
                                                    <option value="">— Location —</option>
                                                    {LOCATIONS.map(x => <option key={x} value={x}>{x}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <select data-rowkey={l.key}
                                                        value={l.fromBin}
                                                        onChange={(e)=>updateLine(l.key, {fromBin:e.target.value})}
                                                        className={`w-28 rounded-lg bg-gray-800 border ${!l.fromBin ? "border-red-500/60":"border-white/10"} px-3 py-2 text-sm`}>
                                                    <option value="">— Bin —</option>
                                                    {(BINS[l.fromLoc] || []).map(b => <option key={b} value={b}>{b}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <input data-rowkey={l.key}
                                                       value={l.fromLot}
                                                       onChange={(e)=>updateLine(l.key, {fromLot:e.target.value})}
                                                       placeholder="(optional)"
                                                       className="w-28 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                            </td>

                                            {/* To */}
                                            <td className="px-4 py-3 align-top">
                                                <select data-rowkey={l.key}
                                                        value={l.toLoc}
                                                        onChange={(e)=>updateLine(l.key, {toLoc:e.target.value, toBin:""})}
                                                        className={`w-36 rounded-lg bg-gray-800 border ${!l.toLoc ? "border-red-500/60":"border-white/10"} px-3 py-2 text-sm`}>
                                                    <option value="">— Location —</option>
                                                    {LOCATIONS.map(x => <option key={x} value={x}>{x}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <select data-rowkey={l.key}
                                                        value={l.toBin}
                                                        onChange={(e)=>updateLine(l.key, {toBin:e.target.value})}
                                                        className={`w-28 rounded-lg bg-gray-800 border ${!l.toBin ? "border-red-500/60":"border-white/10"} px-3 py-2 text-sm`}>
                                                    <option value="">— Bin —</option>
                                                    {(BINS[l.toLoc] || []).map(b => <option key={b} value={b}>{b}</option>)}
                                                </select>
                                            </td>

                                            {/* Qty + notes */}
                                            <td className="px-4 py-3 align-top">
                                                <input data-rowkey={l.key} inputMode="decimal"
                                                       value={l.qty}
                                                       onChange={(e)=>updateLine(l.key, {qty:e.target.value})}
                                                       placeholder="0"
                                                       className={`w-24 rounded-lg bg-gray-800 border ${(Number(l.qty||0)<=0 || over) ? "border-red-500/60":"border-white/10"} px-3 py-2 text-sm`}/>
                                                {over && <div className="text-xs text-red-400 mt-1">Over available</div>}
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <input data-rowkey={l.key}
                                                       value={l.notes}
                                                       onChange={(e)=>updateLine(l.key, {notes:e.target.value})}
                                                       placeholder="Optional"
                                                       className="w-48 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                            </td>

                                            {/* Avail */}
                                            <td className="px-4 py-3 align-top text-right text-gray-300">
                                                {oh}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button onClick={()=>cloneLine(l.key)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs bg-gray-800/60 border-white/10 hover:bg-gray-700/60">Clone</button>
                                                    <button onClick={()=>removeLine(l.key)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20">Remove</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        {/* Footnotes */}
                        <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
                            <div>
                                Shortcuts: <span className="text-gray-300">Enter</span> add • <span className="text-gray-300">Ctrl/⌘+D</span> clone • <span className="text-gray-300">Delete</span> remove
                            </div>
                            <div className="flex items-center gap-2">
                                {badge("Draft", "bg-blue-600/20 text-blue-300")}
                                <span>Lines: <span className="text-gray-300">{totalLines}</span></span>
                                <span>Total Qty: <span className="text-gray-300">{totalQty}</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Error summary */}
                    {errors.length > 0 && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
                            <div className="font-semibold text-red-300 mb-1">Please fix the following before posting:</div>
                            <ul className="list-disc pl-5 space-y-1 text-red-200">
                                {errors.map((e, i) => <li key={i}>{e}</li>)}
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
                                <div className="text-xs text-gray-400">Total Qty</div>
                                <div className="text-lg font-semibold text-gray-100">{totalQty}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2">
                                <div className="text-xs text-gray-400">Reason</div>
                                <div className="text-sm text-gray-200 min-h-[20px]">{reason}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2 flex items-center justify-between text-sm">
                                <div className="text-xs text-gray-400">Date</div>
                                <div className="text-gray-200">{docDate}</div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 text-xs text-gray-400">
                        <div className="font-semibold text-gray-300 mb-2">Tips</div>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Pick item and source bin; available updates automatically (mock).</li>
                            <li>From/To cannot be the same bin.</li>
                            <li>Use keyboard shortcuts to work fast.</li>
                            <li>Posting will move stock (mock integration point).</li>
                        </ul>
                    </div>
                </aside>
            </section>
        </div>
    );
}

export {InventoryTransferPage};
