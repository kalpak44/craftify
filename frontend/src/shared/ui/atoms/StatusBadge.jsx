import PropTypes from "prop-types";

const TONE_CLASS_MAP = {
    teal: "bg-emerald-500/14 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    emerald: "bg-emerald-500/14 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
    amber: "bg-amber-500/14 text-amber-700 ring-amber-500/20 dark:text-amber-300",
    sky: "bg-sky-500/14 text-sky-700 ring-sky-500/20 dark:text-sky-300",
    rose: "bg-rose-500/14 text-rose-700 ring-rose-500/20 dark:text-rose-300",
    violet: "bg-violet-500/14 text-violet-700 ring-violet-500/20 dark:text-violet-300",
    slate: "bg-slate-500/14 text-slate-700 ring-slate-500/20 dark:text-slate-300",
};

export function StatusBadge({children, tone = "slate"}) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${TONE_CLASS_MAP[tone] || TONE_CLASS_MAP.slate}`}>
            {children}
        </span>
    );
}

StatusBadge.propTypes = {
    children: PropTypes.node.isRequired,
    tone: PropTypes.string,
};
