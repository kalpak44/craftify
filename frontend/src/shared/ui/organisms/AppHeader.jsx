import {useAuth0} from "@auth0/auth0-react";
import {useEffect, useRef, useState} from "react";
import {Button} from "../atoms/Button";
import {BrandMark} from "../atoms/BrandMark";
import {NavItem} from "../molecules/NavItem";
import {LocaleSwitcher} from "../molecules/LocaleSwitcher";
import {ThemeToggle} from "../molecules/ThemeToggle";
import {useLocalization} from "../../../hooks/useLocalization";
import {logoutUser} from "../../../utils/authSession";

export function AppHeader() {
    const {isAuthenticated, isLoading, loginWithRedirect, logout, user} = useAuth0();
    const {t} = useLocalization();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const menuRef = useRef(null);
    const authItems = [
        {to: "/", label: t("nav.home")},
        {to: "/items", label: t("nav.items")},
        {to: "/inventory", label: t("nav.inventory")},
        {to: "/boms", label: t("nav.boms")},
        {to: "/work-items", label: t("nav.workItems")},
        {to: "/calendar", label: t("nav.calendar")},
    ];
    const publicItems = [
        {to: "/", label: t("nav.home")},
        {to: "/terms", label: t("nav.terms")},
        {to: "/privacy", label: t("nav.privacy")},
    ];
    const items = isAuthenticated ? authItems : publicItems;

    useEffect(() => {
        const handleClick = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setMenuOpen(false);
                setMobileOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClick);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClick);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    const openLogin = () => loginWithRedirect({authorizationParams: {prompt: "login", screen_hint: "login"}});
    const openSignup = () => loginWithRedirect({authorizationParams: {prompt: "login", screen_hint: "signup"}});

    return (
        <header className="sticky top-0 z-40 border-b border-white/45 bg-[color:var(--shell-bg)]/88 backdrop-blur-2xl">
            <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-4 md:px-6">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                    <BrandMark/>
                    <div className="min-w-0">
                        <p className="font-display text-lg font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                            Craftify
                        </p>
                        <p className="truncate text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
                            {t("brand.tagline")}
                        </p>
                    </div>
                </div>

                <nav className="hidden items-center gap-1 lg:flex">
                    {items.map((item) => (
                        <NavItem key={item.to} to={item.to}>
                            {item.label}
                        </NavItem>
                    ))}
                </nav>

                <div className="hidden items-center gap-3 lg:flex">
                    {!isAuthenticated ? <LocaleSwitcher/> : null}
                    <ThemeToggle/>
                    {!isLoading && !isAuthenticated ? (
                        <>
                            <Button variant="ghost" onClick={openLogin}>{t("auth.logIn")}</Button>
                            <Button variant="primary" onClick={openSignup}>{t("auth.startFree")}</Button>
                        </>
                    ) : null}
                    {!isLoading && isAuthenticated ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                type="button"
                                onClick={() => setMenuOpen((current) => !current)}
                                className="inline-flex items-center gap-3 rounded-full bg-white/70 px-2 py-2 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] transition hover:bg-white dark:bg-white/10 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                            >
                                <img
                                    src={user?.picture}
                                    alt={user?.name || t("header.profileAlt")}
                                    className="h-9 w-9 rounded-full object-cover ring-1 ring-black/5 dark:ring-white/10"
                                />
                                <span className="hidden pr-2 md:block">
                                    <span className="block text-sm font-semibold text-[var(--text-primary)]">
                                        {user?.name || t("header.userFallback")}
                                    </span>
                                    <span className="block max-w-40 truncate text-xs text-[var(--text-muted)]">
                                        {user?.email}
                                    </span>
                                </span>
                            </button>
                            {menuOpen ? (
                                <div className="glass-panel absolute right-0 mt-3 w-72 p-4">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{user?.name}</p>
                                    <p className="mt-1 text-xs text-[var(--text-muted)]">{user?.email}</p>
                                    <div className="mt-4 flex flex-col gap-2">
                                        <LocaleSwitcher/>
                                        <NavItem to="/calendar" mobile onClick={() => setMenuOpen(false)}>
                                            {t("auth.openCalendar")}
                                        </NavItem>
                                        <Button variant="secondary" onClick={() => logoutUser(logout)}>
                                            {t("auth.logOut")}
                                        </Button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>

                <div className="flex items-center gap-2 lg:hidden">
                    <ThemeToggle/>
                    <button
                        type="button"
                        onClick={() => setMobileOpen((current) => !current)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/70 text-[var(--text-primary)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] dark:bg-white/10 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                        aria-label={t("header.openNavigation")}
                    >
                        <span aria-hidden="true">{mobileOpen ? "×" : "≡"}</span>
                    </button>
                </div>
            </div>

            {mobileOpen ? (
                <div className="border-t border-white/45 bg-[color:var(--shell-bg)]/96 px-4 py-4 backdrop-blur-2xl lg:hidden">
                    <div className="mx-auto flex max-w-7xl flex-col gap-2">
                        {!isAuthenticated ? <LocaleSwitcher/> : null}
                        {items.map((item) => (
                            <NavItem key={item.to} to={item.to} mobile onClick={() => setMobileOpen(false)}>
                                {item.label}
                            </NavItem>
                        ))}
                        {!isLoading && !isAuthenticated ? (
                            <div className="mt-3 flex flex-col gap-2">
                                <Button variant="secondary" onClick={openLogin}>{t("auth.logIn")}</Button>
                                <Button variant="primary" onClick={openSignup}>{t("auth.startFree")}</Button>
                            </div>
                        ) : null}
                        {!isLoading && isAuthenticated ? (
                            <div className="glass-panel mt-3 p-4">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">{user?.name}</p>
                                <p className="mt-1 text-xs text-[var(--text-muted)]">{user?.email}</p>
                                <div className="mt-4">
                                    <LocaleSwitcher/>
                                </div>
                                <Button className="mt-4 w-full" variant="secondary" onClick={() => logoutUser(logout)}>
                                    {t("auth.logOut")}
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </header>
    );
}
