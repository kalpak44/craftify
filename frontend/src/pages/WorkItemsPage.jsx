import React, {useEffect, useMemo, useRef, useState} from "react";

const MOCK_WORK_ITEMS = [
    {
        id: "WI-001",
        parentBomItem: "Margherita Pizza",
        bomVersion: "BOM-011 v3",
        componentsCount: 7,
        requestedAt: "2026-03-05T14:25:00Z",
        status: "Completed",
    },
    {
        id: "WI-002",
        parentBomItem: "Chicken Parmesan Pasta",
        bomVersion: "BOM-012 v5",
        componentsCount: 11,
        requestedAt: "2026-03-06T08:40:00Z",
        status: "Queued",
    },
    {
        id: "WI-003",
        parentBomItem: "Pepperoni Pizza",
        bomVersion: "BOM-013 v2",
        componentsCount: 8,
        requestedAt: "2026-03-06T09:15:00Z",
        status: "Queued",
    },
    {
        id: "WI-004",
        parentBomItem: "Veggie Pizza",
        bomVersion: "BOM-014 v4",
        componentsCount: 10,
        requestedAt: "2026-03-04T16:10:00Z",
        status: "Completed",
    },
    {
        id: "WI-005",
        parentBomItem: "Four Cheese Pizza",
        bomVersion: "BOM-015 v1",
        componentsCount: 9,
        requestedAt: "2026-03-06T10:05:00Z",
        status: "Queued",
    },
    {
        id: "WI-006",
        parentBomItem: "BBQ Chicken Pizza",
        bomVersion: "BOM-016 v2",
        componentsCount: 12,
        requestedAt: "2026-03-03T11:50:00Z",
        status: "Completed",
    },
    {
        id: "WI-007",
        parentBomItem: "Hawaiian Pizza",
        bomVersion: "BOM-017 v1",
        componentsCount: 8,
        requestedAt: "2026-03-06T11:35:00Z",
        status: "Queued",
    },
    {
        id: "WI-008",
        parentBomItem: "Truffle Mushroom Pizza",
        bomVersion: "BOM-018 v2",
        componentsCount: 10,
        requestedAt: "2026-03-02T15:20:00Z",
        status: "Completed",
    },
];

export const WorkItemsPage = () => {
    const [rows, setRows] = useState(MOCK_WORK_ITEMS);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState({key: "requestedAt", dir: "desc"});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(8);

    const [menu, setMenu] = useState(null);
    const [sheetId, setSheetId] = useState(null);
    const menuRef = useRef(null);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        let data = rows.filter((r) => {
            if (status !== "all" && r.status !== status) return false;
            if (!q) return true;
            return (
                r.id.toLowerCase().includes(q)
                || r.parentBomItem.toLowerCase().includes(q)
                || r.bomVersion.toLowerCase().includes(q)
            );
        });

        const {key, dir} = sort;
        data = [...data].sort((a, b) => {
            const av = a[key];
            const bv = b[key];
            const cmp =
                key === "componentsCount"
                    ? Number(av) - Number(bv)
                    : String(av).localeCompare(String(bv), undefined, {numeric: true, sensitivity: "base"});
            return dir === "asc" ? cmp : -cmp;
        });
        return data;
    }, [query, rows, status, sort]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / Math.max(1, pageSize)));
    const pageStart = (page - 1) * pageSize;
    const paged = filtered.slice(pageStart, pageStart + pageSize);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const closeDesktopMenu = () => setMenu(null);

    useEffect(() => {
        const onDocClick = (ev) => {
            if (!menuRef.current) return;
            if (!menuRef.current.contains(ev.target)) closeDesktopMenu();
        };
        const onEsc = (ev) => {
            if (ev.key === "Escape") {
                closeDesktopMenu();
                setSheetId(null);
            }
        };
        if (menu) {
            document.addEventListener("mousedown", onDocClick);
            document.addEventListener("keydown", onEsc);
            window.addEventListener("resize", closeDesktopMenu);
            window.addEventListener("scroll", closeDesktopMenu, true);
        }
        return () => {
            document.removeEventListener("mousedown", onDocClick);
            document.removeEventListener("keydown", onEsc);
            window.removeEventListener("resize", closeDesktopMenu);
            window.removeEventListener("scroll", closeDesktopMenu, true);
        };
    }, [menu]);

    const th = (label, key, right = false) => (
        <th
            onClick={() => setSort((s) => ({key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc"}))}
            className={`px-4 py-3 font-semibold text-slate-700 dark:text-gray-300 select-none cursor-pointer ${right ? "text-right" : "text-left"}`}
        >
      <span className="inline-flex items-center gap-1">
        {label}
          {sort.key === key && <span className="text-slate-600 dark:text-gray-500">{sort.dir === "asc" ? "▲" : "▼"}</span>}
      </span>
        </th>
    );

    const formatRequestedAt = (v) => {
        if (!v) return "";
        const d = new Date(v);
        return Number.isNaN(d.getTime())
            ? v
            : new Intl.DateTimeFormat(undefined, {
                dateStyle: "short",
                timeStyle: "short",
            }).format(d);
    };

    const openDesktopMenu = (e, id) => {
        e.stopPropagation();
        const rect = e.currentTarget.getBoundingClientRect();
        const x = Math.max(8, rect.right - 210);
        const y = rect.bottom + 6;
        setMenu({id, x, y});
    };

    const completeRequest = (id) => {
        const nowIso = new Date().toISOString();
        setRows((prev) => prev.map((r) => (r.id === id ? {...r, status: "Completed", requestedAt: nowIso} : r)));
    };

    const cancelRequest = (id) => {
        setRows((prev) => prev.filter((r) => r.id !== id));
    };

    const openAllocations = (id) => {
        alert(`Allocations for ${id}`);
    };

    const openReport = (id) => {
        alert(`Report for ${id}`);
    };

    const MenuItems = ({id, onDone}) => {
        const row = rows.find((r) => r.id === id);
        const isCompleted = row?.status === "Completed";

        return (
            <div className="py-1">
                <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-gray-800"
                    onClick={(e) => {
                        e.stopPropagation();
                        openAllocations(id);
                        onDone?.();
                    }}
                >
                    Allocations
                </button>
                <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-gray-800"
                    onClick={(e) => {
                        e.stopPropagation();
                        openReport(id);
                        onDone?.();
                    }}
                >
                    Report
                </button>
                <div className="my-1 border-t border-slate-200 dark:border-white/10"/>
                <button
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={(e) => {
                        e.stopPropagation();
                        completeRequest(id);
                        onDone?.();
                    }}
                    disabled={isCompleted}
                >
                    Complete Request
                </button>
                <div className="my-1 border-t border-slate-200 dark:border-white/10"/>
                <button
                    className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-950/30 hover:text-red-400"
                    onClick={(e) => {
                        e.stopPropagation();
                        cancelRequest(id);
                        onDone?.();
                    }}
                >
                    Cancel Request
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-full text-slate-900 dark:text-gray-200">
            <header className="mx-auto px-4 pt-8 pb-5">
                <div className="flex items-start md:items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Work Items</h1>
                        <p className="mt-1 md:mt-2 text-slate-500 dark:text-gray-400 text-sm md:text-base">
                            Track work items that use a specific BOM version.
                        </p>
                    </div>
                </div>
            </header>

            <div className="mx-auto px-4 pb-4">
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-3 md:p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <select
                            value={status}
                            onChange={(e) => {
                                setStatus(e.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Completed">Completed</option>
                            <option value="Queued">Queued</option>
                        </select>

                        <div className="relative flex-1">
                            <input
                                placeholder="Search Work Item, Parent BOM Item, or BOM Version…"
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 pl-3 pr-10 py-2 text-sm"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 dark:text-gray-500">⌕</span>
                        </div>
                    </div>
                </div>
            </div>

            <section className="mx-auto px-4 pb-12">
                <div className="md:hidden space-y-2">
                    {paged.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-3"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="font-mono text-slate-900 dark:text-white text-sm">{item.id}</div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`px-2 py-0.5 text-[10px] rounded-full whitespace-nowrap ${
                                            item.status === "Completed"
                                                ? "bg-green-600/30 text-green-400"
                                                : "bg-yellow-600/30 text-yellow-400"
                                        }`}
                                    >
                                        {item.status}
                                    </span>
                                    <button
                                        className="shrink-0 px-2 py-1 rounded-md hover:bg-slate-100/70 dark:hover:bg-gray-800/60 text-slate-700 dark:text-gray-300"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSheetId(item.id);
                                        }}
                                        aria-label="Actions"
                                        title="Actions"
                                    >
                                        …
                                    </button>
                                </div>
                            </div>
                            <div className="mt-2 text-sm text-slate-900 dark:text-gray-200">{item.parentBomItem}</div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-gray-400 flex flex-wrap items-center gap-2">
                                <span>{item.bomVersion}</span>
                                <span>•</span>
                                <span>{item.componentsCount} components</span>
                                <span>•</span>
                                <span>requested_at: {formatRequestedAt(item.requestedAt)}</span>
                            </div>
                        </div>
                    ))}
                    {paged.length === 0 && (
                        <div
                            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 p-6 text-center text-slate-500 dark:text-gray-400"
                        >
                            No work items found.
                        </div>
                    )}
                </div>

                <div className="hidden md:block overflow-x-auto border border-slate-200 dark:border-white/10 rounded-xl bg-white/80 dark:bg-gray-900/60">
                    <table className="min-w-full divide-y divide-gray-800 text-sm">
                        <thead className="bg-slate-100/80 dark:bg-gray-900/80">
                        <tr>
                            {th("Work Item", "id")}
                            {th("Parent BOM Item", "parentBomItem")}
                            {th("BOM Version", "bomVersion")}
                            {th("Components Count", "componentsCount", true)}
                            {th("Requested At", "requestedAt")}
                            {th("Status", "status")}
                            <th className="px-4 py-3 font-semibold text-slate-700 dark:text-gray-300 text-right">Options</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                        {paged.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-100/60 dark:hover:bg-gray-800/40 transition">
                                <td className="px-4 py-3 font-mono text-slate-900 dark:text-white">{item.id}</td>
                                <td className="px-4 py-3 text-slate-900 dark:text-gray-200">{item.parentBomItem}</td>
                                <td className="px-4 py-3 text-slate-500 dark:text-gray-400">{item.bomVersion}</td>
                                <td className="px-4 py-3 text-right text-slate-900 dark:text-gray-200">{item.componentsCount}</td>
                                <td className="px-4 py-3 text-slate-500 dark:text-gray-400">{formatRequestedAt(item.requestedAt)}</td>
                                <td className="px-4 py-3">
                  <span
                      className={`px-2 py-1 text-xs rounded-full ${
                          item.status === "Completed"
                              ? "bg-green-600/30 text-green-400"
                              : "bg-yellow-600/30 text-yellow-400"
                      }`}
                  >
                    {item.status}
                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-100/70 dark:hover:bg-gray-800/60 text-slate-700 dark:text-gray-300"
                                        aria-label="Options"
                                        title="Options"
                                        onClick={(e) => openDesktopMenu(e, item.id)}
                                    >
                                        …
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {paged.length === 0 && (
                            <tr>
                                <td className="px-4 py-6 text-center text-slate-500 dark:text-gray-400" colSpan={7}>
                                    No work items found.
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-slate-500 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                        <span>Rows per page</span>
                        <select
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(Number(e.target.value));
                                setPage(1);
                            }}
                            className="rounded bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 px-2 py-1"
                        >
                            {[8, 16, 24].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                        <span className="hidden sm:inline">•</span>
                        <span>
              Showing <span className="text-slate-700 dark:text-gray-300">{filtered.length === 0 ? 0 : pageStart + 1}</span>–
                            <span className="text-slate-700 dark:text-gray-300">{Math.min(filtered.length, pageStart + pageSize)}</span> of
                            <span className="text-slate-700 dark:text-gray-300"> {filtered.length}</span>
            </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1 rounded bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 disabled:opacity-40"
                        >
                            Prev
                        </button>
                        <span className="px-2">
              {page} / {totalPages}
            </span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="px-3 py-1 rounded bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </section>

            {menu && (
                <div
                    ref={menuRef}
                    className="fixed z-50 min-w-[210px] rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 shadow-2xl"
                    style={{left: `${menu.x}px`, top: `${menu.y}px`}}
                    onClick={(e) => e.stopPropagation()}
                >
                    <MenuItems id={menu.id} onDone={closeDesktopMenu}/>
                </div>
            )}

            {sheetId && (
                <div className="fixed inset-0 z-50">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setSheetId(null)}/>
                    <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-gray-900 p-2 pt-3 shadow-2xl">
                        <div className="mx-auto h-1 w-10 rounded-full bg-white/20 mb-1.5"/>
                        <div className="px-2 pb-2">
                            <div className="text-xs text-slate-500 dark:text-gray-400 mb-2 px-1">
                                Options for <span className="font-mono text-slate-700 dark:text-gray-300">{sheetId}</span>
                            </div>
                            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 divide-y divide-white/10">
                                <MenuItems id={sheetId} onDone={() => setSheetId(null)}/>
                            </div>
                            <button
                                className="mt-2 w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-gray-800 border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-gray-700 text-sm"
                                onClick={() => setSheetId(null)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
