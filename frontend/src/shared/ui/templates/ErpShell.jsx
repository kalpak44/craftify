import PropTypes from "prop-types";
import {useEffect, useState} from "react";
import {ErpSidebar} from "../organisms/ErpSidebar";
import {ErpTopbar} from "../organisms/ErpTopbar";
import {useLocalization} from "../../../hooks/useLocalization";

export function ErpShell({children}) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const {t} = useLocalization();

    useEffect(() => {
        document.body.style.overflow = mobileOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileOpen]);

    return (
        <div className="app-shell min-h-screen">
            <div className="mesh-bg"/>
            <div className="ambient-orb ambient-orb-a"/>
            <div className="ambient-orb ambient-orb-b"/>

            <div className="relative z-10 lg:grid lg:min-h-screen lg:grid-cols-[20rem_minmax(0,1fr)] lg:gap-4 lg:px-4 lg:py-4">
                <div className="hidden lg:block">
                    <ErpSidebar/>
                </div>

                <div className="min-w-0">
                    <ErpTopbar onOpenNavigation={() => setMobileOpen(true)}/>
                    <main className="pb-16">
                        {children}
                    </main>
                </div>
            </div>

            {mobileOpen ? (
                <div className="fixed inset-0 z-50 bg-slate-950/45 px-4 py-4 lg:hidden">
                    <div className="mx-auto flex h-full max-w-sm flex-col gap-3">
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setMobileOpen(false)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-900"
                                aria-label={t("header.closeNavigation", null, "Close navigation")}
                            >
                                X
                            </button>
                        </div>
                        <div className="min-h-0 flex-1">
                            <ErpSidebar mobile onNavigate={() => setMobileOpen(false)}/>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

ErpShell.propTypes = {
    children: PropTypes.node.isRequired,
};
