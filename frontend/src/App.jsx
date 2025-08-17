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