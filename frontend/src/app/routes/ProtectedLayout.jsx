import {Outlet} from "react-router-dom";
import {AuthenticationGuard} from "../../components/authentication-guard/AuthenticationGuard";
import {ErpShell} from "../../shared/ui/templates/ErpShell";

export function ProtectedLayout() {
    return (
        <AuthenticationGuard>
            <ErpShell>
                <Outlet/>
            </ErpShell>
        </AuthenticationGuard>
    );
}
