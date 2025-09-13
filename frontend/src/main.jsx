import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import {BrowserRouter} from "react-router-dom";
import {Auth0ProviderWithNavigate} from "./Auth0ProviderWithNavigate.jsx";

const rootPath = import.meta.env.VITE_APP_ROOT_PATH;

// GitHub Pages workaround
const redirect = sessionStorage.getItem("redirect");
if (redirect) {
    sessionStorage.removeItem("redirect");
    window.history.replaceState(null, null, redirect);
}


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter basename={rootPath}>
            <Auth0ProviderWithNavigate>
                <App/>
            </Auth0ProviderWithNavigate>
        </BrowserRouter>
    </React.StrictMode>
)
