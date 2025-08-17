import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";

/**
 * WorkOrderCreationPage — React + Tailwind (plain JS)
 * - Consistent look&feel with BOMCreationPage
 * - Mock item/BOM master, explosion, rolled cost, runtime calc
 * - General + Materials + Operations + Attachments
 * - Debounced autosave banner (fake) + unsaved-changes guard
 * - Client-side validation + keyboard shortcuts on tables
 */

const MOCK_ITEMS = [
    {id:"ITM-001", name:"Warm Yellow LED", uom:"pcs", status:"Active", cost:0.12},
    {id:"ITM-002", name:"Large Widget", uom:"pcs", status:"Active", cost:9.5},
    {id:"ITM-003", name:"Plastic Case", uom:"pcs", status:"Active", cost:1.2},
    {id:"ITM-004", name:"Lion Bracket", uom:"pcs", status:"Active", cost:2.1},
    {id:"ITM-005", name:"Chain Bracket", uom:"pcs", status:"Active", cost:1.85},
    {id:"ITM-006", name:"Front Assembly", uom:"ea", status:"Active", cost:0},
    {id:"ITM-007", name:"Steel Frame", uom:"pcs", status:"Active", cost:7.2},
    {id:"ITM-008", name:"Blue Paint (RAL5010)", uom:"L", status:"Hold", cost:14.0},
    {id:"ITM-009", name:"Screws M3×8", uom:"ea", status:"Active", cost:0.03},
    {id:"ITM-010", name:"Assembly Kit 10", uom:"kit", status:"Discontinued", cost:0},
];

// Simple mocked BOM index: finished good -> [{itemId, qty}]
const MOCK_BOMS = {
    "ITM-006": [
        {itemId:"ITM-005", qty:2},    // Chain Bracket
        {itemId:"ITM-004", qty:1},    // Lion Bracket
        {itemId:"ITM-003", qty:1},    // Plastic Case
        {itemId:"ITM-009", qty:8},    // Screws
    ],
    "ITM-002": [
        {itemId:"ITM-007", qty:1},
        {itemId:"ITM-009", qty:6},
    ],
};

const nextWO = (() => {
    let n = 1011; // pretend last was WO-1010
    return () => `WO-${String(n++).padStart(4, "0")}`;
})();

const newMatRow = () => ({
    key: crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
    itemId: "",
    qtyPer: "", // per finished-good
    uom: "",
    notes: "",
});

const newOpRow = () => ({
    key: crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
    step: "",
    workstation: "",
    setupMin: "",    // minutes fixed
    runMinPer: "",   // minutes per unit
    notes: "",
});

export default function WorkOrderCreationPage() {
    const navigate = useNavigate();

    // ----- General form -----
    const [woId, setWoId] = useState(nextWO());
    const [parentItemId, setParentItemId] = useState("");
    const [qty, setQty] = useState("");
    const [status, setStatus] = useState("Draft");
    const [priority, setPriority] = useState("Medium");
    const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0,10));
    const [dueDate, setDueDate] = useState(() => new Date(Date.now()+86400000*3).toISOString().slice(0,10));
    const [assignee, setAssignee] = useState("");
    const [notes, setNotes] = useState("");

    // ----- Materials / Ops -----
    const [materials, setMaterials] = useState([newMatRow()]);
    const [ops, setOps] = useState([
        // nice starter op
        {...newOpRow(), step:"10", workstation:"Assembly", setupMin:"15", runMinPer:"1.5"},
    ]);

    // ----- Autosave state (fake) -----
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

    // Trigger fake autosave
    useEffect(() => {
        requestSave();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [woId, parentItemId, qty, status, priority, startDate, dueDate, assignee, notes, materials, ops]);

    // Unsaved-changes guard
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

    // ----- Derived -----
    const parentItem = useMemo(
        () => MOCK_ITEMS.find(i => i.id === parentItemId) || null,
        [parentItemId]
    );

    // explode materials from mocked BOM when parent changes (respect existing edits if same structure)
    useEffect(() => {
        if (!parentItemId) return;
        const bom = MOCK_BOMS[parentItemId];
        if (!bom) return;
        setMaterials((rows) => {
            // if empty or only one blank row, replace with exploded rows
            const hasContent = rows.some(r => r.itemId || r.qtyPer || r.uom || r.notes);
            if (hasContent && rows.length > 1) return rows;
            return bom.map(b => {
                const it = MOCK_ITEMS.find(i => i.id === b.itemId);
                return {
                    key: crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2),
                    itemId: b.itemId,
                    qtyPer: String(b.qty),
                    uom: it ? it.uom : "",
                    notes: "",
                };
            });
        });
    }, [parentItemId]);

    const qtyNum = Number(qty || 0);

    // rolled material cost based on qty
    const materialCost = useMemo(() => {
        return materials.reduce((sum, r) => {
            const it = MOCK_ITEMS.find(i => i.id === r.itemId);
            const per = Number(r.qtyPer || 0);
            return sum + (it ? (it.cost || 0) * per * qtyNum : 0);
        }, 0);
    }, [materials, qtyNum]);

    // estimated runtime minutes: sum(setup + runPer*qty)
    const runtimeMin = useMemo(() => {
        return ops.reduce((sum, r) => {
            const setup = Number(r.setupMin || 0);
            const runPer = Number(r.runMinPer || 0);
            return sum + setup + runPer * qtyNum;
        }, 0);
    }, [ops, qtyNum]);

    const componentsCount = useMemo(
        () => materials.filter(r => r.itemId && Number(r.qtyPer) > 0).length,
        [materials]
    );

    // ----- Validation -----
    const errors = useMemo(() => {
        const list = [];
        if (!woId) list.push("WO ID is required.");
        if (!parentItemId) list.push("Parent Item is required.");
        if (!qty || qtyNum <= 0) list.push("Quantity must be > 0.");
        if (startDate && dueDate && startDate > dueDate) list.push("Due date must be after start date.");
        const mValid = materials.filter(r => r.itemId || r.qtyPer || r.uom || r.notes);
        if (mValid.length === 0) list.push("Add at least one material line.");
        mValid.forEach((r, idx) => {
            if (!r.itemId) list.push(`Material row ${idx+1}: Component item required.`);
            if (!r.qtyPer || Number(r.qtyPer) <= 0) list.push(`Material row ${idx+1}: Qty per must be > 0.`);
            if (!r.uom) list.push(`Material row ${idx+1}: UoM required.`);
            if (r.itemId && r.itemId === parentItemId) list.push(`Material row ${idx+1}: Component cannot equal the parent item.`);
        });
        ops.forEach((r, idx) => {
            if (!r.step) list.push(`Operation row ${idx+1}: Step is required.`);
            if (!r.workstation) list.push(`Operation row ${idx+1}: Workstation is required.`);
            if (Number(r.setupMin || 0) < 0) list.push(`Operation row ${idx+1}: Setup cannot be negative.`);
            if (Number(r.runMinPer || 0) < 0) list.push(`Operation row ${idx+1}: Run per unit cannot be negative.`);
        });
        return list;
    }, [woId, parentItemId, qty, qtyNum, startDate, dueDate, materials, ops]);

    // ----- Row helpers -----
    const addMat = () => setMaterials(rs => [...rs, newMatRow()]);
    const cloneMat = (key) => setMaterials(rs => {
        const i = rs.findIndex(r => r.key === key);
        if (i === -1) return rs;
        const nr = {...rs[i], key: crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)};
        return [...rs.slice(0, i+1), nr, ...rs.slice(i+1)];
    });
    const removeMat = (key) => setMaterials(rs => rs.filter(r => r.key !== key));
    const updateMat = (key, patch) => setMaterials(rs => rs.map(r => r.key === key ? {...r, ...patch} : r));

    const addOp = () => setOps(rs => [...rs, newOpRow()]);
    const cloneOp = (key) => setOps(rs => {
        const i = rs.findIndex(r => r.key === key);
        if (i === -1) return rs;
        const nr = {...rs[i], key: crypto?.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)};
        return [...rs.slice(0, i+1), nr, ...rs.slice(i+1)];
    });
    const removeOp = (key) => setOps(rs => rs.filter(r => r.key !== key));
    const updateOp = (key, patch) => setOps(rs => rs.map(r => r.key === key ? {...r, ...patch} : r));

    // keyboard shortcuts on both tables
    const matRef = useRef(null);
    const opRef  = useRef(null);
    useEffect(() => {
        const handler = (e) => {
            if (e.key === "Enter" && e.target?.dataset?.rowkey) {
                if (e.metaKey || e.ctrlKey) {
                    const key = e.target.dataset.rowkey;
                    if (e.target.dataset.table === "mat") cloneMat(key);
                    if (e.target.dataset.table === "ops") cloneOp(key);
                } else if (!e.shiftKey) {
                    if (e.target.dataset.table === "mat") addMat();
                    if (e.target.dataset.table === "ops") addOp();
                }
            }
            if (e.key === "Delete" && e.target?.dataset?.rowkey) {
                const key = e.target.dataset.rowkey;
                if (e.target.dataset.table === "mat") removeMat(key);
                if (e.target.dataset.table === "ops") removeOp(key);
            }
        };
        const a = matRef.current, b = opRef.current;
        a && a.addEventListener("keydown", handler);
        b && b.addEventListener("keydown", handler);
        return () => {
            a && a.removeEventListener("keydown", handler);
            b && b.removeEventListener("keydown", handler);
        };
    }, []);

    // ----- Actions (fake) -----
    const saveDraft = () => {
        setLastSavedAt(new Date());
        setDirty(false);
        alert("Work order draft saved (mock).");
    };
    const releaseWO = () => {
        if (errors.length) {
            alert("Please resolve errors before releasing.");
            return;
        }
        alert("Work order released (mock). Status would become 'Released' and allocations would run.");
        setStatus("Released");
    };
    const cancel = () => {
        if (dirty && !window.confirm("Discard unsaved changes?")) return;
        navigate("/work-orders");
    };

    // ---- UI ----
    const pill = (value, cls) => (
        <span className={`px-2 py-1 text-xs rounded-full ${cls}`}>{value}</span>
    );

    return (
        <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">New Work Order</h1>
                        <p className="mt-2 text-gray-400">Create and release a production order — start in Draft, release when ready.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={saveDraft}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">
                            Save Draft
                        </button>
                        <button onClick={releaseWO}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                                disabled={errors.length > 0}>
                            Release WO
                        </button>
                        <button onClick={cancel}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Autosave banner */}
                <div className="mt-4 rounded-xl border border-white/10 bg-gray-900/60 px-4 py-3 text-sm flex items-center gap-3">
                    <span className={`inline-flex h-2 w-2 rounded-full ${dirty ? "bg-yellow-400" : "bg-green-400"}`}/>
                    <span className="text-gray-300">
            {dirty ? "Saving draft…" : lastSavedAt ? `Last saved ${lastSavedAt.toLocaleTimeString()}` : "No changes yet"}
          </span>
                    <span className="ml-auto text-xs text-gray-500">
            WO ID: <span className="font-mono text-gray-300">{woId}</span>
          </span>
                </div>
            </header>

            {/* Content */}
            <section className="mx-auto max-w-6xl px-4 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left column */}
                <div className="lg:col-span-2 space-y-6">

                    {/* General */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">General</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">WO ID</label>
                                <input value={woId} onChange={(e)=>setWoId(e.target.value)}
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Parent Item / Finished Good</label>
                                <input list="wo-items" value={parentItemId} onChange={(e)=>setParentItemId(e.target.value)}
                                       placeholder="e.g. ITM-006"
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                <datalist id="wo-items">
                                    {MOCK_ITEMS.map(i => <option key={i.id} value={i.id}>{`${i.id} — ${i.name}`}</option>)}
                                </datalist>
                                {parentItem && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        {parentItem.name} • UoM: {parentItem.uom} • Status: {parentItem.status}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Quantity</label>
                                <input inputMode="decimal" value={qty} onChange={(e)=>setQty(e.target.value)} placeholder="0"
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Priority</label>
                                <select value={priority} onChange={(e)=>setPriority(e.target.value)}
                                        className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm">
                                    <option>Low</option><option>Medium</option><option>High</option><option>Rush</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Status</label>
                                <select value={status} onChange={(e)=>setStatus(e.target.value)}
                                        className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm">
                                    <option>Draft</option><option>Released</option><option>In Progress</option>
                                    <option>Completed</option><option>Hold</option><option>Cancelled</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Assignee</label>
                                <input value={assignee} onChange={(e)=>setAssignee(e.target.value)} placeholder="e.g. K. Adams"
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                                <input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)}
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Due Date</label>
                                <input type="date" value={dueDate} onChange={(e)=>setDueDate(e.target.value)}
                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                                <textarea rows={3} value={notes} onChange={(e)=>setNotes(e.target.value)}
                                          placeholder="Optional shop traveler notes."
                                          className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                            </div>
                        </div>
                    </div>

                    {/* Materials */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-white">Materials</h2>
                            <div className="flex items-center gap-2 text-sm">
                                <button onClick={addMat}
                                        className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700">
                                    + Add Line
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                            <table ref={matRef} className="min-w-full divide-y divide-gray-800 text-sm">
                                <thead className="bg-gray-900/80">
                                <tr>
                                    <th className="px-4 py-3 text-left">Component Item</th>
                                    <th className="px-4 py-3 text-left">Qty per</th>
                                    <th className="px-4 py-3 text-left">UoM</th>
                                    <th className="px-4 py-3 text-left">Notes</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {materials.map((r, idx) => {
                                    const it = MOCK_ITEMS.find(i => i.id === r.itemId);
                                    const errs = {
                                        item: !r.itemId,
                                        qty: !r.qtyPer || Number(r.qtyPer) <= 0,
                                        uom: !r.uom,
                                        sameAsParent: r.itemId && r.itemId === parentItemId,
                                    };
                                    return (
                                        <tr key={r.key} className="hover:bg-gray-800/40 transition">
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex flex-col gap-1">
                                                    <select
                                                        data-rowkey={r.key} data-table="mat"
                                                        value={r.itemId}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const it2 = MOCK_ITEMS.find(i => i.id === val);
                                                            updateMat(r.key, { itemId: val, uom: it2 ? it2.uom : r.uom });
                                                        }}
                                                        className={`w-full rounded-lg bg-gray-800 border ${errs.item ? "border-red-500/60":"border-white/10"} px-3 py-2 text-sm`}
                                                    >
                                                        <option value="">— Select item —</option>
                                                        {MOCK_ITEMS.map(i => <option key={i.id} value={i.id}>{`${i.id} — ${i.name}`}</option>)}
                                                    </select>
                                                    {it && (
                                                        <div className="text-xs text-gray-500">{it.name} • Default UoM: {it.uom} • Status: {it.status}</div>
                                                    )}
                                                    {errs.sameAsParent && <div className="text-xs text-red-400">Component cannot equal parent item.</div>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <input data-rowkey={r.key} data-table="mat"
                                                       inputMode="decimal" value={r.qtyPer}
                                                       onChange={(e)=>updateMat(r.key, {qtyPer: e.target.value})}
                                                       placeholder="0"
                                                       className={`w-28 rounded-lg bg-gray-800 border ${errs.qty ? "border-red-500/60":"border-white/10"} px-3 py-2 text-sm`}/>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <input data-rowkey={r.key} data-table="mat"
                                                       value={r.uom}
                                                       onChange={(e)=>updateMat(r.key, {uom: e.target.value})}
                                                       placeholder={it ? it.uom : "e.g. pcs"}
                                                       className={`w-28 rounded-lg bg-gray-800 border ${errs.uom ? "border-red-500/60":"border-white/10"} px-3 py-2 text-sm`}/>
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <input data-rowkey={r.key} data-table="mat"
                                                       value={r.notes}
                                                       onChange={(e)=>updateMat(r.key, {notes: e.target.value})}
                                                       placeholder="Optional notes"
                                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                            </td>
                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button onClick={()=>cloneMat(r.key)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs bg-gray-800/60 border-white/10 hover:bg-gray-700/60">
                                                        Clone
                                                    </button>
                                                    <button onClick={()=>removeMat(r.key)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20">
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

                        <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
                            <div>
                                Shortcuts: <span className="text-gray-300">Enter</span> add line • <span className="text-gray-300">Ctrl/⌘+D</span> duplicate focused line • <span className="text-gray-300">Delete</span> remove
                            </div>
                            <div>
                                {componentsCount === 0 ? <span className="text-yellow-400">No valid components yet</span> :
                                    <span>Valid components: <span className="text-gray-300">{componentsCount}</span></span>}
                            </div>
                        </div>
                    </div>

                    {/* Operations */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-white">Operations</h2>
                            <div className="flex items-center gap-2 text-sm">
                                <button onClick={addOp}
                                        className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700">
                                    + Add Operation
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                            <table ref={opRef} className="min-w-full divide-y divide-gray-800 text-sm">
                                <thead className="bg-gray-900/80">
                                <tr>
                                    <th className="px-4 py-3 text-left">Step</th>
                                    <th className="px-4 py-3 text-left">Workstation</th>
                                    <th className="px-4 py-3 text-left">Setup (min)</th>
                                    <th className="px-4 py-3 text-left">Run / Unit (min)</th>
                                    <th className="px-4 py-3 text-left">Notes</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {ops.map((r) => {
                                    const setup = Number(r.setupMin || 0);
                                    const run = Number(r.runMinPer || 0);
                                    const total = setup + run * qtyNum;
                                    return (
                                        <tr key={r.key} className="hover:bg-gray-800/40 transition">
                                            <td className="px-4 py-3">
                                                <input data-rowkey={r.key} data-table="ops"
                                                       value={r.step} onChange={(e)=>updateOp(r.key, {step: e.target.value})}
                                                       placeholder="10"
                                                       className="w-24 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input data-rowkey={r.key} data-table="ops"
                                                       value={r.workstation} onChange={(e)=>updateOp(r.key, {workstation: e.target.value})}
                                                       placeholder="Assembly / Paint / QA"
                                                       className="w-48 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input data-rowkey={r.key} data-table="ops" inputMode="decimal"
                                                       value={r.setupMin} onChange={(e)=>updateOp(r.key, {setupMin: e.target.value})}
                                                       placeholder="0"
                                                       className="w-28 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input data-rowkey={r.key} data-table="ops" inputMode="decimal"
                                                       value={r.runMinPer} onChange={(e)=>updateOp(r.key, {runMinPer: e.target.value})}
                                                       placeholder="0.0"
                                                       className="w-28 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input data-rowkey={r.key} data-table="ops"
                                                       value={r.notes} onChange={(e)=>updateOp(r.key, {notes: e.target.value})}
                                                       placeholder="Optional notes"
                                                       className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"/>
                                            </td>
                                            <td className="px-4 py-3 text-right text-xs text-gray-400">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="hidden md:inline">Est: <span className="text-gray-300">{total.toFixed(1)} min</span></span>
                                                    <button onClick={()=>cloneOp(r.key)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs bg-gray-800/60 border-white/10 hover:bg-gray-700/60">Clone</button>
                                                    <button onClick={()=>removeOp(r.key)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20">Remove</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-3 text-xs text-gray-500">
                            Shortcuts: <span className="text-gray-300">Enter</span> add operation • <span className="text-gray-300">Ctrl/⌘+D</span> duplicate • <span className="text-gray-300">Delete</span> remove
                        </div>
                    </div>

                    {/* Attachments (placeholder) */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">Attachments</h2>
                        <div className="text-sm text-gray-400">Upload drawings/specs here in the future. (Placeholder)</div>
                    </div>

                    {/* Error summary */}
                    {errors.length > 0 && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
                            <div className="font-semibold text-red-300 mb-1">Please fix the following before release:</div>
                            <ul className="list-disc pl-5 space-y-1 text-red-200">
                                {errors.map((e, i) => <li key={i}>{e}</li>)}
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
                                <div className="text-xs text-gray-400">Materials</div>
                                <div className="text-lg font-semibold text-gray-100">{componentsCount}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Mat. Cost (mock)</div>
                                <div className="text-lg font-semibold text-gray-100">€{materialCost.toFixed(2)}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Est. Runtime</div>
                                <div className="text-lg font-semibold text-gray-100">{runtimeMin.toFixed(1)} min</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Quantity</div>
                                <div className="text-lg font-semibold text-gray-100">{qty || 0}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2">
                                <div className="text-xs text-gray-400">Parent Item</div>
                                <div className="text-sm text-gray-200 min-h-[20px]">
                                    {parentItem ? `${parentItem.id} — ${parentItem.name}` : <span className="text-gray-500">(not set)</span>}
                                </div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10 col-span-2 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">Priority</span>
                                    {pill(priority,
                                        priority === "Rush" ? "bg-red-600/30 text-red-300" :
                                            priority === "High" ? "bg-orange-600/30 text-orange-300" :
                                                priority === "Medium" ? "bg-sky-600/30 text-sky-300" :
                                                    "bg-gray-600/30 text-gray-300")}
                                </div>
                                <div className="text-xs text-gray-400">Due <span className="text-gray-200">{dueDate || "-"}</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 text-xs text-gray-400">
                        <div className="font-semibold text-gray-300 mb-2">Tips</div>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Pick a parent item; materials auto-explode from its BOM (mock).</li>
                            <li>Edit materials/operations inline. Totals update from Quantity.</li>
                            <li>Start in Draft; Release when validated to allocate parts (mock).</li>
                            <li>Use shortcuts: Enter (add) • Ctrl/⌘+D (duplicate) • Delete (remove).</li>
                        </ul>
                    </div>
                </aside>
            </section>
        </div>
    );
}

export {WorkOrderCreationPage};
