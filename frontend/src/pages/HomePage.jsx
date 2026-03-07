// HomePage.jsx
import React from "react";
import {useAuth0 as useAuth0Home} from "@auth0/auth0-react";

export const HomePage = () => {
    const {loginWithRedirect, isAuthenticated, isLoading, user} = useAuth0Home();

    // While Auth0 loads, keep a neutral spinner
    if (isLoading) {
        return (
            <div
                className="min-h-[60vh] bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-slate-900 dark:text-gray-200 flex items-center justify-center">
                <div className="animate-pulse text-slate-500 dark:text-gray-400">Loading…</div>
            </div>
        );
    }

    // If signed in, show a simple greeting page
    if (isAuthenticated) {
        return (
            <div className="min-h-[70vh] bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-slate-900 dark:text-gray-200 flex items-center justify-center">
                <section className="mx-auto max-w-4xl px-4 py-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                        Welcome back{user?.name ? `, ${user.name}` : ""}.
                    </h1>
                    <p className="mt-3 text-base md:text-lg text-slate-500 dark:text-gray-400">
                        Have a productive day in Craftify.
                    </p>
                </section>
            </div>
        );
    }

    // Otherwise, show the current marketing home
    const features = [
        {
            title: "Inventory Control",
            description:
                "Track stock, bins, lots with real-time availability & low-stock alerts.",
            icon: (
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                    <path
                        fill="currentColor"
                        d="M3 7l9-4 9 4v10l-9 4-9-4V7zm9-2.2L6 7l6 2.7L18 7 12 4.8zm7 5.1l-7 3.2-7-3.2v5.3l7 3.2 7-3.2V9.9z"
                    />
                </svg>
            ),
        },
        {
            title: "BOM Management",
            description:
                "Define product structures and component requirements in one place.",
            icon: (
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                    <path fill="currentColor" d="M7 3h10a2 2 0 012 2v14l-7-3-7 3V5a2 2 0 012-2z"/>
                </svg>
            ),
        },
        {
            title: "Production Tracking",
            description:
                "Log operations, yield, and scrap from tablets on the shop floor.",
            icon: (
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                    <path fill="currentColor" d="M4 4h16v10H4zM2 16h20v2H2z"/>
                </svg>
            ),
        },
        {
            title: "Purchasing & Receiving",
            description:
                "Reorder suggestions, PO approvals, and barcode receiving.",
            icon: (
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                    <path fill="currentColor" d="M20 6H4l2 12h12l2-12zM7 6l2-2h6l2 2"/>
                </svg>
            ),
        },
        {
            title: "Rules & Automations",
            description:
                "Trigger flows when forms submit: allocate parts, post entries, notify teams.",
            icon: (
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                    <path fill="currentColor" d="M12 2l3 6h6l-4.5 4 1.5 6-6-3.5L6 18l1.5-6L3 8h6z"/>
                </svg>
            ),
        },
        {
            title: "Dashboards & KPIs",
            description:
                "Visualize throughput, OTIF, and inventory turns with simple widgets.",
            icon: (
                <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
                    <path fill="currentColor" d="M3 13h4v8H3v-8zm7-6h4v14h-4V7zm7 9h4v5h-4v-5z"/>
                </svg>
            ),
        },
    ];

    return (
        <div
            className="bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-slate-900 dark:text-gray-200">
            <header className="mx-auto max-w-6xl px-4 pt-14 pb-10 text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Lightweight ERP for Inventory & Manufacturing
                </h1>
                <p className="mt-4 text-base md:text-lg text-slate-500 dark:text-gray-400 max-w-2xl mx-auto">
                    Craftify keeps your stock, BOMs, and shop-floor operations in
                    sync—without the complexity. Forms in, logic runs, clean APIs out.
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                    <button
                        onClick={() => loginWithRedirect()}
                        className="rounded-2xl px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-base"
                    >
                        Get started free
                    </button>
                    <button
                        onClick={() => loginWithRedirect({authorizationParams: {screen_hint: "signup"}})}
                        className="rounded-2xl px-6 py-3 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 dark:hover:bg-gray-700 border border-slate-200 dark:border-white/10 text-base"
                    >
                        Create an account
                    </button>
                </div>
            </header>

            <section className="mx-auto max-w-6xl px-4 pb-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((f) => (
                        <div
                            key={f.title}
                            className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-gray-900/60 h-full p-5 hover:border-slate-300 dark:hover:border-white/20 transition"
                        >
                            <div className="flex items-center gap-3 pb-2">
                                <div
                                    className="p-2 rounded-xl bg-slate-100 dark:bg-gray-800 text-blue-700 dark:text-blue-300">
                                    {f.icon}
                                </div>
                                <div className="text-slate-900 dark:text-white text-lg font-semibold">{f.title}</div>
                            </div>
                            <p className="text-sm text-slate-500 dark:text-gray-400">{f.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 pb-20">
                <div
                    className="rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-r from-blue-50 via-white to-slate-100 dark:from-gray-900 dark:to-gray-800 p-8 md:p-10 text-center">
                    <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 dark:text-white">
                        Launch your first production flow in minutes
                    </h2>
                    <p className="mt-2 text-slate-500 dark:text-gray-400 max-w-3xl mx-auto">
                        Start with a CSV of items, add a BOM, and go from quote to shipment.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <a
                            href="/getting-started"
                            className="rounded-2xl px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Open Getting Started
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
