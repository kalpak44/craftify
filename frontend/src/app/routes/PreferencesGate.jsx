import PropTypes from "prop-types";
import {Navigate, useLocation} from "react-router-dom";
import {Loader} from "../../components/common/Loader";
import {useLocalization} from "../../hooks/useLocalization";
import {useUserPreferences} from "../../hooks/useUserPreferences";

export function PreferencesGate({children}) {
    const location = useLocation();
    const {t} = useLocalization();
    const {isReady, preferences, status} = useUserPreferences();

    if (!isReady) {
        return <Loader text={t("common.preparingWorkspace")}/>;
    }

    if (status !== "error" && !preferences.onboardingCompleted && location.pathname !== "/settings/setup") {
        return <Navigate to="/settings/setup" replace state={{from: location.pathname}}/>;
    }

    return children;
}

PreferencesGate.propTypes = {
    children: PropTypes.node.isRequired,
};
