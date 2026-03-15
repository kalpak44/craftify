import {useAuth0} from "@auth0/auth0-react";
import PropTypes from "prop-types";
import {Link, useLocation} from "react-router-dom";
import {Button} from "../atoms/Button";
import {LocaleSwitcher} from "../molecules/LocaleSwitcher";
import {ThemeToggle} from "../molecules/ThemeToggle";
import {useLocalization} from "../../../hooks/useLocalization";
import {findRouteMeta} from "../../../features/erp/config/navigation";

export function ErpTopbar({onOpenNavigation}) {
    const location = useLocation();
    const {t} = useLocalization();
    const {user} = useAuth0();
    const meta = findRouteMeta(location.pathname);

    return (
        <div className="sticky top-0 z-30 border-b border-white/45 bg-[color:var(--shell-bg)]/85 backdrop-blur-2xl">
            <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
                <button
                    type="button"
                    onClick={onOpenNavigation}
                    className="glass-panel inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-[var(--text-primary)] lg:hidden"
                    aria-label={t("header.openNavigation")}
                >
                    NAV
                </button>

                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                        {t("erp.workspaceLabel")}
                    </p>
                    <h1 className="truncate font-display text-xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] sm:text-2xl">
                        {t(meta.titleKey)}
                    </h1>
                    <p className="hidden max-w-2xl text-sm text-[var(--text-secondary)] md:block">
                        {t(meta.descriptionKey)}
                    </p>
                </div>

                <div className="hidden min-w-[14rem] flex-1 lg:block">
                    <label className="sr-only" htmlFor="erp-shell-search">
                        {t("erp.searchLabel")}
                    </label>
                    <input
                        id="erp-shell-search"
                        type="search"
                        placeholder={t("erp.searchPlaceholder")}
                        className="glass-panel h-11 w-full rounded-full px-4 text-sm text-[var(--text-primary)] outline-none ring-0 placeholder:text-[var(--text-muted)]"
                    />
                </div>

                <div className="hidden items-center gap-3 md:flex">
                    <LocaleSwitcher/>
                    <ThemeToggle/>
                    {meta.actionLabelKey && meta.actionTo ? (
                        <Button as={Link} to={meta.actionTo} variant="secondary">
                            {t(meta.actionLabelKey)}
                        </Button>
                    ) : null}
                    <div className="glass-panel rounded-full px-2 py-2">
                        <Link
                            to="/settings"
                            className="flex items-center gap-3 rounded-full px-2 text-left"
                        >
                            <img
                                src={user?.picture}
                                alt={user?.name || t("header.profileAlt")}
                                className="h-9 w-9 rounded-full object-cover"
                            />
                            <span className="hidden min-w-0 text-sm xl:block">
                                <span className="block truncate font-semibold text-[var(--text-primary)]">
                                    {user?.name || t("header.userFallback")}
                                </span>
                                <span className="block max-w-40 truncate text-xs text-[var(--text-muted)]">
                                    {user?.email}
                                </span>
                            </span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

ErpTopbar.propTypes = {
    onOpenNavigation: PropTypes.func.isRequired,
};
