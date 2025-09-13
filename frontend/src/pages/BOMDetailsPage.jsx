import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";

/**
 * BOMDetailsPage — React + Tailwind (Save/Cancel only, simplified; no Scrap %, pricing, or capacity)
 *
 * Purpose:
 * - Two equal-width actions: Save and Cancel.
 * - Cancel: if there are unsaved changes since open, show a confirmation modal; otherwise navigate to /boms.
 * - Save: mock alert (prep for backend), then navigate to /boms.
 * - Simplified form: removed Effective Date, Release Rate, Planned Yield, pricing/capacity features, and Scrap % column.
 * - Keeps parent/component pickers, validation, attachments placeholder.
 */

// ---- Mocked item master ----
const MOCK_ITEMS = [
    {id: "ITM-001", name: "Warm Yellow LED", uom: "pcs", status: "Active"},
    {id: "ITM-002", name: "Large Widget", uom: "pcs", status: "Active"},
    {id: "ITM-003", name: "Plastic Case", uom: "pcs", status: "Active"},
    {id: "ITM-004", name: "Lion Bracket", uom: "pcs", status: "Active"},
    {id: "ITM-005", name: "Chain Bracket", uom: "pcs", status: "Active"},
    {id: "ITM-006", name: "Front Assembly", uom: "ea", status: "Active"},
    {id: "ITM-007", name: "Steel Frame", uom: "pcs", status: "Active"},
    {id: "ITM-008", name: "Blue Paint (RAL5010)", uom: "L", status: "Hold"},
    {id: "ITM-009", name: "Screws M3×8", uom: "ea", status: "Active"},
    {id: "ITM-010", name: "Assembly Kit 10", uom: "kit", status: "Discontinued"},
];

const nextId = (() => {
    let n = 11; // pretend last was BOM-010
    return () => `BOM-${String(n++).padStart(3, "0")}`;
})();

const emptyRow = () => ({
    key: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : String(Math.random()).slice(2),
    itemId: "",
    qty: "",
    uom: "",
    notes: "",
});

// ---------- Utilities ----------
function classNames(...a) {
    return a.filter(Boolean).join(" ");
}

// ---------- Modal ----------
function Modal({open, onClose, title, children, footer}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/60" onClick={onClose}/>
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div
                    className="w-full max-w-3xl rounded-2xl border border-white/10 bg-gray-900 text-gray-200 shadow-2xl">
                    <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-200">&times;</button>
                    </div>
                    <div className="p-5 max-h-[65vh] overflow-y-auto">{children}</div>
                    <div
                        className="px-5 py-4 border-t border-white/10 bg-gray-900/60 flex items-center justify-end gap-2">
                        {footer}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ---------- Item Picker Modal ----------
function ItemPickerModal({open, onClose, onPick, items, title = "Select Item"}) {
    const [q, setQ] = useState("");
    const filtered = useMemo(() => {
        const qq = q.toLowerCase();
        return items.filter(it =>
            it.id.toLowerCase().includes(qq) ||
            it.name.toLowerCase().includes(qq) ||
            it.uom.toLowerCase().includes(qq) ||
            it.status.toLowerCase().includes(qq)
        );
    }, [q, items]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={title}
            footer={
                <button onClick={onClose}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">
                    Close
                </button>
            }
        >
            <div className="mb-3">
                <input
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    placeholder="Search by ID, name, UoM, status"
                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                />
            </div>
            <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                <table className="min-w-full divide-y divide-gray-800 text-sm">
                    <thead className="bg-gray-900/80">
                    <tr>
                        <th className="px-4 py-3 text-left">Item</th>
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">UoM</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                    {filtered.map(it => (
                        <tr key={it.id} className="hover:bg-gray-800/40">
                            <td className="px-4 py-3 font-mono">{it.id}</td>
                            <td className="px-4 py-3">{it.name}</td>
                            <td className="px-4 py-3">{it.uom}</td>
                            <td className="px-4 py-3">{it.status}</td>
                            <td className="px-4 py-3 text-right">
                                <button
                                    onClick={() => onPick(it)}
                                    className="px-2.5 py-1.5 rounded-md border text-xs bg-gray-700/80 text-white border-white/10 hover:bg-gray-700">
                                    Use Item
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-4 py-6 text-center text-gray-400">No matches</td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </Modal>
    );
}

// ---------- Page ----------
export default function BOMDetailsPage() {
    const navigate = useNavigate();

    // ---- Form state ----
    const [bomId, setBomId] = useState(nextId());
    const [parentItemId, setParentItemId] = useState("");
    const [revision, setRevision] = useState("v1");
    const [status, setStatus] = useState("Draft");
    const [description, setDescription] = useState("");
    const [rows, setRows] = useState([emptyRow()]);

    // ---- Modals ----
    const [openConfirmLeave, setOpenConfirmLeave] = useState(false);
    const [openParentPicker, setOpenParentPicker] = useState(false);
    const [openComponentPicker, setOpenComponentPicker] = useState({open: false, rowKey: null});

    // ---- Derived ----
    const parentItem = useMemo(() => MOCK_ITEMS.find(i => i.id === parentItemId) || null, [parentItemId]);
    const componentsCount = rows.filter(r => r.itemId && Number(r.qty) > 0).length;

    // ---- Validation ----
    const errors = useMemo(() => {
        const list = [];
        if (!parentItemId) list.push("Parent Item is required.");
        if (!bomId) list.push("BOM ID is required.");

        const validRows = rows.filter(r => r.itemId || r.qty || r.uom || r.notes);
        if (validRows.length === 0) list.push("Add at least one component.");

        validRows.forEach((r, idx) => {
            if (!r.itemId) list.push(`Row ${idx + 1}: Component item required.`);
            if (!r.qty || Number(r.qty) <= 0) list.push(`Row ${idx + 1}: Quantity must be > 0.`);
            if (!r.uom) list.push(`Row ${idx + 1}: UoM required.`);
            if (r.itemId && r.itemId === parentItemId) list.push(`Row ${idx + 1}: Component cannot equal the parent item.`);
        });

        return list;
    }, [parentItemId, bomId, rows]);

    // ---- Change tracking (since open) ----
    const initialSnapshotRef = useRef(null);
    const makeSnapshot = () => JSON.stringify({bomId, parentItemId, revision, status, description, rows});
    useEffect(() => {
        if (initialSnapshotRef.current == null) {
            initialSnapshotRef.current = makeSnapshot();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const hasChanges = useMemo(() => {
        const cur = makeSnapshot();
        return initialSnapshotRef.current !== cur;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bomId, parentItemId, revision, status, description, rows]);

    // ---- beforeunload guard ----
    useEffect(() => {
        const beforeUnload = (e) => {
            if (hasChanges) {
                e.preventDefault();
                e.returnValue = "";
                return "";
            }
        };
        window.addEventListener("beforeunload", beforeUnload);
        return () => window.removeEventListener("beforeunload", beforeUnload);
    }, [hasChanges]);

    // ---- Row ops ----
    const addRow = () => setRows(rs => [...rs, emptyRow()]);
    const removeRow = (key) => setRows(rs => rs.filter(r => r.key !== key));
    const cloneRow = (key) => setRows(rs => {
        const idx = rs.findIndex(r => r.key === key);
        if (idx === -1) return rs;
        const nr = {...rs[idx], key: (crypto.randomUUID?.() || String(Math.random()).slice(2))};
        return [...rs.slice(0, idx + 1), nr, ...rs.slice(idx + 1)];
    });
    const updateRow = (key, patch) => setRows(rs => rs.map(r => (r.key === key ? {...r, ...patch} : r)));

    // ---- Actions ----
    const BTN_W = "w-28";
    const handleSave = () => {
        alert("BOM saved (mock). Navigating to BOMs list.");
        navigate("/boms");
    };
    const handleCancel = () => {
        if (hasChanges) setOpenConfirmLeave(true);
        else navigate("/boms");
    };

    return (
        <div className="bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">New BOM</h1>
                        <p className="mt-2 text-gray-400">Create a bill of materials — save when ready.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            className={classNames(BTN_W, "px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm")}
                        >
                            Save
                        </button>
                        <button
                            onClick={handleCancel}
                            className={classNames(BTN_W, "px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm")}
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Unsaved banner */}
                <div
                    className="mt-4 rounded-xl border border-white/10 bg-gray-900/60 px-4 py-3 text-sm flex items-center gap-3">
                    <span
                        className={`inline-flex h-2 w-2 rounded-full ${hasChanges ? "bg-yellow-400" : "bg-green-400"}`}/>
                    <span className="text-gray-300">
            {hasChanges ? "You have unsaved changes" : "No changes since open"}
          </span>
                    <span className="ml-auto text-xs text-gray-500">
            BOM ID: <span className="font-mono text-gray-300">{bomId}</span>
          </span>
                </div>
            </header>

            {/* Content */}
            <section className="mx-auto px-4 pb-16 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left: form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">General</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Parent Item */}
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Parent Item / Finished Good</label>
                                <div className="flex gap-2">
                                    <input
                                        value={parentItemId}
                                        onChange={(e) => setParentItemId(e.target.value)}
                                        placeholder="e.g. ITM-006"
                                        className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    />
                                    <button
                                        onClick={() => setOpenParentPicker(true)}
                                        className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm"
                                    >
                                        Pick
                                    </button>
                                </div>
                                {parentItem && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        {parentItem.name} • UoM: {parentItem.uom} • Status: {parentItem.status}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">BOM ID</label>
                                <input
                                    value={bomId}
                                    onChange={(e) => setBomId(e.target.value)}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Revision</label>
                                <input
                                    value={revision}
                                    onChange={(e) => setRevision(e.target.value)}
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
                                    <option>Draft</option>
                                    <option>Active</option>
                                    <option>Hold</option>
                                    <option>Obsolete</option>
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs text-gray-400 mb-1">Description / Notes</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    placeholder="Optional, visible on BOM details and shop traveler."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Components */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-semibold text-white">Components</h2>
                            <button
                                onClick={addRow}
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm"
                            >
                                + Add Row
                            </button>
                        </div>

                        <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/40">
                            <table className="min-w-full divide-y divide-gray-800 text-sm">
                                <thead className="bg-gray-900/80">
                                <tr>
                                    <th className="px-4 py-3 text-left">Component Item</th>
                                    <th className="px-4 py-3 text-left">Qty / 1 pc</th>
                                    <th className="px-4 py-3 text-left">UoM</th>
                                    <th className="px-4 py-3 text-left">Notes</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                {rows.map((r) => {
                                    const it = MOCK_ITEMS.find(i => i.id === r.itemId);
                                    const rowErrors = {
                                        itemId: !r.itemId,
                                        qty: !r.qty || Number(r.qty) <= 0,
                                        uom: !r.uom,
                                        sameAsParent: r.itemId && r.itemId === parentItemId,
                                    };

                                    return (
                                        <tr key={r.key} className="hover:bg-gray-800/40 transition">
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex gap-2">
                                                        <input
                                                            value={r.itemId}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const selectedItem = MOCK_ITEMS.find(i => i.id === val);
                                                                updateRow(r.key, {
                                                                    itemId: val,
                                                                    uom: selectedItem ? selectedItem.uom : r.uom
                                                                });
                                                            }}
                                                            placeholder="e.g. ITM-003"
                                                            className={classNames(
                                                                "w-full rounded-lg bg-gray-800 px-3 py-2 text-sm border",
                                                                rowErrors.itemId ? "border-red-500/60" : "border-white/10"
                                                            )}
                                                        />
                                                        <button
                                                            onClick={() => setOpenComponentPicker({
                                                                open: true,
                                                                rowKey: r.key
                                                            })}
                                                            className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm whitespace-nowrap"
                                                        >
                                                            Pick
                                                        </button>
                                                    </div>
                                                    {it && (
                                                        <div className="text-xs text-gray-500">
                                                            {it.name} • Default UoM: {it.uom} • Status: {it.status}
                                                        </div>
                                                    )}
                                                    {rowErrors.sameAsParent && (
                                                        <div className="text-xs text-red-400">Component cannot equal
                                                            parent item.</div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    inputMode="decimal"
                                                    value={r.qty}
                                                    onChange={(e) => updateRow(r.key, {qty: e.target.value})}
                                                    placeholder="0"
                                                    className={classNames(
                                                        "w-28 rounded-lg bg-gray-800 border px-3 py-2 text-sm",
                                                        rowErrors.qty ? "border-red-500/60" : "border-white/10"
                                                    )}
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    value={r.uom}
                                                    onChange={(e) => updateRow(r.key, {uom: e.target.value})}
                                                    placeholder={it ? it.uom : "e.g. pcs"}
                                                    className={classNames(
                                                        "w-28 rounded-lg bg-gray-800 border px-3 py-2 text-sm",
                                                        rowErrors.uom ? "border-red-500/60" : "border-white/10"
                                                    )}
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top">
                                                <input
                                                    value={r.notes}
                                                    onChange={(e) => updateRow(r.key, {notes: e.target.value})}
                                                    placeholder="Optional notes"
                                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                                />
                                            </td>

                                            <td className="px-4 py-3 align-top text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <button
                                                        onClick={() => cloneRow(r.key)}
                                                        title="Clone row"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium
                                         bg-gray-800/60 border-white/10 text-gray-200 hover:bg-gray-700/60"
                                                    >
                                                        Clone
                                                    </button>
                                                    <button
                                                        onClick={() => removeRow(r.key)}
                                                        title="Remove row"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium
                                         bg-red-600/10 border-red-500/30 text-red-300 hover:bg-red-600/20 hover:text-red-200"
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

                        {/* Table footer helper */}
                        <div className="mt-3 text-xs text-gray-500 flex items-center justify-between flex-wrap gap-3">
                            <div>
                                Shortcuts: <span className="text-gray-300">Enter</span> add row • <span
                                className="text-gray-300">Ctrl/⌘+D</span> duplicate focused row • <span
                                className="text-gray-300">Delete</span> remove focused row
                            </div>
                            <div className="flex items-center gap-3">
                                {componentsCount === 0 ? (
                                    <span className="text-yellow-400">No valid components yet</span>
                                ) : (
                                    <span>Valid components: <span
                                        className="text-gray-300">{componentsCount}</span></span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Error summary */}
                    {errors.length > 0 && (
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm">
                            <div className="font-semibold text-red-300 mb-2">Please fix the following</div>
                            <ul className="list-disc pl-5 space-y-1 text-red-200">
                                {errors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                        </div>
                    )}

                    {/* Attachments (placeholder) */}
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h2 className="text-lg font-semibold text-white mb-3">Attachments</h2>
                        <div className="text-sm text-gray-400">Upload drawings/specs here in the future. (Placeholder)
                        </div>
                    </div>
                </div>

                {/* Right: sticky summary */}
                <aside className="lg:sticky lg:top-6 space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                        <h3 className="text-base font-semibold text-white">Summary</h3>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Components</div>
                                <div className="text-lg font-semibold text-gray-100">{componentsCount}</div>
                            </div>
                            <div className="rounded-xl bg-gray-800/60 p-3 border border-white/10">
                                <div className="text-xs text-gray-400">Status</div>
                                <div className="text-lg font-semibold text-gray-100">{status}</div>
                            </div>
                            <div className="rounded-2xl bg-gray-800/60 p-3 border border-white/10 col-span-2">
                                <div className="text-xs text-gray-400">Parent Item</div>
                                <div className="text-sm text-gray-200 min-h-[20px]">
                                    {parentItem ? `${parentItem.id} — ${parentItem.name}` :
                                        <span className="text-gray-500">(not set)</span>}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4 text-xs text-gray-400">
                        <div className="font-semibold text-gray-300 mb-2">Tips</div>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Use the row “Pick” button to search and select component items.</li>
                            <li>Default UoM is prefilled from the selected component when available.</li>
                            <li>Keep notes concise and actionable.</li>
                        </ul>
                    </div>
                </aside>
            </section>

            {/* Confirm leave */}
            <Modal
                open={openConfirmLeave}
                onClose={() => setOpenConfirmLeave(false)}
                title="Discard unsaved changes?"
                footer={
                    <>
                        <button
                            onClick={() => setOpenConfirmLeave(false)}
                            className="w-28 px-3 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm"
                        >
                            Stay
                        </button>
                        <button
                            onClick={() => navigate("/boms")}
                            className="w-28 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
                        >
                            Discard & Leave
                        </button>
                    </>
                }
            >
                <div className="text-gray-300">If you leave, your latest unsaved edits will be lost.</div>
            </Modal>

            {/* Parent picker */}
            <ItemPickerModal
                open={openParentPicker}
                onClose={() => setOpenParentPicker(false)}
                title="Select Parent Item"
                items={MOCK_ITEMS}
                onPick={(it) => {
                    setParentItemId(it.id);
                    setOpenParentPicker(false);
                }}
            />

            {/* Component picker (targeted row) */}
            <ItemPickerModal
                open={openComponentPicker.open}
                onClose={() => setOpenComponentPicker({open: false, rowKey: null})}
                title="Select Component Item"
                items={MOCK_ITEMS}
                onPick={(it) => {
                    if (openComponentPicker.rowKey) {
                        updateRow(openComponentPicker.rowKey, {itemId: it.id, uom: it.uom});
                    }
                    setOpenComponentPicker({open: false, rowKey: null});
                }}
            />
        </div>
    );
}

export {BOMDetailsPage};