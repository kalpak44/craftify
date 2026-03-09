import {Outlet} from "react-router-dom";
import {AppShell} from "../../shared/ui/templates/AppShell";

export function PublicLayout() {
    return (
        <AppShell>
            <Outlet/>
        </AppShell>
    );
}
