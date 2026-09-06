import { Head, router } from '@inertiajs/react';
import {
    Award,
    BarChart3,
    Calendar,
    DollarSign,
    Filter,
    Percent,
    Printer,
    Receipt,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, formatRupiah } from '@/lib/format';

interface ReportSummary {
    total_revenue: number;
    total_transactions: number;
    average_transaction: number;
    gross_profit: number;
}

interface SalesBreakdownItem {
    date_group: string;
    week_start?: string;
    revenue: number;
    transaction_count: number;
    total_discount: number;
}

interface BestSellingProduct {
    product_name: string;
    product_sku: string;
    total_qty: number;
    total_sales: number;
    estimated_profit: number;
}

interface ReportsIndexProps {
    summary: ReportSummary;
    salesBreakdown: SalesBreakdownItem[];
    bestSellingProducts: BestSellingProduct[];
    filters: {
        period: 'daily' | 'weekly' | 'monthly';
        start_date: string;
        end_date: string;
    };
}

export default function ReportsIndex({
    summary,
    salesBreakdown,
    bestSellingProducts,
    filters,
}: ReportsIndexProps) {
    const [period, setPeriod] = useState(filters.period || 'daily');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [activeTab, setActiveTab] = useState<'breakdown' | 'products'>('breakdown');

    const handlePeriodChange = (newPeriod: 'daily' | 'weekly' | 'monthly') => {
        setPeriod(newPeriod);
        router.get(
            '/reports',
            { period: newPeriod },
            { preserveState: true, replace: true }
        );
    };

    const handleCustomFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/reports',
            {
                period,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Head title="Laporan Penjualan POS" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Laporan Penjualan & Analitik POS
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Analisis pendapatan harian, mingguan, bulanan, estimasi laba kotor, dan produk paling laris.
                        </p>
                    </div>
                    <Button onClick={handlePrint} variant="outline" className="gap-2">
                        <Printer className="size-4" />
                        Cetak Laporan
                    </Button>
                </div>

                {/* Filter Period & Date Range */}
                <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                    <CardContent className="pt-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            {/* Period Switcher Tabs */}
                            <div className="flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-100/60 p-1 dark:border-neutral-800 dark:bg-neutral-900">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={period === 'daily' ? 'default' : 'ghost'}
                                    onClick={() => handlePeriodChange('daily')}
                                    className="h-8 text-xs font-semibold"
                                >
                                    Penjualan Harian
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={period === 'weekly' ? 'default' : 'ghost'}
                                    onClick={() => handlePeriodChange('weekly')}
                                    className="h-8 text-xs font-semibold"
                                >
                                    Penjualan Mingguan
                                </Button>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant={period === 'monthly' ? 'default' : 'ghost'}
                                    onClick={() => handlePeriodChange('monthly')}
                                    className="h-8 text-xs font-semibold"
                                >
                                    Penjualan Bulanan
                                </Button>
                            </div>

                            {/* Custom Date Form */}
                            <form onSubmit={handleCustomFilter} className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                                    <Calendar className="size-3.5" />
                                    <span>Rentang:</span>
                                </div>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-8 w-36 text-xs"
                                />
                                <span className="text-xs text-neutral-400">-</span>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-8 w-36 text-xs"
                                />
                                <Button type="submit" size="sm" variant="secondary" className="h-8 text-xs gap-1">
                                    <Filter className="size-3" />
                                    Filter
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>

                {/* Key Metric Stat Cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                Total Revenue (Omset)
                            </CardTitle>
                            <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-600">
                                <DollarSign className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                {formatRupiah(summary.total_revenue)}
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">
                                Dalam periode terpilih
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                Total Transaksi
                            </CardTitle>
                            <div className="rounded-md bg-blue-500/10 p-2 text-blue-600">
                                <Receipt className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                {summary.total_transactions}
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">
                                Transaksi berstatus selesai
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                Estimasi Laba Kotor (Gross Profit)
                            </CardTitle>
                            <div className="rounded-md bg-indigo-500/10 p-2 text-indigo-600">
                                <TrendingUp className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {formatRupiah(summary.gross_profit)}
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">
                                Margin: (Total Omset - Harga Pokok Penjualan)
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                                Rata-rata per Transaksi
                            </CardTitle>
                            <div className="rounded-md bg-purple-500/10 p-2 text-purple-600">
                                <Percent className="size-4" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                {formatRupiah(summary.average_transaction)}
                            </div>
                            <p className="text-xs text-neutral-500 mt-1">
                                Nilai keranjang belanja rata-rata
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Report Section Tabs: Sales Breakdown & Best Sellers */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 dark:border-neutral-800">
                        <Button
                            variant={activeTab === 'breakdown' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('breakdown')}
                            className="gap-2 text-xs font-semibold"
                        >
                            <BarChart3 className="size-4" />
                            Rincian Penjualan ({period.toUpperCase()})
                        </Button>
                        <Button
                            variant={activeTab === 'products' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setActiveTab('products')}
                            className="gap-2 text-xs font-semibold"
                        >
                            <Award className="size-4" />
                            Peringkat Produk Terlaris
                        </Button>
                    </div>

                    {activeTab === 'breakdown' ? (
                        <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">
                                    Breakdown Penjualan Periode {period === 'daily' ? 'Harian' : period === 'weekly' ? 'Mingguan' : 'Bulanan'}
                                </CardTitle>
                                <CardDescription>
                                    Rekap omset, jumlah transaksi, dan potongan diskon per tanggal
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs font-semibold uppercase text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
                                            <tr>
                                                <th className="px-4 py-3">Periode Waktu</th>
                                                <th className="px-4 py-3 text-center">Jumlah Transaksi</th>
                                                <th className="px-4 py-3 text-right">Total Diskon Diberikan</th>
                                                <th className="px-4 py-3 text-right">Total Pendapatan (Omset)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                            {salesBreakdown.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="py-8 text-center text-neutral-500">
                                                        Belum ada transaksi dalam periode ini.
                                                    </td>
                                                </tr>
                                            ) : (
                                                salesBreakdown.map((item, idx) => (
                                                    <tr key={idx} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40">
                                                        <td className="px-4 py-3 font-semibold font-mono text-neutral-900 dark:text-neutral-100">
                                                            {item.date_group}
                                                            {item.week_start && (
                                                                <span className="ml-2 text-xs font-normal text-neutral-500">
                                                                    (Mulai {item.week_start})
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-neutral-700 dark:text-neutral-300">
                                                            {item.transaction_count} transaksi
                                                        </td>
                                                        <td className="px-4 py-3 text-right text-neutral-500">
                                                            {formatRupiah(item.total_discount)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                            {formatRupiah(item.revenue)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base font-semibold">
                                    Daftar Produk Terlaris (Best-Selling)
                                </CardTitle>
                                <CardDescription>
                                    Diurutkan berdasarkan total unit yang terjual dan estimasi profit kontribusi
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs font-semibold uppercase text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
                                            <tr>
                                                <th className="px-4 py-3 text-center w-14">Rank</th>
                                                <th className="px-4 py-3">Nama Produk</th>
                                                <th className="px-4 py-3 font-mono">SKU</th>
                                                <th className="px-4 py-3 text-center">Unit Terjual</th>
                                                <th className="px-4 py-3 text-right">Total Penjualan</th>
                                                <th className="px-4 py-3 text-right">Estimasi Profit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                            {bestSellingProducts.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="py-8 text-center text-neutral-500">
                                                        Belum ada data penjualan produk.
                                                    </td>
                                                </tr>
                                            ) : (
                                                bestSellingProducts.map((p, idx) => (
                                                    <tr key={idx} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40">
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="inline-flex size-6 items-center justify-center rounded-full bg-neutral-100 font-bold text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                                #{idx + 1}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                                                            {p.product_name}
                                                        </td>
                                                        <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                                                            {p.product_sku}
                                                        </td>
                                                        <td className="px-4 py-3 text-center font-bold text-neutral-800 dark:text-neutral-200">
                                                            {p.total_qty} pcs
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-neutral-900 dark:text-neutral-100">
                                                            {formatRupiah(p.total_sales)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                            {formatRupiah(p.estimated_profit)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
}

ReportsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Laporan Penjualan', href: '/reports' },
    ],
};
