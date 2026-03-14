import PropTypes from "prop-types";
import Loading from "../../assets/loader.svg?react";
import {useLocalization} from "../../hooks/useLocalization";

export const Loader = ({text}) => {
    const {t} = useLocalization();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[color:var(--shell-bg)]/88 backdrop-blur-2xl">
            <div className="glass-panel flex flex-col items-center px-8 py-7 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-strong)]/10">
                    <Loading className="h-8 w-8 animate-spin text-[var(--accent-strong)] dark:text-[var(--accent)]"/>
                </div>
                <span className="mt-4 font-display text-lg font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
                    {text ?? t("common.loading")}
                </span>
                <span className="mt-1 text-sm text-[var(--text-muted)]">
                    {t("common.preparingWorkspace")}
                </span>
            </div>
        </div>
    );
};

Loader.propTypes = {
    text: PropTypes.string,
};
