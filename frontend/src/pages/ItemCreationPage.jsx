// ItemCreationPage.jsx
import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";

/**
 * ItemCreationPage — "New Item" (ERP lightweight)
 * - General info (ID, name, category, status, base UoM, cost, reorder pt)
 * - Additional UoMs table with coefficients (conversions)
 *   • Rule: 1 <alt UoM> = <coef> × <base UoM>
 * - Client-side validation
 * - Fake autosave banner with debounce
 * - Unsaved-changes guard
 * - Sticky summary
 * - Actions are placeholders (alert/disabled)
 * - Keyboard: Enter add row • Ctrl/⌘+D clone • Delete remove
 */

const nextItemId = (() => {
    let n = 11; // assume ITM-010 exists; next is ITM-011
    return () => `ITM-${String(n++).padStart(3, "0")}`;
})();

const CATEGORIES = [
    "Component",
    "Fabrication",
    "Hardware",
    "Assembly",
    "Finished Good",
    "Consumable",
    "Kit",
];

const STATUS = ["Draft", "Active", "Hold", "Discontinued"];

const uid = () =>
    (typeof crypto !== "undefined" && crypto.randomUUID)
        ? crypto.randomUUID()
        : String(Math.random()).slice(2);

const emptyUomRow = () => ({
    key: uid(),
    uom: "",
    coef: "",
    notes: "",
});

export default function ItemCreationPage() {
    const navigate = useNavigate();

    // ---------- Form state ----------
    const [itemId, setItemId] = useState(nextItemId());
    const [name, setName] = useState("");
    const [category, setCategory] = useState("Component");
    const [status, setStatus] = useState("Draft");
    const [baseUom, setBaseUom] = useState("");
    const [stdCost, setStdCost] = useState("");
    const [reorderPt, setReorderPt] = useState("");
    const [description, setDescription] = useState("");

    const [uomRows, setUomRows] = useState([emptyUomRow()]);

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
    }, [itemId, name, category, status, baseUom, stdCost, reorderPt, description, uomRows]);

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

    // ---------- UoM table ops ----------
    const tableRef = useRef(null);
    const addRow = () => setUomRows((rs) => [...rs, emptyUomRow()]);
    const removeRow = (key) => setUomRows((rs) => rs.filter((r) => r.key !== key));
    const cloneRow = (key) =>
        setUomRows((rs) => {
            const idx = rs.findIndex((r) => r.key === key);
            if (idx === -1) return rs;
            const nr = {...rs[idx], key: uid()};
            return [...rs.slice(0, idx + 1), nr, ...rs.slice(idx + 1)];
        });
    const updateRow = (key, patch) =>
        setUomRows((rs) => rs.map((r) => (r.key === key ? {...r, ...patch} : r)));

    // keyboard shortcuts
    useEffect(() => {
        const h = (e) => {
            if (e.key === "Enter" && e.target && e.target.tagName === "INPUT") {
                if (e.metaKey || e.ctrlKey) {
                    const key = e.target.getAttribute("data-rowkey");
                    if (key) cloneRow(key);
                } else if (!e.shiftKey) {
                    addRow();
                }
            }
            if (e.key === "Delete") {
                const key = e.target && e.target.getAttribute("data-rowkey");
                if (key) removeRow(key);
            }
        };
        const el = tableRef.current;
        el && el.addEventListener("keydown", h);
        return () => el && el.removeEventListener("keydown", h);
    }, []);

    // ---------- Validation ----------
    const errors = useMemo(() => {
        const list = [];
        if (!itemId) list.push("Item ID is required.");
        if (!name.trim()) list.push("Product name is required.");
        if (!baseUom.trim()) list.push("Base UoM is required.");

        // validate UoM conversions
        const seen = new Set();
        uomRows
            .filter((r) => r.uom || r.coef || r.notes)
            .forEach((r, idx) => {
                if (!r.uom) list.push(`UoM row ${idx + 1}: UoM code required.`);
                if (r.uom && r.uom === baseUom)
                    list.push(`UoM row ${idx + 1}: Additional UoM cannot equal base UoM.`);
                if (r.uom) {
                    const u = r.uom.trim().toLowerCase();
                    if (seen.has(u)) list.push(`UoM row ${idx + 1}: Duplicate UoM '${r.uom}'.`);
                    seen.add(u);
                }
                const c = Number(r.coef);
                if (!r.coef || !(c > 0)) list.push(`UoM row ${idx + 1}: Coefficient must be > 0.`);
            });

        // numeric sanity (optional fields)
        if (stdCost !== "" && Number(stdCost) < 0) list.push("Standard cost cannot be negative.");
        if (reorderPt !== "" && Number.isNaN(Number(reorderPt))) list.push("Reorder point must be a number.");

        return list;
    }, [itemId, name, baseUom, uomRows, stdCost, reorderPt]);

    // derived
    const validUoms = useMemo(
        () =>
            uomRows.filter((r) => r.uom && r.uom !== baseUom && Number(r.coef) > 0),
        [uomRows, baseUom]
    );

    // ---------- Actions (mock) ----------
    const handleSaveDraft = () => {
        setLastSavedAt(new Date());
        setDirty(false);
        alert("Item draft saved (mock).");
    };
    const handleCreate = () => {
        if (errors.length) {
            alert("Please resolve errors before creating the item.");
            return;
        }
        setStatus("Active");
        alert("Item created (mock). Status set to Active.");
        navigate("/items");
    };
    const handleCancel = () => {
        if (dirty && !window.confirm("Discard unsaved changes?")) return;
        navigate("/items");
    };

    return (
        <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">New Item</h1>
                        <p className="mt-2 text-gray-400">
                            Define a SKU with base UoM and optional additional UoMs with conversion coefficients.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveDraft}
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm"
                        >
                            Save Draft
                        </button>
                        <button
                            onClick={handleCreate}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                            disabled={errors.length > 0}
                        >
                            Create Item
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
                <div className="mt-4 rounded-xl border border-white/10 bg-gray-900/60 px-4 py-3 text-sm flex items-center gap-3">
                    <span className={`inline-flex h-2 w-2 rounded-full ${dirty ? "bg-yellow-400" : "bg-green-400"}`} />
                    <span className="text-gray-300">
            {dirty ? "Saving draft…" : lastSavedAt ? `Last saved ${lastSavedAt.toLocaleTimeString()}` : "No changes yet"}
          </span>
                    <span className="ml-auto text-xs text-gray-500">
            Item ID: <span className="font-mono text-gray-300">{itemId}</span>
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
                                <label className="block text-xs text-gray-400 mb-1">Item ID</label>
                                <input
                                    value={itemId}
                                    onChange={(e) => setItemId(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Status</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                >
                                    {STATUS.map((s) => (
                                        <option key={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Product name</label>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    placeholder="e.g. Chain Bracket"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                >
                                    {CATEGORIES.map((c) => (
                                        <option key={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Base UoM</label>
                                <input
                                    value={baseUom}
                                    onChange={(e) => setBaseUom(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    placeholder="e.g. pcs / L / kg / ea"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Standard Cost</label>
                                <input
                                    inputMode="decimal"
                                    value={stdCost}
                                    onChange={(e) => setStdCost(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Reorder point</label>
                                <input
                                    inputMode="numeric"
                                    value={reorderPt}
                                    onChange={(e) => setReorderPt(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    placeholder="0"
                                />
                            </div>
                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    placeholder="Optional description / specs."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional UoMs */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-white">Additional UoMs</h2>
                            <button
                                onClick={addRow}
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm"
                            >
                                + Add UoM
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 mb-2">
                            Conversion rule: <span className="text-gray-300 font-medium">1 &lt;additional UoM&gt; = coef × 1 {baseUom || "base UoM"}</span>
                        </p>

                        <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                            <table ref={tableRef} className="min-w-full divide-y divide-gray-800 text-sm">
                                <thead className="bg-gray-900/80">
                                <tr>
                                    <th className="px-4 py-3 text-left">UoM</th>
                                    <th className="px-4 py-3 text-left">Coefficient</th>
                                    <th className="px-4 py-3 text-left">Notes</th>
                                    <th className="px-4 py-3 text-left">Example</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {uomRows.map((r) => {
                                    const coef = Number(r.coef || 0);
                                    const ex = baseUom
                                        ? `1 ${r.uom || "ALT"} = ${r.coef || "?"} ${baseUom}`
                                        : "Set base UoM to see example";
                                    const rowErrors = {
                                        uom: !r.uom || (baseUom && r.uom === baseUom),
                                        coef: !r.coef || !(coef > 0),
                                    };
                                    return (
                                        <tr key={r.key} className="hover:bg-gray-800/40 transition">
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={r.key}
                                                    value={r.uom}
                                                    onChange={(e) => updateRow(r.key, {uom: e.target.value})}
                                                    placeholder="e.g. box, pack, kg"
                                                    className={`w-40 rounded-lg bg-gray-800 border ${rowErrors.uom ? "border-red-500/60" : "border-white/10"} px-3 py-2 text-sm`}
                                                />
                                                {baseUom && r.uom === baseUom && (
                                                    <div className="text-xs text-red-400 mt-1">Cannot equal base UoM.</div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={r.key}
                                                    inputMode="decimal"
                                                    value={r.coef}
                                                    onChange={(e) => updateRow(r.key, {coef: e.target.value})}
                                                    placeholder="> 0"
                                                    className={`w-28 rounded-lg bg-gray-800 border ${rowErrors.coef ? "border-red-500/60" : "border-white/10"} px-3 py-2 text-sm`}
                                                />
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    data-rowkey={r.key}
                                                    value={r.notes}
                                                    onChange={(e) => updateRow(r.key, {notes: e.target.value})}
                                                    placeholder="Optional"
                                                    className="w-64 rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 align-top text-gray-300">{ex}</td>
                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        onClick={() => cloneRow(r.key)}
                                                        className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-800/60 border-white/10 hover:bg-gray-700/60"
                                                    >
                                                        ⎘ Clone
                                                    </button>
                                                    <button
                                                        onClick={() => removeRow(r.key)}
                                                        className="px-2.5 py-1.5 rounded-md border text-xs bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20"
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

                        <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
                            <div>
                                Shortcuts: <span className="text-gray-300">Enter</span> add •{" "}
                                <span className="text-gray-300">Ctrl/⌘+D</span> clone •{" "}
                                <span className="text-gray-300">Delete</span> remove
                            </div>
                            <div>
                                Valid additional UoMs: <span className="text-gray-300">{validUoms.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Attachments placeholder */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-1">Attachments</h2>
                        <div className="text-sm text-gray-400">Upload drawings/specs later. (Placeholder)</div>
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
                                <div className="text-xs text-gray-400">Item</div>
                                <div className="text-sm text-gray-200">{itemId}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Status</div>
                                <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                        status === "Active"
                                            ? "bg-green-600/30 text-green-400"
                                            : status === "Hold"
                                                ? "bg-yellow-600/30 text-yellow-400"
                                                : status === "Discontinued"
                                                    ? "bg-gray-600/30 text-gray-400"
                                                    : "bg-blue-600/30 text-blue-300"
                                    }`}
                                >
                  {status}
                </span>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Category</div>
                                <div className="text-sm text-gray-200">{category}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Base UoM</div>
                                <div className="text-sm text-gray-200 min-h-[20px]">
                                    {baseUom || <span className="text-gray-500">(not set)</span>}
                                </div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Std Cost</div>
                                <div className="text-lg font-semibold text-gray-100">
                                    {stdCost === "" ? "—" : `€${Number(stdCost).toFixed(2)}`}
                                </div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Reorder pt</div>
                                <div className="text-lg font-semibold text-gray-100">
                                    {reorderPt === "" ? "—" : Number(reorderPt)}
                                </div>
                            </div>

                            {/* Quick reference of conversions */}
                            <div className="rounded-2xl bg-gray-900/60 p-4 text-xs text-gray-400 border border-white/10 col-span-2">
                                <div className="font-semibold text-gray-300 mb-2">Conversions</div>
                                {validUoms.length === 0 ? (
                                    <div className="text-gray-500">No additional UoMs yet.</div>
                                ) : (
                                    <ul className="list-disc pl-5 space-y-1">
                                        {validUoms.map((r) => (
                                            <li key={r.key} className="text-gray-300">
                                                1 {r.uom} = {r.coef} {baseUom}
                                                {r.notes ? <span className="text-gray-500"> — {r.notes}</span> : null}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="rounded-2xl bg-gray-900/60 p-4 text-xs text-gray-400 border border-white/10 col-span-2">
                                <div className="font-semibold text-gray-300 mb-2">Tips</div>
                                <ul className="list-disc pl-5 space-y-1">
                                    <li>Use short UoM codes (e.g., pcs, box, kg).</li>
                                    <li>Coefficient expresses how many base units are in 1 additional unit.</li>
                                    <li>Keep financial fields optional; you can update after item creation.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </aside>
            </section>
        </div>
    );
}

export {ItemCreationPage};
