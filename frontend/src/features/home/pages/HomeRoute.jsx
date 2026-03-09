import {useAuth0} from "@auth0/auth0-react";
import {useNavigate} from "react-router-dom";
import {FeatureRail} from "../../../shared/ui/organisms/FeatureRail";
import {HeroPanel} from "../../../shared/ui/organisms/HeroPanel";

export function HomeRoute() {
    const navigate = useNavigate();
    const {isAuthenticated, loginWithRedirect, user} = useAuth0();

    const handlePrimaryAction = () => {
        if (isAuthenticated) {
            navigate("/items");
            return;
        }
        loginWithRedirect();
    };

    const handleSecondaryAction = () => {
        if (isAuthenticated) {
            navigate("/work-items");
            return;
        }
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
