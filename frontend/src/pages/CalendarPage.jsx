import React, {useMemo, useState} from "react";

/**
 * CalendarPage — ERP-aligned (Tailwind-only, raw JS)
 *
 * - Header with title & description (aligned with other pages).
 * - Single "+ Create" button (header only). Toolbar shows Today/Prev/Next and a right-aligned "Upcoming" list.
 * - Day, Week, Month, Year views.
 * - Add Event modal + validation modal (no alerts).
 * - Pure JS date math, no external libs. Mock data in component state.
 */

export default function CalendarPage() {
    // ---------- Helpers (declared before use) ----------
    function toLocalInput(d) {
        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
            d.getMinutes()
        )}`;
    }

    function parseLocal(s) {
        return s ? new Date(s) : new Date();
    }

    function getEmptyDraft(d) {
        const start = new Date(d);
        start.setMinutes(0, 0, 0);
        const end = new Date(start);
        end.setHours(end.getHours() + 1);
        return {
            title: "",
            start: toLocalInput(start),
            end: toLocalInput(end),
            color: "indigo",
            calendar: "General",
            location: "",
            description: ""
        };
    }

    // ---------- Mocked Events ----------
    const initialEvents = [
        {
            id: "e-1001",
            title: "Line Changeover",
            start: "2025-09-1T09:00",
            end: "2025-02-20T11:30",
            color: "indigo",
            calendar: "Production",
            location: "Line A",
            description: "Swap tooling and run trial lot."
        },
        {
            id: "e-1002",
            title: "BOM Review",
            start: "2025-02-21T13:00",
            end: "2025-02-21T14:00",
            color: "emerald",
            calendar: "Engineering",
            location: "Room 3",
            description: "Rev D → Rev E deltas."
        },
        {
            id: "e-1003",
            title: "Supplier Call",
            start: "2025-02-21T16:00",
            end: "2025-02-21T16:45",
            color: "orange",
            calendar: "Supply Chain",
            location: "Meet",
            description: "Lead times and alt vendors."
        },
        {
            id: "e-1004",
            title: "Maintenance Window",
            start: "2025-02-22T22:00",
            end: "2025-02-23T02:00",
            color: "rose",
            calendar: "Maintenance",
            location: "Plant",
            description: "Planned downtime."
        },
        {
            id: "e-1005",
            title: "Daily Standup",
            start: "2025-02-24T09:00",
            end: "2025-02-24T09:15",
            color: "sky",
            calendar: "Team",
            location: "Huddle area",
            description: "Quick sync."
        },
        {
            id: "e-1006",
            title: "Yearly Audit",
            start: "2025-03-05T10:00",
            end: "2025-03-05T12:00",
            color: "purple",
            calendar: "Quality",
            location: "HQ",
            description: "ISO 9001 surveillance."
        }
    ];

    // ---------- State ----------
    const [view, setView] = useState("year"); // 'day' | 'week' | 'month' | 'year'
    const [anchor, setAnchor] = useState(new Date());
    const [events, setEvents] = useState(initialEvents);

    // Add Event modal
    const [showAdd, setShowAdd] = useState(false);
    const [draft, setDraft] = useState(getEmptyDraft(new Date()));

    // Validation/Info modal (aligned, replaces alerts)
    const [msg, setMsg] = useState(null); // { title, message } | null

    // ---------- Constants & Utils ----------
    const WEEK_STARTS_ON = 1; // Monday
    const HOUR_HEIGHT = 48; // px per hour
    const COLORS = {
        indigo: "bg-indigo-500",
        emerald: "bg-emerald-500",
        orange: "bg-orange-500",
        rose: "bg-rose-500",
        sky: "bg-sky-500",
        purple: "bg-purple-500",
        amber: "bg-amber-500",
        teal: "bg-teal-500",
        red: "bg-red-500",
        blue: "bg-blue-500",
        pink: "bg-pink-500",
        slate: "bg-slate-500"
    };

    // Date helpers
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    const addDays = (d, n) => {
        const x = new Date(d);
        x.setDate(x.getDate() + n);
        return x;
    };
    const addMonths = (d, n) => {
        const x = new Date(d);
        x.setMonth(x.getMonth() + n);
        return x;
    };
    const addYears = (d, n) => {
        const x = new Date(d);
        x.setFullYear(x.getFullYear() + n);
        return x;
    };
    const startOfWeek = (d) => {
        const x = new Date(d);
        const day = (x.getDay() + 7 - WEEK_STARTS_ON) % 7;
        x.setDate(x.getDate() - day);
        x.setHours(0, 0, 0, 0);
        return x;
    };
    const endOfWeek = (d) => addDays(startOfWeek(d), 6);
    const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
    const isSameDay = (a, b) =>
        a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const weekdayLabels = useMemo(() => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], []);
    const monthLabel = (d) => d.toLocaleDateString(undefined, {year: "numeric", month: "long"});

    // Events
    const overlaps = (evStart, evEnd, winStart, winEnd) => {
        const s = new Date(evStart);
        const e = new Date(evEnd);
        return s < winEnd && e > winStart;
    };
    const eventsInRange = (winStart, winEnd) => events.filter((ev) => overlaps(ev.start, ev.end, winStart, winEnd));
    const eventsOnDay = (day) => {
        const ds = startOfDay(day);
        const de = endOfDay(day);
        return eventsInRange(ds, de).sort((a, b) => new Date(a.start) - new Date(b.start));
    };

    // Upcoming (right side of toolbar)
    const upcoming = useMemo(() => {
        const now = new Date();
        return [...events]
            .filter((e) => new Date(e.start) >= now)
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .slice(0, 3);
    }, [events]);

    // Navigation
    const goToday = () => setAnchor(new Date());
    const goPrev = () => {
        if (view === "day") setAnchor(addDays(anchor, -1));
        else if (view === "week") setAnchor(addDays(anchor, -7));
        else if (view === "month") setAnchor(addMonths(anchor, -1));
        else setAnchor(addYears(anchor, -1));
    };
    const goNext = () => {
        if (view === "day") setAnchor(addDays(anchor, +1));
        else if (view === "week") setAnchor(addDays(anchor, +7));
        else if (view === "month") setAnchor(addMonths(anchor, +1));
        else setAnchor(addYears(anchor, +1));
    };

    const openCreateFor = (startDate, durationMinutes = 60) => {
        const s = new Date(startDate);
        const e = new Date(s);
        e.setMinutes(e.getMinutes() + durationMinutes);
        setDraft({
            ...getEmptyDraft(startDate),
            start: toLocalInput(s),
            end: toLocalInput(e)
        });
        setShowAdd(true);
    };

    // ---------- Views ----------
    function DayView() {
        const dayStart = startOfDay(anchor);
        const dayEnd = endOfDay(anchor);
        const todaysEvents = eventsInRange(dayStart, dayEnd);
        const containerHeight = 24 * HOUR_HEIGHT;

        const handleGridClick = (e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const minutesFromTop = (y / containerHeight) * 24 * 60;
            const rounded = Math.floor(minutesFromTop / 30) * 30;
            const s = new Date(dayStart);
            s.setMinutes(rounded);
            openCreateFor(s, 60);
        };

        return (
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-gray-900/60">
                <div className="grid grid-cols-[64px_1fr]">
                    {/* hour gutter */}
                    <div className="bg-gray-900/70 border-r border-white/10">
                        {Array.from({length: 24}, (_, h) => (
                            <div key={h} className="h-12 px-2 text-xs text-gray-400 flex items-start justify-end pt-1">
                                {String(h).padStart(2, "0")}:00
                            </div>
                        ))}
                    </div>

                    {/* time grid */}
                    <div className="relative" style={{height: containerHeight}} onClick={handleGridClick}>
                        {Array.from({length: 24}, (_, h) => (
                            <div key={h} className="absolute left-0 right-0 border-t border-white/5"
                                 style={{top: h * HOUR_HEIGHT}}/>
                        ))}

                        {/* events */}
                        {todaysEvents.map((ev) => {
                            const s = new Date(ev.start);
                            const e = new Date(ev.end);
                            const minutesStart = s.getHours() * 60 + s.getMinutes();
                            const minutesEnd = e.getHours() * 60 + e.getMinutes();
                            const top = (minutesStart / (24 * 60)) * 100;
                            const height = ((minutesEnd - minutesStart) / (24 * 60)) * 100;
                            return (
                                <div
                                    key={ev.id}
                                    className="absolute left-2 right-2 rounded-lg shadow-sm text-xs text-white p-2"
                                    style={{top: `${top}%`, height: `${height}%`}}
                                >
                                    <div
                                        className={`w-full h-full rounded-md ${COLORS[ev.color] || COLORS.slate} opacity-90 p-2`}>
                                        <div className="font-semibold truncate">{ev.title}</div>
                                        <div className="opacity-90 truncate">
                                            {formatTime(s)}–{formatTime(e)} • {ev.calendar}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    function WeekView() {
        const weekStart = startOfWeek(anchor);
        const days = Array.from({length: 7}, (_, i) => addDays(weekStart, i));
        const containerHeight = 24 * HOUR_HEIGHT;

        const handleDayGridClick = (e, dayDate) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const minutesFromTop = (y / containerHeight) * 24 * 60;
            const rounded = Math.floor(minutesFromTop / 30) * 30;
            const s = new Date(dayDate);
            s.setHours(0, 0, 0, 0);
            s.setMinutes(rounded);
            openCreateFor(s, 60);
        };

        return (
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-gray-900/60">
                {/* header row with weekdays */}
                <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))] bg-gray-900/70 border-b border-white/10">
                    <div className="h-10"/>
                    {days.map((d) => (
                        <div key={d.toISOString()}
                             className="h-10 flex items-center justify-center text-xs sm:text-sm text-gray-300">
                            <div
                                className={`flex items-baseline gap-2 ${isSameDay(d, new Date()) ? "text-white font-semibold" : ""}`}>
                                <span>{weekdayLabels[(d.getDay() + 6) % 7]}</span>
                                <span className="text-gray-400">{d.getDate()}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]">
                    {/* hour gutter */}
                    <div className="bg-gray-900/70 border-r border-white/10">
                        {Array.from({length: 24}, (_, h) => (
                            <div key={h} className="h-12 px-2 text-xs text-gray-400 flex items-start justify-end pt-1">
                                {String(h).padStart(2, "0")}:00
                            </div>
                        ))}
                    </div>

                    {/* day columns */}
                    {days.map((day) => {
                        const dayStart = startOfDay(day);
                        const dayEnd = endOfDay(day);
                        const dayEvents = eventsInRange(dayStart, dayEnd);
                        return (
                            <div
                                key={day.toISOString()}
                                className="relative border-l border-white/10"
                                style={{height: containerHeight}}
                                onClick={(e) => handleDayGridClick(e, day)}
                            >
                                {Array.from({length: 24}, (_, h) => (
                                    <div key={h} className="absolute left-0 right-0 border-t border-white/5"
                                         style={{top: h * HOUR_HEIGHT}}/>
                                ))}
                                {dayEvents.map((ev) => {
                                    const s = new Date(ev.start);
                                    const e = new Date(ev.end);
                                    const minsStart = s.getHours() * 60 + s.getMinutes();
                                    const minsEnd = e.getHours() * 60 + e.getMinutes();
                                    const top = (minsStart / (24 * 60)) * 100;
                                    const height = ((minsEnd - minsStart) / (24 * 60)) * 100;
                                    return (
                                        <div
                                            key={ev.id}
                                            className="absolute left-1 right-1 rounded-md shadow-sm text-[11px] text-white p-1.5"
                                            style={{top: `${top}%`, height: `${height}%`}}
                                        >
                                            <div
                                                className={`w-full h-full rounded ${COLORS[ev.color] || COLORS.slate} opacity-90 p-1.5`}>
                                                <div className="font-semibold truncate">{ev.title}</div>
                                                <div className="opacity-90 truncate">
                                                    {formatTime(s)}–{formatTime(e)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    function MonthView() {
        const firstOfMonth = startOfMonth(anchor);
        const firstGridDay = startOfWeek(firstOfMonth);
        const days = Array.from({length: 42}, (_, i) => addDays(firstGridDay, i)); // 6 weeks
        const isOutside = (d) => d.getMonth() !== anchor.getMonth();

        const onDayDoubleClick = (d) => {
            const s = new Date(d);
            s.setHours(9, 0, 0, 0);
            openCreateFor(s, 60);
        };

        return (
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-gray-900/60">
                <div className="grid grid-cols-7 bg-gray-900/70 border-b border-white/10">
                    {weekdayLabels.map((w) => (
                        <div key={w} className="h-10 text-xs sm:text-sm text-gray-300 flex items-center justify-center">
                            {w}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-gray-800/40">
                    {days.map((d) => {
                        const evs = eventsOnDay(d);
                        return (
                            <div
                                key={d.toISOString()}
                                className={`min-h-28 bg-gray-900 p-2 hover:bg-gray-800/50 transition ${isOutside(d) ? "opacity-50" : ""} ${
                                    isSameDay(d, new Date()) ? "ring-1 ring-blue-400" : ""
                                }`}
                                onDoubleClick={() => onDayDoubleClick(d)}
                                title="Double-click to add an event"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-400">{d.getDate()}</div>
                                </div>
                                <div className="mt-1 space-y-1">
                                    {evs.slice(0, 3).map((ev) => (
                                        <div key={ev.id} className="flex items-center gap-1">
                                            <span
                                                className={`inline-block w-2 h-2 rounded ${COLORS[ev.color] || COLORS.slate}`}/>
                                            <span className="truncate text-xs text-gray-200">{ev.title}</span>
                                        </div>
                                    ))}
                                    {evs.length > 3 &&
                                        <div className="text-[11px] text-gray-400">+{evs.length - 3} more</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    function YearView() {
        const months = Array.from({length: 12}, (_, i) => new Date(anchor.getFullYear(), i, 1));
        return (
            <div className="grid md:grid-cols-3 gap-4">
                {months.map((m) => (
                    <MiniMonth key={m.getMonth()} monthDate={m} onPickDay={(d) => setAnchor(d) || setView("month")}/>
                ))}
            </div>
        );
    }

    function MiniMonth({monthDate, onPickDay}) {
        const firstGridDay = startOfWeek(startOfMonth(monthDate));
        const days = Array.from({length: 42}, (_, i) => addDays(firstGridDay, i));
        const label = monthDate.toLocaleDateString(undefined, {month: "long"});

        return (
            <div className="border border-white/10 rounded-xl overflow-hidden bg-gray-900/60">
                <div
                    className="px-3 py-2 bg-gray-900/70 border-b border-white/10 text-sm font-semibold text-white">{label}</div>
                <div className="grid grid-cols-7 text-[11px] text-gray-400 bg-gray-900/40">
                    {weekdayLabels.map((w) => (
                        <div key={w} className="px-2 py-1 text-center">
                            {w[0]}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-gray-800/40">
                    {days.map((d) => (
                        <button
                            key={d.toISOString()}
                            onClick={() => onPickDay(new Date(d.getFullYear(), d.getMonth(), d.getDate()))}
                            className={`min-h-9 bg-gray-900 hover:bg-gray-800/60 transition text-xs text-gray-300 p-1 text-center ${
                                d.getMonth() !== monthDate.getMonth() ? "opacity-40" : ""
                            } ${isSameDay(d, new Date()) ? "ring-1 ring-blue-400" : ""}`}
                            title="Open this date"
                        >
                            {d.getDate()}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ---------- Header label ----------
    const labelByView = useMemo(() => {
        if (view === "day")
            return anchor.toLocaleDateString(undefined, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            });
        if (view === "week") {
            const s = startOfWeek(anchor);
            const e = endOfWeek(anchor);
            const sameMonth = s.getMonth() === e.getMonth();
            const monthPart = sameMonth
                ? s.toLocaleDateString(undefined, {month: "long"})
                : `${s.toLocaleDateString(undefined, {month: "long"})}–${e.toLocaleDateString(undefined, {month: "long"})}`;
            return `${monthPart} ${s.getFullYear()} (week of ${s.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric"
            })})`;
        }
        if (view === "month") return monthLabel(anchor);
        return anchor.getFullYear();
    }, [view, anchor]);

    // ---------- Render ----------
    return (
        <div className="min-h-100vh bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-200">
            {/* Page header (aligned with other pages) */}
            <header className="mx-auto max-w-6xl px-4 pt-10 pb-6">
                <div className="flex items-end justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Calendar</h1>
                        <p className="mt-2 text-gray-400">Plan, schedule, and track your events.</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <ViewToggle view={view} setView={setView}/>
                        <button
                            onClick={() => {
                                setDraft(getEmptyDraft(anchor));
                                setShowAdd(true);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                        >
                            + Create
                        </button>
                    </div>
                </div>
            </header>

            {/* Toolbar (aligned card with Upcoming on the right) */}
            <div className="mx-auto max-w-6xl px-4 pb-4">
                <div className="rounded-2xl border border-white/10 bg-gray-900/60 p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex items-center gap-2">
                            <button
                                className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700"
                                onClick={goToday}
                                title="Jump to today"
                            >
                                Today
                            </button>
                            <div className="flex items-center gap-1">
                                <button
                                    className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700"
                                    onClick={goPrev}
                                    aria-label="Previous"
                                    title="Previous"
                                >
                                    ←
                                </button>
                                <button
                                    className="px-3 py-2 rounded-lg bg-gray-800 border border-white/10 text-sm hover:bg-gray-700"
                                    onClick={goNext}
                                    aria-label="Next"
                                    title="Next"
                                >
                                    →
                                </button>
                            </div>
                        </div>

                        <div className="md:ml-2 text-lg font-semibold text-white">{labelByView}</div>

                        {/* Right-side: Upcoming events to fill the space (replaces duplicate Create) */}
                        <div className="ml-auto w-full md:w-auto">
                            <div className="flex items-center gap-3 justify-between md:justify-end">
                                <span className="text-sm text-gray-400">Upcoming</span>
                                <ul className="hidden md:flex items-center gap-4">
                                    {upcoming.length > 0 ? (
                                        upcoming.map((e) => {
                                            const ds = new Date(e.start);
                                            return (
                                                <li key={e.id} className="flex items-center gap-2"
                                                    title={`${e.title} · ${formatDateTime(ds)}`}>
                                                    <span
                                                        className={`inline-block w-2.5 h-2.5 rounded-full ${COLORS[e.color] || COLORS.slate}`}/>
                                                    <span
                                                        className="text-sm text-gray-200 truncate max-w-[10rem]">{e.title}</span>
                                                    <span className="text-xs text-gray-400">{formatDateTime(ds)}</span>
                                                </li>
                                            );
                                        })
                                    ) : (
                                        <li className="text-sm text-gray-500">No upcoming events</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <main className="mx-auto max-w-6xl px-4 pb-12 space-y-4">
                {view === "day" && <DayView/>}
                {view === "week" && <WeekView/>}
                {view === "month" && <MonthView/>}
                {view === "year" && <YearView/>}
            </main>

            {/* Add Event Modal (aligned) */}
            {showAdd && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setShowAdd(false)}/>
                    <div
                        className="relative z-10 w-[95%] max-w-xl rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-xl">
                        <h2 className="text-lg font-semibold text-white">Create event</h2>
                        <form
                            className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3"
                            onSubmit={(e) => {
                                e.preventDefault();
                                const s = parseLocal(draft.start);
                                const en = parseLocal(draft.end);

                                const errors = [];
                                if (!draft.title.trim()) errors.push("Title is required.");
                                if (en <= s) errors.push("End time must be after start time.");

                                if (errors.length) {
                                    setMsg({title: "Validation error", message: errors.join(" ")});
                                    return;
                                }

                                const newEvent = {
                                    id: "e-" + Math.random().toString(36).slice(2, 9),
                                    title: draft.title.trim(),
                                    start: draft.start,
                                    end: draft.end,
                                    color: draft.color || "indigo",
                                    calendar: draft.calendar || "General",
                                    location: draft.location || "",
                                    description: draft.description || ""
                                };
                                setEvents((evs) => [...evs, newEvent]);
                                setShowAdd(false);
                            }}
                        >
                            <div className="sm:col-span-2">
                                <label className="block text-sm text-gray-300 mb-1">Title</label>
                                <input
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    value={draft.title}
                                    onChange={(e) => setDraft((d) => ({...d, title: e.target.value}))}
                                    placeholder="Event name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Start</label>
                                <input
                                    type="datetime-local"
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    value={draft.start}
                                    onChange={(e) => setDraft((d) => ({...d, start: e.target.value}))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-300 mb-1">End</label>
                                <input
                                    type="datetime-local"
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    value={draft.end}
                                    onChange={(e) => setDraft((d) => ({...d, end: e.target.value}))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Calendar</label>
                                <input
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    placeholder="e.g., Production, Team"
                                    value={draft.calendar}
                                    onChange={(e) => setDraft((d) => ({...d, calendar: e.target.value}))}
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-300 mb-1">Color</label>
                                <select
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    value={draft.color}
                                    onChange={(e) => setDraft((d) => ({...d, color: e.target.value}))}
                                >
                                    {Object.keys(COLORS).map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm text-gray-300 mb-1">Location</label>
                                <input
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    value={draft.location}
                                    onChange={(e) => setDraft((d) => ({...d, location: e.target.value}))}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-sm text-gray-300 mb-1">Description</label>
                                <textarea
                                    rows={3}
                                    className="w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-sm"
                                    value={draft.description}
                                    onChange={(e) => setDraft((d) => ({...d, description: e.target.value}))}
                                />
                            </div>

                            <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAdd(false)}
                                    className="px-4 py-2 rounded-lg bg-gray-800 border border-white/10 hover:bg-gray-700 text-sm"
                                >
                                    Cancel
                                </button>
                                <button type="submit"
                                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm">
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Validation/Info Modal (aligned, replacing alerts) */}
            {msg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setMsg(null)}/>
                    <div
                        className="relative z-10 w-[90%] max-w-md rounded-2xl border border-white/10 bg-gray-900 p-5 shadow-xl">
                        <h2 className="text-lg font-semibold text-white">{msg.title}</h2>
                        <p className="mt-2 text-sm text-gray-300">{msg.message}</p>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => setMsg(null)}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // ---------- Local subcomponents ----------
    function ViewToggle({view, setView}) {
        const btn = (v, label) => (
            <button
                onClick={() => setView(v)}
                className={`px-3 py-2 text-sm rounded-lg border ${
                    view === v ? "bg-blue-600 text-white border-blue-600" : "bg-gray-800 text-gray-200 border-white/10 hover:bg-gray-700"
                }`}
            >
                {label}
            </button>
        );
        return (
            <div className="flex gap-1">
                {btn("day", "Day")}
                {btn("week", "Week")}
                {btn("month", "Month")}
                {btn("year", "Year")}
            </div>
        );
    }

    function formatTime(d) {
        return d.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
    }

    function formatDateTime(d) {
        return d.toLocaleString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }
}
