import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * PurchasingPage — Full page with styled toolbar, filters, date ranges, and pagination
 */
export default function PurchasingPage() {
    const navigate = useNavigate?.() || ((x) => x);

    const data = [
        { id: "PO-5001", supplier: "Acme Components", orderDate: "2025-02-15", dueDate: "2025-02-22", status: "Open", lines: 2, qtyOrdered: 4000, qtyReceived: 1800, currency: "EUR", totalCost: 6800.0, lastUpdated: "2025-02-19" },
        { id: "PO-5002", supplier: "NordFab Metals", orderDate: "2025-02-16", dueDate: "2025-02-25", status: "Approved", lines: 2, qtyOrdered: 1150, qtyReceived: 150, currency: "EUR", totalCost: 9200.0, lastUpdated: "2025-02-18" },
        { id: "PO-5003", supplier: "BrightChem", orderDate: "2025-02-10", dueDate: "2025-02-18", status: "Received", lines: 1, qtyOrdered: 120, qtyReceived: 120, currency: "EUR", totalCost: 480.0, lastUpdated: "2025-02-18" },
        { id: "PO-5004", supplier: "MotionWorks", orderDate: "2025-02-05", dueDate: "2025-02-12", status: "Closed", lines: 3, qtyOrdered: 760, qtyReceived: 760, currency: "EUR", totalCost: 15120.0, lastUpdated: "2025-02-13" },
        { id: "PO-5005", supplier: "ProtoFast", orderDate: "2025-02-17", dueDate: "2025-02-20", status: "Hold", lines: 1, qtyOrdered: 50, qtyReceived: 0, currency: "EUR", totalCost: 250.0, lastUpdated: "2025-02-17" },
        { id: "PO-5006", supplier: "Acme Components", orderDate: "2025-02-01", dueDate: "2025-02-08", status: "Cancelled", lines: 4, qtyOrdered: 2100, qtyReceived: 0, currency: "EUR", totalCost: 0, lastUpdated: "2025-02-06" },
    ];

    const suppliers = useMemo(() => ["all", ...Array.from(new Set(data.map((d) => d.supplier)))], []);
    const STATUSES = ["Draft", "Open", "Approved", "Received", "Closed", "Cancelled", "Hold"];

    const [query, setQuery] = useState("");
    const [supplier, setSupplier] = useState("all");
    const [status, setStatus] = useState("all");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(8);

    const filtered = useMemo(() => {
        let rows = [...data];
        if (query) rows = rows.filter((r) => r.id.toLowerCase().includes(query.toLowerCase()) || r.supplier.toLowerCase().includes(query.toLowerCase()));
        if (supplier !== "all") rows = rows.filter((r) => r.supplier === supplier);
        if (status !== "all") rows = rows.filter((r) => r.status === status);
        if (dateFrom) rows = rows.filter((r) => r.orderDate >= dateFrom);
        if (dateTo) rows = rows.filter((r) => r.orderDate <= dateTo);
        return rows;
    }, [data, query, supplier, status, dateFrom, dateTo]);

    const totalPages = Math.ceil(filtered.length / rowsPerPage) || 1;
    const paginated = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const openNewPO = () => navigate && navigate("/purchasing/new");
    const handleRowClick = (id) => navigate && navigate(`/purchasing/${id}`);

    const STATUS_CLS = {
        Draft: "bg-blue-600/30 text-blue-300",
        Open: "bg-green-600/30 text-green-400",
        Approved: "bg-emerald-600/30 text-emerald-300",
        Received: "bg-indigo-600/30 text-indigo-300",
        Closed: "bg-gray-600/30 text-gray-400",
        Cancelled: "bg-red-600/30 text-red-300",
        Hold: "bg-yellow-600/30 text-yellow-400",
    };

    return (
        <div className="min-h-[calc(100vh-140px)] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Purchasing</h1>
                        <p className="mt-2 text-gray-400">Manage purchase orders, suppliers, and approvals.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={openNewPO} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow text-sm">+ New PO</button>
                        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl text-sm">Import CSV</button>
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className="mx-auto max-w-6xl px-4 pb-6">
                <div className="rounded-2xl border border-white/10 bg-gray-900/70 backdrop-blur-sm shadow-inner p-5 flex flex-wrap gap-4 items-center">
                    <select value={supplier} onChange={(e) => setSupplier(e.target.value)} className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm min-w-[160px]">
                        {suppliers.map((s) => <option key={s} value={s}>{s === "all" ? "All Suppliers" : s}</option>)}
                    </select>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm min-w-[160px]">
                        <option value="all">All Statuses</option>
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm" />
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm" />
                    <div className="relative flex-1 min-w-[200px]">
                        <input placeholder="Search PO ID or Supplier…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-full rounded-lg bg-gray-800 border border-white/10 pl-3 pr-10 py-2 text-sm" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">⌕</span>
                    </div>
                    <div className="flex gap-2 ml-auto">
                        <button className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700">Export CSV</button>
                        <button className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700">Excel</button>
                        <button className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700">Print / PDF</button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <section className="mx-auto max-w-6xl px-4 pb-6">
                <div className="overflow-x-auto border border-white/10 rounded-2xl bg-gray-900/60 shadow">
                    <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-gray-900/80">
                        <tr>
                            <th className="px-4 py-3 text-left">PO ID</th>
                            <th className="px-4 py-3 text-left">Supplier</th>
                            <th className="px-4 py-3 text-left">Order Date</th>
                            <th className="px-4 py-3 text-left">Due Date</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-right">Lines</th>
                            <th className="px-4 py-3 text-right">Qty Ordered</th>
                            <th className="px-4 py-3 text-right">Qty Received</th>
                            <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                        {paginated.map((po) => (
                            <tr key={po.id} className="hover:bg-gray-800/40 transition cursor-pointer" onClick={() => handleRowClick(po.id)}>
                                <td className="px-4 py-3 font-mono text-white">{po.id}</td>
                                <td className="px-4 py-3">{po.supplier}</td>
                                <td className="px-4 py-3 text-gray-400">{po.orderDate}</td>
                                <td className="px-4 py-3 text-gray-400">{po.dueDate}</td>
                                <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${STATUS_CLS[po.status]}`}>{po.status}</span></td>
                                <td className="px-4 py-3 text-right">{po.lines}</td>
                                <td className="px-4 py-3 text-right">{po.qtyOrdered}</td>
                                <td className="px-4 py-3 text-right">{po.qtyReceived}</td>
                                <td className="px-4 py-3 text-right">€{po.totalCost.toFixed(2)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                    <div className="text-sm text-gray-400">Showing {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, filtered.length)} of {filtered.length}</div>
                    <div className="flex items-center gap-2">
                        <select value={rowsPerPage} onChange={(e) => {setRowsPerPage(Number(e.target.value)); setPage(1);}} className="rounded-lg bg-gray-800 border border-white/10 px-2 py-1 text-sm">
                            {[8, 16, 24].map((n) => <option key={n} value={n}>{n}/page</option>)}
                        </select>
                        <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 rounded-lg bg-gray-800 border border-white/10 disabled:opacity-40">Prev</button>
                        <span className="text-sm text-gray-300">Page {page} of {totalPages}</span>
                        <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded-lg bg-gray-800 border border-white/10 disabled:opacity-40">Next</button>
                    </div>
                </div>
            </section>
        </div>
    );
}