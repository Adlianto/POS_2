import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowUpRight,
    Boxes,
    CreditCard,
    DollarSign,
    Package,
    PlusCircle,
    Receipt,
    ShoppingCart,
    TrendingUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatRupiah } from '@/lib/format';
import type { Product, Transaction } from '@/types/pos';

interface DashboardStats {
    today_sales: number;
    today_transactions: number;
    month_sales: number;
    month_transactions: number;
    total_products: number;
    total_categories: number;
    low_stock_count: number;
}

interface SalesChartItem {
    date: string;
    label: string;
    revenue: number;
    transactions: number;
}

interface TopProductItem {
    product_name: string;
    product_sku: string;
    total_sold: number;
    total_revenue: number;
}

interface DashboardProps {
    stats: DashboardStats;
    lowStockProducts: Product[];
    topProducts: TopProductItem[];
    salesChart: SalesChartItem[];
    recentTransactions: Transaction[];
}

export default function Dashboard({
    stats,
    lowStockProducts,
    topProducts,
    salesChart,
    recentTransactions,
}: DashboardProps) {
    const maxRevenue = Math.max(...salesChart.map((d) => d.revenue), 1000);

    return (
        <>
            <Head title="Dashboard POS" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header & Quick Action Buttons */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Ringkasan Point of Sale
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Pantau performa transaksi kasir, pendapatan, dan status inventori secara real-time.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild size="default" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                            <Link href="/pos">
                                <ShoppingCart className="size-4" />
                                Buka Kasir POS
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="default" className="gap-2">
                            <Link href="/products">
                                <PlusCircle className="size-4" />
                                Kelola Produk
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Key Metric Stats Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                Penjualan Hari Ini
                            </CardTitle>
                            <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                                <DollarSign className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                {formatRupiah(stats.today_sales)}
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                    {stats.today_transactions}
                                </span>{' '}
                                transaksi diselesaikan hari ini
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                Penjualan Bulan Ini
                            </CardTitle>
                            <div className="rounded-md bg-blue-500/10 p-2 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                                <TrendingUp className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                {formatRupiah(stats.month_sales)}
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                    {stats.month_transactions}
                                </span>{' '}
                                total transaksi bulan berjalan
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                Total Katalog Produk
                            </CardTitle>
                            <div className="rounded-md bg-indigo-500/10 p-2 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                                <Package className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                {stats.total_products}
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                Tersebar di {stats.total_categories} kategori aktif
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                Peringatan Stok Menipis
                            </CardTitle>
                            <div className="rounded-md bg-amber-500/10 p-2 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                <AlertTriangle className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">
                                {stats.low_stock_count}
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                Produk mencapai batas minimum stok
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Sales Chart (7 Hari Terakhir) & Top Products */}
                <div className="grid gap-6 lg:grid-cols-7">
                    <Card className="lg:col-span-4 border-neutral-200/80 shadow-xs dark:border-neutral-800">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                Tren Penjualan 7 Hari Terakhir
                            </CardTitle>
                            <CardDescription>
                                Total pendapatan transaksi yang berhasil diselesaikan per hari
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex h-56 items-end gap-3 pt-6 pb-2">
                                {salesChart.map((day, idx) => {
                                    const heightPercent = Math.max(
                                        Math.round((day.revenue / maxRevenue) * 100),
                                        4
                                    );
                                    return (
                                        <div
                                            key={idx}
                                            className="group flex flex-1 flex-col items-center gap-2 h-full justify-end"
                                        >
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 text-center">
                                                {formatRupiah(day.revenue)}
                                            </div>
                                            <div
                                                style={{ height: `${heightPercent}%` }}
                                                className="w-full rounded-t-md bg-emerald-500/80 transition-all group-hover:bg-emerald-600 dark:bg-emerald-500/60 dark:group-hover:bg-emerald-500"
                                            />
                                            <span className="text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                                {day.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top 5 Best Selling Products */}
                    <Card className="lg:col-span-3 border-neutral-200/80 shadow-xs dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                    Produk Terlaris
                                </CardTitle>
                                <CardDescription>Top 5 item dengan kuantitas penjualan tertinggi</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/reports?period=daily" className="text-xs gap-1">
                                    Laporan <ArrowUpRight className="size-3" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {topProducts.length === 0 ? (
                                <p className="text-sm text-neutral-500 py-6 text-center">
                                    Belum ada data penjualan tercatat.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {topProducts.map((p, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0 dark:border-neutral-800"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-7 items-center justify-center rounded-full bg-neutral-100 font-semibold text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                    #{idx + 1}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1">
                                                        {p.product_name}
                                                    </p>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        SKU: {p.product_sku}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                                    {p.total_sold} terjual
                                                </p>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                                    {formatRupiah(p.total_revenue)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Low Stock Warning & Recent Transactions */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Low Stock Products Warning */}
                    <Card className="border-amber-200/70 shadow-xs dark:border-amber-900/40">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="size-4 text-amber-600 dark:text-amber-500" />
                                <div>
                                    <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                        Stok Menipis (Perlu Restock)
                                    </CardTitle>
                                    <CardDescription>
                                        Daftar produk dengan jumlah stok di bawah batas peringatan
                                    </CardDescription>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/inventory" className="text-xs gap-1">
                                    <Boxes className="size-3" /> Restock
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {lowStockProducts.length === 0 ? (
                                <p className="text-sm text-neutral-500 py-6 text-center">
                                    Semua stok produk berada dalam batas aman.
                                </p>
                            ) : (
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {lowStockProducts.map((p) => (
                                        <div
                                            key={p.id}
                                            className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                                    {p.name}
                                                </p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                    {p.category?.name || 'Tanpa Kategori'} • SKU: {p.sku}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <Badge
                                                    variant={p.stock === 0 ? 'destructive' : 'outline'}
                                                    className={
                                                        p.stock > 0
                                                            ? 'border-amber-500/30 text-amber-700 dark:text-amber-400'
                                                            : ''
                                                    }
                                                >
                                                    Sisa: {p.stock} pcs
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Transactions List */}
                    <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-3">
                            <div className="flex items-center gap-2">
                                <Receipt className="size-4 text-neutral-600 dark:text-neutral-400" />
                                <div>
                                    <CardTitle className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                        Transaksi Terkini
                                    </CardTitle>
                                    <CardDescription>
                                        Aktivitas checkout terbaru oleh kasir
                                    </CardDescription>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                                <Link href="/transactions" className="text-xs gap-1">
                                    Lihat Semua
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {recentTransactions.length === 0 ? (
                                <p className="text-sm text-neutral-500 py-6 text-center">
                                    Belum ada riwayat transaksi.
                                </p>
                            ) : (
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {recentTransactions.map((trx) => (
                                        <div
                                            key={trx.id}
                                            className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                                        >
                                            <div>
                                                <p className="text-sm font-semibold font-mono text-neutral-900 dark:text-neutral-100">
                                                    {trx.invoice_number}
                                                </p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                    {trx.user?.name} • {formatDate(trx.created_at)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                                    {formatRupiah(trx.total)}
                                                </p>
                                                <Badge
                                                    variant={trx.status === 'completed' ? 'default' : 'destructive'}
                                                    className="text-[10px] capitalize px-1.5 py-0"
                                                >
                                                    {trx.payment_method}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
