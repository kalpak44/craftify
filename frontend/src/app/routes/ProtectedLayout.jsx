import {Outlet} from "react-router-dom";
import {AuthenticationGuard} from "../../components/authentication-guard/AuthenticationGuard";
import {PreferencesGate} from "./PreferencesGate";
import {ErpShell} from "../../shared/ui/templates/ErpShell";

export function ProtectedLayout() {
    return (
        <AuthenticationGuard>
            <PreferencesGate>
                <ErpShell>
                    <Outlet/>
                </ErpShell>
            </PreferencesGate>
        </AuthenticationGuard>
    );
}
