import {useAuth0} from "@auth0/auth0-react";
import React from "react";
import {Loader} from "./components/common/Loader";
import {AppRouter} from "./app/router/AppRouter";
import {useLocalization} from "./hooks/useLocalization";
import {clearLogoutInProgress} from "./utils/authSession";

export default function App() {
    const {isLoading, isAuthenticated} = useAuth0();
    const {t} = useLocalization();

    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            clearLogoutInProgress();
        }
    }, [isAuthenticated, isLoading]);

    if (isLoading) {
        return <Loader text={t("common.loading")}/>;
    }

    return <AppRouter/>;
}
