export const PRIMARY_ERP_NAV = [
    {
        key: "dashboard",
        to: "/dashboard",
        labelKey: "nav.dashboard",
        descriptionKey: "navDesc.dashboard",
        shortCode: "DB",
    },
    {
        key: "orders",
        to: "/orders",
        labelKey: "nav.orders",
        descriptionKey: "navDesc.orders",
        shortCode: "OR",
    },
    {
        key: "production",
        to: "/production",
        labelKey: "nav.production",
        descriptionKey: "navDesc.production",
        shortCode: "PR",
    },
    {
        key: "inventory",
        to: "/inventory",
        labelKey: "nav.inventoryModule",
        descriptionKey: "navDesc.inventory",
        shortCode: "IN",
    },
    {
        key: "procurement",
        to: "/procurement",
        labelKey: "nav.procurement",
        descriptionKey: "navDesc.procurement",
        shortCode: "PO",
    },
    {
        key: "deliveries",
        to: "/deliveries",
        labelKey: "nav.deliveries",
        descriptionKey: "navDesc.deliveries",
        shortCode: "DL",
    },
    {
        key: "tables",
        to: "/tables",
        labelKey: "nav.tables",
        descriptionKey: "navDesc.tables",
        shortCode: "TB",
    },
    {
        key: "menu",
        to: "/menu",
        labelKey: "nav.menu",
        descriptionKey: "navDesc.menu",
        shortCode: "MN",
    },
    {
        key: "reports",
        to: "/reports",
        labelKey: "nav.reports",
        descriptionKey: "navDesc.reports",
        shortCode: "RP",
    },
    {
        key: "settings",
        to: "/settings",
        labelKey: "nav.settings",
        descriptionKey: "navDesc.settings",
        shortCode: "ST",
    },
];

export const SECONDARY_ERP_NAV = [
    {key: "items", to: "/items", labelKey: "nav.items", shortCode: "IT"},
    {key: "boms", to: "/boms", labelKey: "nav.boms", shortCode: "BM"},
    {key: "workItems", to: "/work-items", labelKey: "nav.workItems", shortCode: "WI"},
    {key: "calendar", to: "/calendar", labelKey: "nav.calendar", shortCode: "CL"},
];

export const ROUTE_META = {
    "/dashboard": {
        titleKey: "dashboard.pageTitle",
        descriptionKey: "dashboard.pageDescription",
        actionLabelKey: "dashboard.headerAction",
        actionTo: "/settings/setup",
    },
    "/orders": {
        titleKey: "orders.pageTitle",
        descriptionKey: "orders.pageDescription",
    },
    "/production": {
        titleKey: "production.pageTitle",
        descriptionKey: "production.pageDescription",
    },
    "/inventory": {
        titleKey: "inventory.pageTitle",
        descriptionKey: "inventory.pageDescription",
    },
    "/inventory/new": {
        titleKey: "inventory.pageTitle",
        descriptionKey: "inventory.pageDescription",
    },
    "/procurement": {
        titleKey: "procurement.pageTitle",
        descriptionKey: "procurement.pageDescription",
    },
    "/deliveries": {
        titleKey: "deliveries.pageTitle",
        descriptionKey: "deliveries.pageDescription",
    },
    "/tables": {
        titleKey: "tables.pageTitle",
        descriptionKey: "tables.pageDescription",
    },
    "/menu": {
        titleKey: "menu.pageTitle",
        descriptionKey: "menu.pageDescription",
    },
    "/reports": {
        titleKey: "reports.pageTitle",
        descriptionKey: "reports.pageDescription",
    },
    "/settings": {
        titleKey: "settings.pageTitle",
        descriptionKey: "settings.pageDescription",
        actionLabelKey: "settings.openWizard",
        actionTo: "/settings/setup",
    },
    "/settings/setup": {
        titleKey: "wizard.pageTitle",
        descriptionKey: "wizard.pageDescription",
    },
    "/items": {
        titleKey: "items.pageTitle",
        descriptionKey: "items.pageDescription",
    },
    "/boms": {
        titleKey: "boms.pageTitle",
        descriptionKey: "boms.pageDescription",
    },
    "/work-items": {
        titleKey: "workItems.pageTitle",
        descriptionKey: "workItems.pageDescription",
    },
    "/calendar": {
        titleKey: "calendar.pageTitle",
        descriptionKey: "calendar.pageDescription",
    },
};

export const findRouteMeta = (pathname) => {
    if (ROUTE_META[pathname]) {
        return ROUTE_META[pathname];
    }

    const prefixMatch = Object.entries(ROUTE_META)
        .sort(([left], [right]) => right.length - left.length)
        .find(([route]) => route !== "/" && pathname.startsWith(`${route}/`));

    return prefixMatch?.[1] ?? {
        titleKey: "erp.defaultTitle",
        descriptionKey: "erp.defaultDescription",
    };
};
