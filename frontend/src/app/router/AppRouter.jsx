import {Route, Routes} from "react-router-dom";
import {ProtectedLayout} from "../routes/ProtectedLayout";
import {PublicLayout} from "../routes/PublicLayout";
import {BOMDetailsRoute} from "../../features/boms/pages/BOMDetailsRoute";
import {BOMsRoute} from "../../features/boms/pages/BOMsRoute";
import {CalendarRoute} from "../../features/calendar/pages/CalendarRoute";
import {CallbackRoute} from "../../features/system/pages/CallbackRoute";
import {HomeRoute} from "../../features/home/pages/HomeRoute";
import {InventoryDetailsRoute} from "../../features/inventory/pages/InventoryDetailsRoute";
import {InventoryRoute} from "../../features/inventory/pages/InventoryRoute";
import {ItemDetailsRoute} from "../../features/items/pages/ItemDetailsRoute";
import {ItemsRoute} from "../../features/items/pages/ItemsRoute";
import {NotFoundRoute} from "../../features/system/pages/NotFoundRoute";
import {PrivacyRoute} from "../../features/legal/pages/PrivacyRoute";
import {TermsRoute} from "../../features/legal/pages/TermsRoute";
import {WorkItemsRoute} from "../../features/work-items/pages/WorkItemsRoute";

export function AppRouter() {
    return (
        <Routes>
            <Route element={<PublicLayout/>}>
                <Route path="/" element={<HomeRoute/>}/>
                <Route path="/terms" element={<TermsRoute/>}/>
                <Route path="/privacy" element={<PrivacyRoute/>}/>
                <Route path="/callback" element={<CallbackRoute/>}/>
            </Route>

            <Route element={<ProtectedLayout/>}>
                <Route path="/calendar" element={<CalendarRoute/>}/>
                <Route path="/items" element={<ItemsRoute/>}/>
                <Route path="/items/new" element={<ItemDetailsRoute/>}/>
                <Route path="/items/:id/edit" element={<ItemDetailsRoute/>}/>
                <Route path="/boms" element={<BOMsRoute/>}/>
                <Route path="/boms/new" element={<BOMDetailsRoute/>}/>
                <Route path="/boms/:id/edit" element={<BOMDetailsRoute/>}/>
                <Route path="/inventory" element={<InventoryRoute/>}/>
                <Route path="/inventory/new" element={<InventoryDetailsRoute/>}/>
                <Route path="/inventory/:routeItemId/edit" element={<InventoryDetailsRoute/>}/>
                <Route path="/work-items" element={<WorkItemsRoute/>}/>
            </Route>

            <Route element={<PublicLayout/>}>
                <Route path="*" element={<NotFoundRoute/>}/>
            </Route>
        </Routes>
    );
}
