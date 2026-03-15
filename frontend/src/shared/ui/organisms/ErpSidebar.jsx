import PropTypes from "prop-types";
import {NavLink} from "react-router-dom";
import {BrandMark} from "../atoms/BrandMark";
import {PRIMARY_ERP_NAV, SECONDARY_ERP_NAV} from "../../../features/erp/config/navigation";
import {useLocalization} from "../../../hooks/useLocalization";

function SidebarLink({item, compact = false, onNavigate}) {
    const {t} = useLocalization();

    return (
        <NavLink
            to={item.to}
            onClick={onNavigate}
            className={({isActive}) => `group flex items-start gap-3 rounded-3xl px-3 py-3 transition ${
                isActive
                    ? "bg-white/80 text-[var(--text-primary)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] dark:bg-white/10"
                    : "text-[var(--text-secondary)] hover:bg-white/55 hover:text-[var(--text-primary)] dark:hover:bg-white/8 dark:hover:text-white"
            }`}
        >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-black/5 text-xs font-bold tracking-[0.18em] text-[var(--text-primary)] dark:bg-white/8 dark:text-white">
                {item.shortCode}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t(item.labelKey)}</span>
                {!compact && item.descriptionKey ? (
                    <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">
                        {t(item.descriptionKey)}
                    </span>
                ) : null}
            </span>
        </NavLink>
    );
}

SidebarLink.propTypes = {
    compact: PropTypes.bool,
    item: PropTypes.shape({
        descriptionKey: PropTypes.string,
        labelKey: PropTypes.string.isRequired,
        shortCode: PropTypes.string.isRequired,
        to: PropTypes.string.isRequired,
    }).isRequired,
    onNavigate: PropTypes.func,
};

export function ErpSidebar({mobile = false, onNavigate}) {
    const {t} = useLocalization();

    return (
        <aside className={`glass-panel flex h-full flex-col ${mobile ? "p-4" : "sticky top-4 p-4"}`}>
            <div className="flex items-center gap-3 px-2 pb-4">
                <BrandMark/>
                <div className="min-w-0">
                    <p className="font-display text-lg font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                        Craftify ERP
                    </p>
                    <p className="truncate text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        {t("erp.sidebarCaption")}
                    </p>
                </div>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto pr-1">
                <section>
                    <p className="px-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                        {t("erp.primaryModules")}
                    </p>
                    <div className="mt-3 space-y-2">
                        {PRIMARY_ERP_NAV.map((item) => (
                            <SidebarLink key={item.key} item={item} onNavigate={onNavigate}/>
                        ))}
                    </div>
                </section>

                <section>
                    <p className="px-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                        {t("erp.secondaryModules")}
                    </p>
                    <div className="mt-3 space-y-2">
                        {SECONDARY_ERP_NAV.map((item) => (
                            <SidebarLink key={item.key} item={item} compact onNavigate={onNavigate}/>
                        ))}
                    </div>
                </section>
            </div>
        </aside>
    );
}

ErpSidebar.propTypes = {
    mobile: PropTypes.bool,
    onNavigate: PropTypes.func,
};
