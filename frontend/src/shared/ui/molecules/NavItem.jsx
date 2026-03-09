import PropTypes from "prop-types";
import {NavLink} from "react-router-dom";

export function NavItem({to, children, onClick, mobile = false}) {
    return (
        <NavLink
            to={to}
            end={to === "/"}
            onClick={onClick}
            className={({isActive}) =>
                mobile
                    ? `rounded-2xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                            ? "bg-[var(--accent-strong)]/15 text-[var(--text-primary)]"
                            : "text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/8"
                    }`
                    : `rounded-full px-3 py-2 text-sm font-medium transition ${
                        isActive
                            ? "bg-white/70 text-[var(--text-primary)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65)] dark:bg-white/10 dark:text-white"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/55 dark:hover:bg-white/8 dark:hover:text-white"
                    }`
            }
        >
            {children}
        </NavLink>
    );
}

NavItem.propTypes = {
    children: PropTypes.node.isRequired,
    mobile: PropTypes.bool,
    onClick: PropTypes.func,
    to: PropTypes.string.isRequired,
};
