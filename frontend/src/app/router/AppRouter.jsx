import {Route, Routes} from "react-router-dom";
import {ProtectedLayout} from "../routes/ProtectedLayout";
import {PublicLayout} from "../routes/PublicLayout";
import {BOMDetailsRoute} from "../../features/boms/pages/BOMDetailsRoute";
import {BOMsRoute} from "../../features/boms/pages/BOMsRoute";
import {CalendarRoute} from "../../features/calendar/pages/CalendarRoute";
import {DashboardRoute} from "../../features/erp/pages/DashboardRoute";
import {ModulePlaceholderRoute} from "../../features/erp/pages/ModulePlaceholderRoute";
import {SettingsRoute} from "../../features/erp/pages/SettingsRoute";
import {SetupWizardRoute} from "../../features/erp/pages/SetupWizardRoute";
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
                <Route path="/dashboard" element={<DashboardRoute/>}/>
                <Route path="/orders" element={<ModulePlaceholderRoute eyebrowKey="orders.eyebrow" titleKey="orders.title" descriptionKey="orders.description" ctaTo="/inventory" ctaLabelKey="orders.cta" highlights={[{titleKey: "orders.highlight.one.title", descriptionKey: "orders.highlight.one.description"}, {titleKey: "orders.highlight.two.title", descriptionKey: "orders.highlight.two.description"}, {titleKey: "orders.highlight.three.title", descriptionKey: "orders.highlight.three.description"}, {titleKey: "orders.highlight.four.title", descriptionKey: "orders.highlight.four.description"}]}/>}/>
                <Route path="/production" element={<ModulePlaceholderRoute eyebrowKey="production.eyebrow" titleKey="production.title" descriptionKey="production.description" ctaTo="/work-items" ctaLabelKey="production.cta" highlights={[{titleKey: "production.highlight.one.title", descriptionKey: "production.highlight.one.description"}, {titleKey: "production.highlight.two.title", descriptionKey: "production.highlight.two.description"}, {titleKey: "production.highlight.three.title", descriptionKey: "production.highlight.three.description"}, {titleKey: "production.highlight.four.title", descriptionKey: "production.highlight.four.description"}]}/>}/>
                <Route path="/calendar" element={<CalendarRoute/>}/>
                <Route path="/deliveries" element={<ModulePlaceholderRoute eyebrowKey="deliveries.eyebrow" titleKey="deliveries.title" descriptionKey="deliveries.description" ctaTo="/dashboard" ctaLabelKey="deliveries.cta" highlights={[{titleKey: "deliveries.highlight.one.title", descriptionKey: "deliveries.highlight.one.description"}, {titleKey: "deliveries.highlight.two.title", descriptionKey: "deliveries.highlight.two.description"}, {titleKey: "deliveries.highlight.three.title", descriptionKey: "deliveries.highlight.three.description"}, {titleKey: "deliveries.highlight.four.title", descriptionKey: "deliveries.highlight.four.description"}]}/>}/>
                <Route path="/items" element={<ItemsRoute/>}/>
                <Route path="/items/new" element={<ItemDetailsRoute/>}/>
                <Route path="/items/:id/edit" element={<ItemDetailsRoute/>}/>
                <Route path="/boms" element={<BOMsRoute/>}/>
                <Route path="/boms/new" element={<BOMDetailsRoute/>}/>
                <Route path="/boms/:id/edit" element={<BOMDetailsRoute/>}/>
                <Route path="/inventory" element={<InventoryRoute/>}/>
                <Route path="/inventory/new" element={<InventoryDetailsRoute/>}/>
                <Route path="/inventory/:routeItemId/edit" element={<InventoryDetailsRoute/>}/>
                <Route path="/menu" element={<ModulePlaceholderRoute eyebrowKey="menu.eyebrow" titleKey="menu.title" descriptionKey="menu.description" ctaTo="/items" ctaLabelKey="menu.cta" highlights={[{titleKey: "menu.highlight.one.title", descriptionKey: "menu.highlight.one.description"}, {titleKey: "menu.highlight.two.title", descriptionKey: "menu.highlight.two.description"}, {titleKey: "menu.highlight.three.title", descriptionKey: "menu.highlight.three.description"}, {titleKey: "menu.highlight.four.title", descriptionKey: "menu.highlight.four.description"}]}/>}/>
                <Route path="/procurement" element={<ModulePlaceholderRoute eyebrowKey="procurement.eyebrow" titleKey="procurement.title" descriptionKey="procurement.description" ctaTo="/inventory" ctaLabelKey="procurement.cta" highlights={[{titleKey: "procurement.highlight.one.title", descriptionKey: "procurement.highlight.one.description"}, {titleKey: "procurement.highlight.two.title", descriptionKey: "procurement.highlight.two.description"}, {titleKey: "procurement.highlight.three.title", descriptionKey: "procurement.highlight.three.description"}, {titleKey: "procurement.highlight.four.title", descriptionKey: "procurement.highlight.four.description"}]}/>}/>
                <Route path="/reports" element={<ModulePlaceholderRoute eyebrowKey="reports.eyebrow" titleKey="reports.title" descriptionKey="reports.description" ctaTo="/dashboard" ctaLabelKey="reports.cta" highlights={[{titleKey: "reports.highlight.one.title", descriptionKey: "reports.highlight.one.description"}, {titleKey: "reports.highlight.two.title", descriptionKey: "reports.highlight.two.description"}, {titleKey: "reports.highlight.three.title", descriptionKey: "reports.highlight.three.description"}, {titleKey: "reports.highlight.four.title", descriptionKey: "reports.highlight.four.description"}]}/>}/>
                <Route path="/settings" element={<SettingsRoute/>}/>
                <Route path="/settings/setup" element={<SetupWizardRoute/>}/>
                <Route path="/tables" element={<ModulePlaceholderRoute eyebrowKey="tables.eyebrow" titleKey="tables.title" descriptionKey="tables.description" ctaTo="/orders" ctaLabelKey="tables.cta" highlights={[{titleKey: "tables.highlight.one.title", descriptionKey: "tables.highlight.one.description"}, {titleKey: "tables.highlight.two.title", descriptionKey: "tables.highlight.two.description"}, {titleKey: "tables.highlight.three.title", descriptionKey: "tables.highlight.three.description"}, {titleKey: "tables.highlight.four.title", descriptionKey: "tables.highlight.four.description"}]}/>}/>
                <Route path="/work-items" element={<WorkItemsRoute/>}/>
            </Route>

            <Route element={<PublicLayout/>}>
                <Route path="*" element={<NotFoundRoute/>}/>
            </Route>
        </Routes>
    );
}
