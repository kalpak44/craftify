import {Outlet} from "react-router-dom";
import {AuthenticationGuard} from "../../components/authentication-guard/AuthenticationGuard";
import {AppShell} from "../../shared/ui/templates/AppShell";

export function ProtectedLayout() {
    return (
        <AuthenticationGuard>
            <AppShell>
                <Outlet/>
            </AppShell>
        </AuthenticationGuard>
    );
}
