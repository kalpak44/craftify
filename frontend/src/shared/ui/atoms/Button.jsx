import PropTypes from "prop-types";

const VARIANTS = {
    primary: "bg-[var(--accent-strong)] text-white shadow-[0_18px_45px_-24px_rgba(20,184,166,0.9)] hover:bg-[var(--accent)]",
    secondary: "bg-white/75 text-[var(--text-primary)] ring-1 ring-black/5 hover:bg-white dark:bg-white/8 dark:text-white dark:ring-white/10 dark:hover:bg-white/12",
    ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/8 dark:hover:text-white",
};

const SIZES = {
    md: "h-11 px-5 text-sm",
    lg: "h-12 px-6 text-base",
};

export function Button({as: Component = "button", children, className = "", size = "md", variant = "primary", ...props}) {
    return (
        <Component
            className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-[-0.02em] transition duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent ${SIZES[size]} ${VARIANTS[variant]} ${className}`}
            {...props}
        >
            {children}
        </Component>
    );
}

Button.propTypes = {
    as: PropTypes.elementType,
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    size: PropTypes.oneOf(["md", "lg"]),
    variant: PropTypes.oneOf(["primary", "secondary", "ghost"]),
};
