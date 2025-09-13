import PropTypes from "prop-types";
import {useEffect, useRef, useState} from "react";
import {useAuth0} from "@auth0/auth0-react";
import {NavLink} from "react-router-dom";
import {Loader as Spinner} from "../common/Loader";

/**
 * Layout with full width, navbar, and profile dropdown.
 * Tailwind-only. Mobile-first with an accessible hamburger menu + focus management.
 * Desktop styles preserved exactly from the previous design.
 *
 * Update:
 * - Style the "Calendar" link as a gray button (desktop dropdown + mobile drawer).
 * - Keep "Calendar" centered in desktop dropdown; keep extra margin-top for Logout.
 * - Show a warning indicator/banner in menus if email is not verified (reads localStorage "email_verified").
 */
export const FullWidthLayout = ({children}) => {
    const {isAuthenticated, user, logout, loginWithRedirect, isLoading} = useAuth0();
    const path = import.meta.env.VITE_APP_ROOT_PATH;
    const [showProfile, setShowProfile] = useState(false);
    const profileMenuRef = useRef(null);

    const [mobileOpen, setMobileOpen] = useState(false);
    const mobileFirstLinkRef = useRef(null);

    // Email verification state from localStorage
    const [isEmailVerified, setIsEmailVerified] = useState(true);
    useEffect(() => {
        const read = () => {
            const v = localStorage.getItem("email_verified");
            setIsEmailVerified(v === "true");
        };
        read();
        // Keep in sync if another tab updates it
        const onStorage = (e) => {
            if (e.key === "email_verified") read();
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    // Close profile on the outside click + Esc for both profile and mobile
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
                setShowProfile(false);
            }
        };
        const handleEscape = (e) => {
            if (e.key === "Escape") {
                setShowProfile(false);
                setMobileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    // Lock body scroll when a mobile menu is open and focus the first item
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = "hidden";
            setTimeout(() => mobileFirstLinkRef.current?.focus(), 0);
        } else {
            document.body.style.overflow = "";
        }
    }, [mobileOpen]);

    const handleSignUp = () => {
        loginWithRedirect({
            authorizationParams: {prompt: "login", screen_hint: "signup"}
        });
    };

    // Desktop: keep original visual design
    const navLinkClassDesktop = ({isActive}) =>
        `whitespace-nowrap ${isActive ? "text-white" : "text-gray-400 hover:text-white"}`;

    // Mobile: larger tap targets + focus styles
    const navLinkClassMobile = ({isActive}) =>
        `block px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus-visible:ring focus-visible:ring-blue-500/50 whitespace-nowrap ${
            isActive ? "bg-white/10 text-white" : "text-gray-300 hover:text-white hover:bg-white/5"
        }`;

    const AUTH_ITEMS = [
        {to: "/", label: "Home"},
        {to: "/items", label: "Items"},
        {to: "/boms", label: "BOMs"},
        {to: "/work-orders", label: "Work Orders"},
        {to: "/inventory", label: "Inventory"},
        {to: "/purchasing", label: "Purchasing"}
    ];

    const PUBLIC_ITEMS = [
        {to: "/", label: "Home"},
        {to: "/terms", label: "Terms"},
        {to: "/privacy", label: "Privacy"}
    ];

    if (isLoading) return <Spinner/>;

    const ITEMS = isAuthenticated ? AUTH_ITEMS : PUBLIC_ITEMS;

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-900 text-white">
            {/* Top nav (desktop styles preserved) */}
            <nav className="flex items-center justify-between px-6 py-4 bg-gray-950 border-b border-gray-800">
                {/* Left: brand */}
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-2xl bg-blue-600 flex items-center justify-center font-bold">C</div>
                    <div className="text-white text-lg font-semibold">Craftify Platform</div>
                </div>

                {/* Links + auth container */}
                <div className="flex items-center gap-6 text-sm relative">
                    {/* Desktop links */}
                    <div className="hidden md:flex items-center gap-6">
                        {ITEMS.map((item) => (
                            <NavLink key={item.to} to={item.to} className={navLinkClassDesktop} end={item.to === "/"}>
                                {item.label}
                            </NavLink>
                        ))}
                    </div>

                    {/* Auth controls (desktop) */}
                    {isAuthenticated ? (
                        <div className="hidden md:flex items-center gap-4">
                            <div className="relative" ref={profileMenuRef}>
                                <button
                                    type="button"
                                    className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring focus-visible:ring-blue-500/50"
                                    aria-haspopup="menu"
                                    aria-expanded={showProfile}
                                    onClick={() => setShowProfile((p) => !p)}
                                >
                                    <div className="relative">
                                        <img
                                            src={user?.picture}
                                            alt="profile"
                                            className="w-8 h-8 rounded-full cursor-pointer border border-gray-700"
                                        />
                                        {/* Red dot indicator when email NOT verified */}
                                        {(!isEmailVerified) && (
                                            <span
                                                className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 border border-gray-950"
                                                aria-hidden="true"
                                                title="Email not verified"
                                            />
                                        )}
                                    </div>
                                </button>
                                {showProfile && (
                                    <div
                                        className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50 p-4"
                                        role="menu"
                                    >
                                        <div className="flex items-center space-x-3 mb-3">
                                            <div className="relative">
                                                <img src={user?.picture} alt="avatar"
                                                     className="w-10 h-10 rounded-full"/>
                                                {(!isEmailVerified) && (
                                                    <span
                                                        className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 border border-gray-800"
                                                        aria-hidden="true"
                                                        title="Email not verified"
                                                    />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{user?.name}</p>
                                                <p className="text-xs text-gray-400">{user?.email}</p>
                                            </div>
                                        </div>

                                        {/* Warning banner if email is not verified */}
                                        {(!isEmailVerified) && (
                                            <div
                                                className="mb-3 rounded-md border border-amber-400/40 bg-amber-500/10 p-2 text-xs text-amber-300">
                                                <div className="flex items-start gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                                                         fill="currentColor" className="h-4 w-4 mt-0.5">
                                                        <path fillRule="evenodd"
                                                              d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.518 11.584c.724 1.285-.198 2.817-1.743 2.817H3.482c-1.545 0-2.467-1.532-1.743-2.817L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-.75-6.75a.75.75 0 00-1.5 0v4.25a.75.75 0 001.5 0V6.25z"
                                                              clipRule="evenodd"/>
                                                    </svg>
                                                    <div>
                                                        <p className="font-medium">Verify your email</p>
                                                        <p className="opacity-90">
                                                            Some features may be limited until you verify your email
                                                            address.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Calendar link as GRAY BUTTON (centered) */}
                                        <NavLink
                                            to="/calendar"
                                            onClick={() => setShowProfile(false)}
                                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-gray-800 border border-white/10 text-white text-sm hover:bg-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-blue-500/50"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 text-gray-200"
                                                viewBox="0 0 24 24"
                                                fill="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1V3a1 1 0 0 1 1-1Zm12 7H5v10h14V9ZM7 7h10V6H7v1Z"/>
                                            </svg>
                                            <span>Calendar</span>
                                        </NavLink>

                                        <button
                                            onClick={() => {
                                                logout({
                                                    openUrl() {
                                                        window.location.replace(`${window.location.origin}${path}`);
                                                    }
                                                })
                                            }}
                                            className="w-full mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                                        >
                                            Log Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="hidden md:flex items-center gap-3">
                            <button
                                onClick={() => loginWithRedirect({ authorizationParams: {prompt: "login", screen_hint: "login"}})}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm"
                            >
                                Log In
                            </button>
                            <button
                                onClick={handleSignUp}
                                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-1 rounded text-sm"
                            >
                                Sign Up
                            </button>
                        </div>
                    )}

                    {/* Hamburger (mobile) */}
                    <button
                        type="button"
                        className="md:hidden inline-flex items-center justify-center p-2 rounded-md border border-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-blue-500/50"
                        aria-controls="mobile-menu"
                        aria-expanded={mobileOpen}
                        aria-label="Toggle menu"
                        onClick={() => setMobileOpen((v) => !v)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                             className="h-6 w-6">
                            {mobileOpen ? (
                                <path
                                    fillRule="evenodd"
                                    d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06 1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                                    clipRule="evenodd"
                                />
                            ) : (
                                <path
                                    fillRule="evenodd"
                                    d="M3.75 5.25a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5H3.75zm0 6a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5H3.75zm0 6a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5H3.75z"
                                    clipRule="evenodd"
                                />
                            )}
                        </svg>
                    </button>
                </div>
            </nav>

            {/* Mobile drawer + overlay */}
            {mobileOpen && (
                <div className="md:hidden fixed inset-0 z-40" role="dialog" aria-modal="true">
                    {/* Overlay */}
                    <button
                        aria-label="Close menu"
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />

                    {/* Drawer */}
                    <div
                        id="mobile-menu"
                        className="absolute left-0 top-0 h-full w-11/12 max-w-sm bg-gray-900 border-right border-gray-800 shadow-2xl p-4 flex flex-col overflow-y-auto animate-in slide-in-from-left duration-200"
                    >
                        {/* Header inside drawer */}
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div
                                    className="h-8 w-8 rounded-2xl bg-blue-600 flex items-center justify-center font-bold">C
                                </div>
                                <div className="text-white text-base font-semibold">Craftify</div>
                            </div>
                            <button
                                className="p-2 rounded-md border border-gray-700 focus:outline-none focus-visible:ring focus-visible:ring-blue-500/50"
                                onClick={() => setMobileOpen(false)}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                                     className="h-5 w-5">
                                    <path
                                        fillRule="evenodd"
                                        d="M5.47 5.47a.75.75 0 011.06 0L12 10.94l5.47-5.47a.75.75 0 111.06 1.06L13.06 12l5.47 5.47a.75.75 0 11-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 11-1.06 1.06L10.94 12 5.47 6.53a.75.75 0 010-1.06z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Links */}
                        <nav className="grid gap-1 mt-2">
                            {ITEMS.map((item, idx) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={navLinkClassMobile}
                                    end={item.to === "/"}
                                    onClick={() => setMobileOpen(false)}
                                    ref={idx === 0 ? mobileFirstLinkRef : undefined}
                                >
                                    {item.label}
                                </NavLink>
                            ))}
                        </nav>

                        {/* Divider */}
                        <div className="my-4 h-px bg-white/10"/>

                        {/* Auth controls (mobile) */}
                        <div className="mt-1">
                            {isAuthenticated ? (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <img
                                                src={user?.picture}
                                                alt="avatar"
                                                className="w-10 h-10 rounded-full border border-gray-700"
                                            />
                                            {(!isEmailVerified) && (
                                                <span
                                                    className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 border border-gray-900"
                                                    aria-hidden="true"
                                                    title="Email not verified"
                                                />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{user?.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                                        </div>
                                    </div>

                                    {/* Warning banner if email is not verified */}
                                    {(!isEmailVerified) && (
                                        <div
                                            className="mt-3 rounded-md border border-amber-400/40 bg-amber-500/10 p-2 text-xs text-amber-300">
                                            <div className="flex items-start gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                                                     fill="currentColor" className="h-4 w-4 mt-0.5">
                                                    <path fillRule="evenodd"
                                                          d="M8.257 3.099c.765-1.36 2.721-1.36 3.486 0l6.518 11.584c.724 1.285-.198 2.817-1.743 2.817H3.482c-1.545 0-2.467-1.532-1.743-2.817L8.257 3.1zM11 13a1 1 0 10-2 0 1 1 0 002 0zm-.75-6.75a.75.75 0 00-1.5 0v4.25a.75.75 0 001.5 0V6.25z"
                                                          clipRule="evenodd"/>
                                                </svg>
                                                <div>
                                                    <p className="font-medium">Verify your email</p>
                                                    <p className="opacity-90">
                                                        Some features may be limited until verification is complete.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Calendar (GRAY BUTTON) + Logout */}
                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                        <NavLink
                                            to="/calendar"
                                            onClick={() => setMobileOpen(false)}
                                            className="text-center px-3 py-2 bg-gray-800 border border-white/10 hover:bg-gray-700 text-white rounded text-sm focus:outline-none focus-visible:ring focus-visible:ring-blue-500/50"
                                        >
                                            Calendar
                                        </NavLink>
                                        <button
                                            onClick={() => {
                                                logout({
                                                    openUrl() {
                                                        window.location.replace(`${window.location.origin}${path}`);
                                                    }
                                                })
                                            }}
                                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                                        >
                                            Log Out
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => {
                                            setMobileOpen(false);
                                            loginWithRedirect({ authorizationParams: {prompt: "login", screen_hint: "login"}})
                                        }}

                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                                    >
                                        Log In
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMobileOpen(false);
                                            handleSignUp();
                                        }}
                                        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm"
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Page content */}
            <main className="flex flex-col flex-1 overflow-auto">{children}</main>

            {/* Footer */}
            <footer className="border-t border-white/5">
                <div
                    className="mx-auto max-w-6xl px-4 py-8 text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p>© {new Date().getFullYear()} Craftify. All rights reserved.</p>
                    <div className="flex items-center gap-4">
                        <NavLink to="/terms" className="hover:text-gray-300">
                            Terms
                        </NavLink>
                        <NavLink to="/privacy" className="hover:text-gray-300">
                            Privacy
                        </NavLink>
                    </div>
                </div>
            </footer>
        </div>
    );
};

FullWidthLayout.propTypes = {children: PropTypes.node.isRequired};
