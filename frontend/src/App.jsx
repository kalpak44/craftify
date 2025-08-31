import React from "react";
import {Route, Routes} from "react-router-dom";
import {useAuth0} from "@auth0/auth0-react";
import {Loader} from "./components/common/Loader";
import {FullWidthLayout} from "./components/page-layout/FullWidthLayout";
import {HomePage} from "./pages/HomePage";
import {TermsPage} from "./pages/TermsPage";
import {PrivacyPage} from "./pages/PrivacyPage";
import {CallbackPage} from "./pages/CallbackPage";
import {NotFoundPage} from "./pages/NotFoundPage";
import {AuthenticationGuard} from "./components/authentication-guard/AuthenticationGuard.jsx";
import {ItemsPage} from "./pages/ItemsPage.jsx";
import {BOMsPage} from "./pages/BOMsPage.jsx";
import BOMCreationPage from "./pages/BOMCreationPage.jsx";
import WorkOrdersPage from "./pages/WorkOrdersPage.jsx";
import WorkOrderCreationPage from "./pages/WorkOrderCreationPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import InventoryTransferPage from "./pages/InventoryTransferPage.jsx";
import InventoryAdjustPage from "./pages/InventoryAdjustPage.jsx";
import InventoryReceivePage from "./pages/InventoryReceivePage.jsx";
import PurchasingPage from "./pages/PurchasingPage.jsx";
import POCreationPage from "./pages/POCreationPage.jsx";
import ItemDetailsPage from "./pages/ItemDetailsPage.jsx";
import ProductionPage from "./pages/ProductionPage.jsx";
import WorkOrderOperationsPage from "./pages/WorkOrderOperationsPage.jsx";
import WorkOrderOperationsCreationPage from "./pages/WorkOrderOperationsCreationPage.jsx";

export default function App() {
    const {isLoading} = useAuth0();
    if (isLoading) {
        return (
            <div className="page-layout">
                <Loader/>
            </div>
        );
    }
    return (
        <Routes>
            <Route
                path="/"
                element={
                    <FullWidthLayout>
                        <HomePage/>
                    </FullWidthLayout>
                }
            />

            <Route path="/items" element={
                <AuthenticationGuard>
                    <FullWidthLayout><ItemsPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route path="/items/:id/edit" element={
                <AuthenticationGuard>
                    <FullWidthLayout><ItemDetailsPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route path="/items/new" element={
                <AuthenticationGuard>
                    <FullWidthLayout><ItemDetailsPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route path="/boms" element={
                <AuthenticationGuard>
                    <FullWidthLayout><BOMsPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route path="/boms/new" element={
                <AuthenticationGuard>
                    <FullWidthLayout><BOMCreationPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route path="/work-orders" element={
                <AuthenticationGuard>
                    <FullWidthLayout><WorkOrdersPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route path="/work-orders/new" element={
                <AuthenticationGuard>
                    <FullWidthLayout><WorkOrderCreationPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route path="/work-orders/:id/edit" element={
                <AuthenticationGuard>
                    <FullWidthLayout><WorkOrderCreationPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route path="/work-orders/:id/operations" element={
                <AuthenticationGuard>
                    <FullWidthLayout><WorkOrderOperationsPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route path="/work-orders/:id/operations/new" element={
                <AuthenticationGuard>
                    <FullWidthLayout><WorkOrderOperationsCreationPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route path="/work-orders/:id/operations/:oid/edit" element={
                <AuthenticationGuard>
                    <FullWidthLayout><WorkOrderOperationsCreationPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>

            <Route path="/inventory" element={
                <AuthenticationGuard>
                    <FullWidthLayout><InventoryPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route path="/inventory/transfer" element={
                <AuthenticationGuard>
                    <FullWidthLayout><InventoryTransferPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route path="/inventory/adjust" element={
                <AuthenticationGuard>
                    <FullWidthLayout><InventoryAdjustPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route path="/inventory/receive" element={
                <AuthenticationGuard>
                    <FullWidthLayout><InventoryReceivePage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route path="/purchasing" element={
                <AuthenticationGuard>
                    <FullWidthLayout><PurchasingPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route path="/purchasing/new" element={
                <AuthenticationGuard>
                    <FullWidthLayout><POCreationPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route path="/production" element={
                <AuthenticationGuard>
                    <FullWidthLayout><ProductionPage/></FullWidthLayout>
                </AuthenticationGuard>
            }/>
            <Route
                path="/terms"
                element={
                    <FullWidthLayout>
                        <TermsPage/>
                    </FullWidthLayout>
                }
            />
            <Route
                path="/privacy"
                element={
                    <FullWidthLayout>
                        <PrivacyPage/>
                    </FullWidthLayout>
                }
            />
            <Route path="/callback" element={<CallbackPage/>}/>
            <Route
                path="*"
                element={
                    <FullWidthLayout>
                        <NotFoundPage/>
                    </FullWidthLayout>
                }
            />
        </Routes>
    );
}