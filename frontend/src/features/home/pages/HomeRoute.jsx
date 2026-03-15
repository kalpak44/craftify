import {useAuth0} from "@auth0/auth0-react";
import {Navigate} from "react-router-dom";
import {FeatureRail} from "../../../shared/ui/organisms/FeatureRail";
import {HeroPanel} from "../../../shared/ui/organisms/HeroPanel";

export function HomeRoute() {
    const {isAuthenticated, loginWithRedirect, user} = useAuth0();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace/>;
    }

    const handlePrimaryAction = () => {
        loginWithRedirect();
    };

    const handleSecondaryAction = () => {
        loginWithRedirect({authorizationParams: {screen_hint: "signup"}});
    };

    return (
        <>
            <HeroPanel
                isAuthenticated={isAuthenticated}
                onPrimaryAction={handlePrimaryAction}
                onSecondaryAction={handleSecondaryAction}
                userName={user?.name}
            />
            <FeatureRail/>
        </>
    );
}
