import PropTypes from "prop-types";
import {Link} from "react-router-dom";
import {
    dashboardKpis,
    deliveryPerformance,
    deliveryRows,
    ingredientConsumption,
    orderRows,
    ordersByStatus,
    quickActions,
    recentActivity,
    salesTrend,
    tableRows,
} from "../data/demoData";
import {PageContainer} from "../../../shared/ui/templates/PageContainer";
import {SectionHeading} from "../../../shared/ui/atoms/SectionHeading";
import {Surface} from "../../../shared/ui/atoms/Surface";
import {Button} from "../../../shared/ui/atoms/Button";
import {StatusBadge} from "../../../shared/ui/atoms/StatusBadge";
import {useLocalization} from "../../../hooks/useLocalization";

function toneClass(tone) {
    return {
        teal: "from-emerald-500/35 to-emerald-300/20",
        amber: "from-amber-500/35 to-orange-300/20",
        sky: "from-sky-500/35 to-cyan-300/20",
        rose: "from-rose-500/35 to-pink-300/20",
        emerald: "from-emerald-500/35 to-lime-300/20",
        violet: "from-violet-500/35 to-fuchsia-300/20",
        slate: "from-slate-500/35 to-slate-300/20",
    }[tone] || "from-slate-500/35 to-slate-300/20";
}

function MetricCard({item, t}) {
    return (
        <Surface className="relative overflow-hidden p-5">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${toneClass(item.tone)}`}/>
            <p className="text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                {t(item.labelKey)}
            </p>
            <div className="mt-4 flex items-end justify-between gap-3">
                <p className="font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--text-primary)]">
                    {item.value}
                </p>
                <StatusBadge tone={item.tone}>{item.change}</StatusBadge>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
                {t(item.detailKey)}
            </p>
        </Surface>
    );
}

MetricCard.propTypes = {
    item: PropTypes.shape({
        change: PropTypes.string.isRequired,
        detailKey: PropTypes.string.isRequired,
        labelKey: PropTypes.string.isRequired,
        tone: PropTypes.string.isRequired,
        value: PropTypes.string.isRequired,
    }).isRequired,
    t: PropTypes.func.isRequired,
};

function MiniBarChart({data}) {
    const max = Math.max(...data.map((item) => item.value), 1);

    return (
        <div className="mt-6 flex h-52 items-end gap-3">
            {data.map((item) => (
                <div key={item.label} className="flex min-w-0 flex-1 flex-col items-center gap-3">
                    <div className="flex h-full w-full items-end">
                        <div
                            className="w-full rounded-t-2xl bg-[linear-gradient(180deg,var(--accent-soft),var(--accent-strong))]"
                            style={{height: `${Math.max(10, (item.value / max) * 100)}%`}}
                        />
                    </div>
                    <div className="text-center">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                            {item.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                            {item.value}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

MiniBarChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
    })).isRequired,
};

function DistributionList({data, t}) {
    const total = data.reduce((sum, item) => sum + item.value, 0) || 1;

    return (
        <div className="space-y-4">
            {data.map((item) => (
                <div key={item.labelKey || item.label}>
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {item.labelKey ? t(item.labelKey) : item.label}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">{item.value}</p>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-black/5 dark:bg-white/10">
                        <div
                            className={`h-2 rounded-full bg-gradient-to-r ${toneClass(item.tone)}`}
                            style={{width: `${(item.value / total) * 100}%`}}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

DistributionList.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        labelKey: PropTypes.string,
        tone: PropTypes.string.isRequired,
        value: PropTypes.number.isRequired,
    })).isRequired,
    t: PropTypes.func.isRequired,
};

export function DashboardRoute() {
    const {t} = useLocalization();

    return (
        <PageContainer className="space-y-6">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <Surface className="p-6 md:p-7">
                    <SectionHeading
                        eyebrow={t("dashboard.eyebrow")}
                        title={t("dashboard.title")}
                        description={t("dashboard.description")}
                    />
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Button as={Link} to="/orders">{t("dashboard.primaryAction")}</Button>
                        <Button as={Link} to="/work-items" variant="secondary">{t("dashboard.secondaryAction")}</Button>
                    </div>
                </Surface>

                <Surface className="p-6">
                    <p className="eyebrow">{t("dashboard.activityEyebrow")}</p>
                    <div className="mt-4 space-y-4">
                        {recentActivity.map((item) => (
                            <div key={item.id} className="flex items-start justify-between gap-3 rounded-3xl bg-white/60 p-4 dark:bg-white/6">
                                <div>
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                        {t(item.titleKey)}
                                    </p>
                                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                        {item.description}
                                    </p>
                                </div>
                                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                    {item.time}
                                </span>
                            </div>
                        ))}
                    </div>
                </Surface>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {dashboardKpis.map((item) => (
                    <MetricCard key={item.key} item={item} t={t}/>
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <Surface className="p-6">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="eyebrow">{t("dashboard.salesEyebrow")}</p>
                            <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                                {t("dashboard.salesTitle")}
                            </p>
                        </div>
                        <StatusBadge tone="teal">{t("dashboard.liveBadge")}</StatusBadge>
                    </div>
                    <MiniBarChart data={salesTrend}/>
                </Surface>

                <Surface className="p-6">
                    <p className="eyebrow">{t("dashboard.quickActionsEyebrow")}</p>
                    <div className="mt-4 space-y-3">
                        {quickActions.map((item) => (
                            <Link
                                key={item.id}
                                to={item.href}
                                className="block rounded-3xl bg-white/60 p-4 transition hover:bg-white/80 dark:bg-white/6 dark:hover:bg-white/10"
                            >
                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                    {t(item.labelKey)}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                                    {t(item.descriptionKey)}
                                </p>
                            </Link>
                        ))}
                    </div>
                </Surface>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <Surface className="p-6">
                    <p className="eyebrow">{t("dashboard.opsEyebrow")}</p>
                    <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                        {t("dashboard.orderMixTitle")}
                    </p>
                    <div className="mt-6">
                        <DistributionList data={ordersByStatus} t={t}/>
                    </div>
                </Surface>

                <Surface className="p-6">
                    <p className="eyebrow">{t("dashboard.opsEyebrow")}</p>
                    <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                        {t("dashboard.ingredientTitle")}
                    </p>
                    <div className="mt-6">
                        <DistributionList data={ingredientConsumption} t={t}/>
                    </div>
                </Surface>

                <Surface className="p-6">
                    <p className="eyebrow">{t("dashboard.deliveryEyebrow")}</p>
                    <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                        {t("dashboard.deliveryTitle")}
                    </p>
                    <div className="mt-6">
                        <DistributionList data={deliveryPerformance} t={t}/>
                    </div>
                </Surface>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
                <Surface className="p-6 xl:col-span-2">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="eyebrow">{t("dashboard.ordersEyebrow")}</p>
                            <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                                {t("dashboard.ordersTitle")}
                            </p>
                        </div>
                        <Button as={Link} to="/orders" variant="secondary">
                            {t("dashboard.viewAll")}
                        </Button>
                    </div>
                    <div className="mt-5 space-y-3">
                        {orderRows.slice(0, 4).map((order) => (
                            <div key={order.id} className="grid gap-3 rounded-3xl bg-white/60 p-4 md:grid-cols-[1.4fr_0.7fr_0.7fr_0.7fr] dark:bg-white/6">
                                <div>
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">{order.id}</p>
                                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                        {order.customer} · {order.channel}
                                    </p>
                                </div>
                                <StatusBadge tone="amber">{t(order.statusKey)}</StatusBadge>
                                <p className="text-sm font-semibold text-[var(--text-primary)]">{order.amount}</p>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {order.eta} · {order.items} {t("dashboard.lineItems")}
                                </p>
                            </div>
                        ))}
                    </div>
                </Surface>

                <Surface className="p-6">
                    <p className="eyebrow">{t("dashboard.tablesEyebrow")}</p>
                    <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                        {t("dashboard.tablesTitle")}
                    </p>
                    <div className="mt-5 space-y-3">
                        {tableRows.map((table) => (
                            <div key={table.id} className="rounded-3xl bg-white/60 p-4 dark:bg-white/6">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                        {table.id} · {table.zone}
                                    </p>
                                    <StatusBadge tone="sky">{t(table.statusKey)}</StatusBadge>
                                </div>
                                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                                    {table.party} · {table.seats} {t("dashboard.seats")}
                                </p>
                            </div>
                        ))}
                    </div>
                </Surface>
            </div>

            <Surface className="p-6">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="eyebrow">{t("dashboard.deliveryBoardEyebrow")}</p>
                        <p className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                            {t("dashboard.deliveryBoardTitle")}
                        </p>
                    </div>
                    <Button as={Link} to="/deliveries" variant="secondary">
                        {t("dashboard.viewAll")}
                    </Button>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {deliveryRows.map((row) => (
                        <div key={row.id} className="rounded-3xl bg-white/60 p-4 dark:bg-white/6">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">{row.id}</p>
                                <StatusBadge tone="teal">{t(row.statusKey)}</StatusBadge>
                            </div>
                            <p className="mt-3 text-sm font-medium text-[var(--text-primary)]">{row.route}</p>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">{row.driver} · {row.eta}</p>
                            <p className="mt-1 text-sm text-[var(--text-secondary)]">{row.load}</p>
                        </div>
                    ))}
                </div>
            </Surface>
        </PageContainer>
    );
}
