import React, {useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";

/**
 * BOMsPage
 *
 * ERP-style Bill of Materials registry built with React + Tailwind (raw JS).
 * Features:
 * - Search, filter by status, sortable columns, pagination.
 * - Row selection (checkboxes) with bulk delete + confirmation modal.
 * - Consistent styling with ItemsPage (red Delete button, same modal look & feel).
 * - Each table row opens the BOM Details view at /boms/:id.
 *
 * Notes:
 * - Uses mocked data stored in component state for client-side ops.
 */
export const BOMsPage = () => {
    // --- Mocked BOMs (stateful for deletion) ---
    const initialData = [
        {
            id: "BOM-001",
            product: "Front Assembly",
            productId: "ITM-006",
            revision: "v3",
            status: "Active",
            components: 12,
            lastUpdated: "2025-02-14"
        },
        {
            id: "BOM-002",
            product: "Large Widget",
            productId: "ITM-002",
            revision: "v1",
            status: "Active",
            components: 7,
            lastUpdated: "2025-02-10"
        },
        {
            id: "BOM-003",
            product: "Assembly Kit 10",
            productId: "ITM-010",
            revision: "v5",
            status: "Obsolete",
            components: 18,
            lastUpdated: "2024-12-02"
        },
        {
            id: "BOM-004",
            product: "Steel Frame",
            productId: "ITM-007",
            revision: "v2",
            status: "Active",
            components: 9,
            lastUpdated: "2025-01-29"
        },
        {
            id: "BOM-005",
            product: "Lion Bracket",
            productId: "ITM-004",
            revision: "v1",
            status: "Draft",
            components: 5,
            lastUpdated: "2025-02-18"
        },
        {
            id: "BOM-006",
            product: "Chain Bracket",
            productId: "ITM-005",
            revision: "v4",
            status: "Active",
            components: 11,
            lastUpdated: "2025-01-12"
        },
        {
            id: "BOM-007",
            product: "Plastic Case",
            productId: "ITM-003",
            revision: "v2",
            status: "Active",
            components: 6,
            lastUpdated: "2025-02-01"
        },
        {
            id: "BOM-008",
            product: "Warm Yellow LED Kit",
            productId: "ITM-001",
            revision: "v1",
            status: "Draft",
            components: 4,
            lastUpdated: "2025-02-17"
        },
        {
            id: "BOM-009",
            product: "Blue Paint Pack",
            productId: "ITM-008",
            revision: "v3",
            status: "Hold",
            components: 3,
            lastUpdated: "2025-01-22"
        },
        {
            id: "BOM-010",
            product: "Screws Pack M3x8",
            productId: "ITM-009",
            revision: "v2",
            status: "Active",
            components: 2,
            lastUpdated: "2025-02-03"
        }
    ];

    const [rows, setRows] = useState(initialData);

    const navigate = useNavigate();
    // --- State ---
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState({key: "product", dir: "asc"});
    const [selected, setSelected] = useState({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // --- Derived rows ---
    const filtered = useMemo(() => {
        let data = rows;
        if (query) {
            const q = query.toLowerCase();
            data = data.filter(
                (r) => r.id.toLowerCase().includes(q) || r.product.toLowerCase().includes(q) || r.productId.toLowerCase().includes(q)
            );
        }
        if (status !== "all") data = data.filter((r) => r.status === status);

        const {key, dir} = sort;
        data = [...data].sort((a, b) => {
            const av = a[key];
            const bv = b[key];
            const cmp = key === "components" ? av - bv : String(av).localeCompare(String(bv), undefined, {numeric: true});
            return dir === "asc" ? cmp : -cmp;
        });
        return data;
    }, [rows, query, status, sort]);

    // --- Paging ---
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const pageStart = (page - 1) * pageSize;
    const paged = filtered.slice(pageStart, pageStart + pageSize);

    // --- Selection ---
    const selectedIds = Object.keys(selected).filter((k) => selected[k]);
    const selectedCount = selectedIds.length;

    const allOnPageSelected = paged.length > 0 && paged.every((r) => selected[r.id]);
    const toggleAll = () => {
        const next = {...selected};
        if (allOnPageSelected) paged.forEach((r) => delete next[r.id]);
        else paged.forEach((r) => (next[r.id] = true));
        setSelected(next);
    };
    const toggleOne = (id) => setSelected((s) => ({...s, [id]: !s[id]}));

    // --- Helpers ---
    const th = (label, key, right = false) => (
        <th
            onClick={() => setSort((s) => ({key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc"}))}
            className={`px-4 py-3 font-semibold text-gray-300 select-none cursor-pointer ${right ? "text-right" : "text-left"}`}
        >
      <span className="inline-flex items-center gap-1">
        {label}
          {sort.key === key && <span className="text-gray-500">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </span>
        </th>
    );

    // --- Row navigation (details) ---
    const goToDetails = (id) => navigate(`/boms/${encodeURIComponent(id)}/edit`);
    const stopRowNav = (e) => e.stopPropagation();

    // --- Delete modal control ---
    const openDeleteModal = () => {
        if (!selectedCount) return;
        setShowDeleteModal(true);
    };
    const confirmDelete = () => {
        if (!selectedCount) {
            setShowDeleteModal(false);
            return;
        }
        const keep = rows.filter((r) => !selectedIds.includes(r.id));
        setRows(keep);
        setSelected({});
        const newTotalPages = Math.max(1, Math.ceil(keep.length / pageSize));
        setPage((p) => Math.min(p, newTotalPages));
        setShowDeleteModal(false);
    };

    return (
        <div
            className="min-h-[calc(100vh-140px)] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Header */}
            <header className="mx-auto  px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">BOMs</h1>
                        <p className="mt-2 text-gray-400">Define and manage bill of materials.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                            onClick={() => navigate("/boms/new")}
                        >
                            + New BOM
                        </button>
                        <button
                            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-lg text-sm">
                            Import CSV
                        </button>
                    </div>
                </div>
            </header>

            {/* Toolbar */}
            <div className="mx-auto  px-4 pb-4">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Draft">Draft</option>
                            <option value="Hold">Hold</option>
                            <option value="Obsolete">Obsolete</option>
                        </select>

                        <div className="relative flex-1">
                            <input
                                placeholder="Search BOM ID, Product, or Item ID…"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full rounded-lg bg-gray-800 border border-white/10 pl-3 pr-10 py-2 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">⌕</span>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                            <button
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700">
                                Export CSV
                            </button>
                            <button
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700">
                                Print / PDF
                            </button>
                            <button
                                onClick={openDeleteModal}
                                disabled={!selectedCount}
                                className="px-3 py-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-sm disabled:opacity-40"
                                title={selectedCount ? `Delete ${selectedCount} selected` : "Select rows to delete"}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <section className="mx-auto  px-4 pb-12">
                <div className="overflow-x-auto border border-white/10 rounded-xl bg-gray-900/60">
                    <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-gray-900/80">
                        <tr>
                            <th className="px-4 py-3">
                                <input type="checkbox" checked={allOnPageSelected} onChange={toggleAll}
                                       onClick={stopRowNav}/>
                            </th>
                            {th("BOM ID", "id")}
                            {th("Product", "product")}
                            {th("Item ID", "productId")}
                            {th("Revision", "revision")}
                            {th("Status", "status")}
                            {th("# Components", "components", true)}
                            {th("Last Updated", "lastUpdated")}
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                        {paged.map((bom) => (
                            <tr
                                key={bom.id}
                                className="hover:bg-gray-800/40 transition cursor-pointer"
                                onClick={() => goToDetails(bom.id)}
                                title="Open Details"
                            >
                                <td className="px-4 py-3" onClick={stopRowNav}>
                                    <input type="checkbox" checked={!!selected[bom.id]}
                                           onChange={() => toggleOne(bom.id)}/>
                                </td>
                                <td className="px-4 py-3 font-mono text-white">
                                    <span className="underline decoration-dotted">{bom.id}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-200">{bom.product}</td>
                                <td className="px-4 py-3 text-gray-400">{bom.productId}</td>
                                <td className="px-4 py-3 text-gray-400">{bom.revision}</td>
                                <td className="px-4 py-3">
                    <span
                        className={`px-2 py-1 text-xs rounded-full ${
                            bom.status === "Active"
                                ? "bg-green-600/30 text-green-400"
                                : bom.status === "Draft"
                                    ? "bg-blue-600/30 text-blue-300"
                                    : bom.status === "Hold"
                                        ? "bg-yellow-600/30 text-yellow-400"
                                        : "bg-gray-600/30 text-gray-400"
                        }`}
                    >
                      {bom.status}
                    </span>
                                </td>
                                <td className="px-4 py-3 text-right text-gray-200">{bom.components}</td>
                                <td className="px-4 py-3 text-gray-400">{bom.lastUpdated}</td>
                            </tr>
                        ))}
                        {paged.length === 0 && (
                            <tr>
                                <td className="px-4 py-6 text-center text-gray-400" colSpan={8}>
                                    No BOMs found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div
                    className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                        <span>Rows per page</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }}
                            className="rounded bg-gray-800 border border-white/10 px-2 py-1"
                        >
                            {[8, 16, 24].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                        <span className="hidden sm:inline">•</span>
                        <span>
              Showing <span className="text-gray-300">{filtered.length === 0 ? 0 : pageStart + 1}</span>–
              <span className="text-gray-300">{Math.min(filtered.length, pageStart + pageSize)}</span> of
              <span className="text-gray-300"> {filtered.length}</span>
            </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <span className="px-2">
              {page} / {totalPages}
            </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="px-3 py-1 rounded bg-gray-800 border border-white/10 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>

            {/* Deletion Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setShowDeleteModal(false)}/>
                    <div
                        className="relative z-10 w-[90%] max-w-md rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-xl">
                        <h2 className="text-lg font-semibold text-white">Confirm deletion</h2>
                        <p className="mt-2 text-sm text-gray-300">
                            You are about to delete <span className="font-medium text-white">{selectedCount}</span>{" "}
                            {selectedCount === 1 ? "BOM" : "BOMs"}. This action cannot be undone.
                        </p>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm"
                            >
                                Cancel
                            </button>
                            <button onClick={confirmDelete}
                                    className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
