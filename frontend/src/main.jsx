import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import {BrowserRouter} from "react-router-dom";
import {Auth0ProviderWithNavigate} from "./Auth0ProviderWithNavigate.jsx";
import {LocalizationProvider} from "./providers/LocalizationProvider.jsx";
import {ThemeProvider} from "./providers/ThemeProvider.jsx";
import {UserPreferencesProvider} from "./providers/UserPreferencesProvider.jsx";

const path = import.meta.env.VITE_APP_ROOT_PATH;

// GitHub Pages workaround
const redirect = sessionStorage.getItem("redirect");
if (redirect) {
    sessionStorage.removeItem("redirect");
    window.history.replaceState(null, null, redirect);
}


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <LocalizationProvider>
            <ThemeProvider>
                <BrowserRouter basename={path}>
                    <Auth0ProviderWithNavigate>
                        <UserPreferencesProvider>
                            <App/>
                        </UserPreferencesProvider>
                    </Auth0ProviderWithNavigate>
                </BrowserRouter>
            </ThemeProvider>
        </LocalizationProvider>
    </React.StrictMode>
)
