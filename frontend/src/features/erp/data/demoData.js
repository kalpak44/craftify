export const dashboardKpis = [
    {key: "orders", labelKey: "erp.kpi.totalOrders", value: "128", change: "+12%", tone: "teal", detailKey: "erp.kpi.ordersDetail"},
    {key: "tables", labelKey: "erp.kpi.activeTables", value: "24", change: "+4", tone: "amber", detailKey: "erp.kpi.tablesDetail"},
    {key: "deliveries", labelKey: "erp.kpi.deliveriesInProgress", value: "16", change: "94%", tone: "sky", detailKey: "erp.kpi.deliveriesDetail"},
    {key: "stock", labelKey: "erp.kpi.lowStockIngredients", value: "7", change: "-2", tone: "rose", detailKey: "erp.kpi.stockDetail"},
    {key: "revenue", labelKey: "erp.kpi.revenueToday", value: "$8.4k", change: "+18%", tone: "emerald", detailKey: "erp.kpi.revenueDetail"},
    {key: "queue", labelKey: "erp.kpi.kitchenQueue", value: "19", change: "6 urgent", tone: "violet", detailKey: "erp.kpi.queueDetail"},
];

export const salesTrend = [
    {label: "Mon", value: 4200},
    {label: "Tue", value: 4680},
    {label: "Wed", value: 4410},
    {label: "Thu", value: 5120},
    {label: "Fri", value: 5890},
    {label: "Sat", value: 6720},
    {label: "Sun", value: 6180},
];

export const ordersByStatus = [
    {labelKey: "erp.status.prep", value: 36, tone: "amber"},
    {labelKey: "erp.status.ready", value: 22, tone: "teal"},
    {labelKey: "erp.status.delivery", value: 18, tone: "sky"},
    {labelKey: "erp.status.completed", value: 52, tone: "slate"},
];

export const topSellingDishes = [
    {label: "Truffle Burger", value: 86},
    {label: "Salmon Bowl", value: 72},
    {label: "Rigatoni Al Forno", value: 65},
    {label: "Chicken Bao", value: 53},
    {label: "Mango Mousse", value: 41},
];

export const ingredientConsumption = [
    {label: "Tomatoes", value: 68},
    {label: "Mozzarella", value: 54},
    {label: "Rice", value: 49},
    {label: "Avocado", value: 42},
    {label: "Chicken", value: 36},
];

export const deliveryPerformance = [
    {label: "Under 20m", value: 48, tone: "teal"},
    {label: "20-30m", value: 34, tone: "sky"},
    {label: "30m+", value: 18, tone: "rose"},
];

export const recentActivity = [
    {id: "A-1042", titleKey: "erp.activity.deliveryArrived", description: "Dock 2 · Sofia Center", time: "2m"},
    {id: "K-201", titleKey: "erp.activity.orderFired", description: "Table 14 · 6 items", time: "6m"},
    {id: "P-331", titleKey: "erp.activity.lowStockRaised", description: "Mozzarella · 4.5 kg left", time: "13m"},
    {id: "D-778", titleKey: "erp.activity.driverDelayed", description: "Traffic on Route West", time: "21m"},
];

export const quickActions = [
    {id: "new-order", labelKey: "erp.quickAction.newOrder", descriptionKey: "erp.quickAction.newOrderDesc", href: "/orders"},
    {id: "stock-check", labelKey: "erp.quickAction.stockCheck", descriptionKey: "erp.quickAction.stockCheckDesc", href: "/inventory"},
    {id: "start-batch", labelKey: "erp.quickAction.startBatch", descriptionKey: "erp.quickAction.startBatchDesc", href: "/work-items"},
    {id: "dispatch", labelKey: "erp.quickAction.dispatch", descriptionKey: "erp.quickAction.dispatchDesc", href: "/deliveries"},
];

export const orderRows = [
    {id: "ORD-1042", customer: "Table 12", channel: "Dine-in", statusKey: "erp.status.prep", amount: "$124.00", eta: "12 min", items: 7},
    {id: "ORD-1041", customer: "Volt Courier", channel: "Delivery", statusKey: "erp.status.delivery", amount: "$58.00", eta: "18 min", items: 4},
    {id: "ORD-1040", customer: "Table 4", channel: "Dine-in", statusKey: "erp.status.ready", amount: "$76.00", eta: "Pickup", items: 5},
    {id: "ORD-1039", customer: "Corporate Lunch", channel: "Catering", statusKey: "erp.status.completed", amount: "$312.00", eta: "Closed", items: 14},
    {id: "ORD-1038", customer: "Web Store", channel: "Pickup", statusKey: "erp.status.prep", amount: "$43.00", eta: "9 min", items: 3},
];

export const deliveryRows = [
    {id: "DRV-22", route: "Central Loop", driver: "M. Iliev", statusKey: "erp.status.onRoute", eta: "11 min", load: "14 stops"},
    {id: "DRV-18", route: "North Hotels", driver: "A. Chen", statusKey: "erp.status.loading", eta: "Dock 1", load: "Ingredient run"},
    {id: "DRV-17", route: "Retail West", driver: "T. Ahmed", statusKey: "erp.status.delayed", eta: "24 min", load: "8 stops"},
];

export const tableRows = [
    {id: "T-01", zone: "Patio", seats: 4, statusKey: "erp.status.seated", party: "2 guests"},
    {id: "T-07", zone: "Main hall", seats: 6, statusKey: "erp.status.turning", party: "Cleaning"},
    {id: "T-12", zone: "Chef counter", seats: 2, statusKey: "erp.status.reserved", party: "19:30"},
    {id: "T-14", zone: "Main hall", seats: 8, statusKey: "erp.status.seated", party: "6 guests"},
];

export const reportCards = [
    {titleKey: "erp.report.salesMix", value: "37%", descriptionKey: "erp.report.salesMixDesc"},
    {titleKey: "erp.report.foodCost", value: "28.4%", descriptionKey: "erp.report.foodCostDesc"},
    {titleKey: "erp.report.waste", value: "2.1%", descriptionKey: "erp.report.wasteDesc"},
    {titleKey: "erp.report.serviceLevel", value: "96%", descriptionKey: "erp.report.serviceLevelDesc"},
];

export const settingsSections = [
    {titleKey: "erp.settings.profile", descriptionKey: "erp.settings.profileDesc"},
    {titleKey: "erp.settings.notifications", descriptionKey: "erp.settings.notificationsDesc"},
    {titleKey: "erp.settings.locations", descriptionKey: "erp.settings.locationsDesc"},
    {titleKey: "erp.settings.localization", descriptionKey: "erp.settings.localizationDesc"},
];
