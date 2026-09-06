import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Ban,
    Calendar,
    CheckCircle2,
    Eye,
    Filter,
    Printer,
    Receipt,
    Search,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { formatDate, formatRupiah } from '@/lib/format';
import type { PaginatedData, Transaction } from '@/types/pos';

interface TransactionsIndexProps {
    transactions: PaginatedData<Transaction>;
    filters: {
        search?: string;
        start_date?: string;
        end_date?: string;
        status?: string;
        payment_method?: string;
    };
}

export default function TransactionsIndex({ transactions, filters }: TransactionsIndexProps) {
    const { auth } = usePage().props as { auth: { user: { role: string } } };
    const isAdmin = auth.user.role === 'admin';

    const [search, setSearch] = useState(filters.search || '');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [status, setStatus] = useState(filters.status || 'all');
    const [paymentMethod, setPaymentMethod] = useState(filters.payment_method || 'all');

    // Detail & cancel modal state
    const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
    const [cancellingTransaction, setCancellingTransaction] = useState<Transaction | null>(null);

    const applyFilters = () => {
        router.get(
            '/transactions',
            {
                search: search || undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                status: status !== 'all' ? status : undefined,
                payment_method: paymentMethod !== 'all' ? paymentMethod : undefined,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const handleReset = () => {
        setSearch('');
        setStartDate('');
        setEndDate('');
        setStatus('all');
        setPaymentMethod('all');
        router.get('/transactions');
    };

    const handleCancelTransaction = () => {
        if (!cancellingTransaction) return;
        router.post(
            `/transactions/${cancellingTransaction.id}/cancel`,
            {},
            {
                onSuccess: () => {
                    setCancellingTransaction(null);
                    setViewingTransaction(null);
                },
            }
        );
    };

    return (
        <>
            <Head title="Riwayat Transaksi POS" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Riwayat Transaksi Penjualan
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Daftar seluruh transaksi kasir lengkap dengan invoice, status pembayaran, dan rincian struk.
                        </p>
                    </div>
                </div>

                {/* Filter Card */}
                <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                <div className="relative lg:col-span-2">
                                    <Search className="absolute left-3 top-2.5 size-4 text-neutral-400" />
                                    <Input
                                        placeholder="Cari No. Invoice atau Nama Pelanggan..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>

                                <div className="flex items-center gap-1">
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="text-xs"
                                        title="Tanggal Mulai"
                                    />
                                </div>

                                <div className="flex items-center gap-1">
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="text-xs"
                                        title="Tanggal Selesai"
                                    />
                                </div>

                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status Transaksi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="completed">Selesai (Completed)</SelectItem>
                                        <SelectItem value="cancelled">Dibatalkan (Cancelled)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                                <div className="flex items-center gap-2">
                                    <Label className="text-xs text-neutral-500">Metode Bayar:</Label>
                                    <div className="flex gap-1">
                                        {['all', 'cash', 'qris', 'transfer', 'card'].map((m) => (
                                            <Button
                                                key={m}
                                                type="button"
                                                size="sm"
                                                variant={paymentMethod === m ? 'default' : 'outline'}
                                                onClick={() => setPaymentMethod(m)}
                                                className="h-7 text-xs uppercase"
                                            >
                                                {m}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                                        Reset
                                    </Button>
                                    <Button type="submit" size="sm" className="gap-1">
                                        <Filter className="size-3.5" />
                                        Terapkan Filter
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Transactions Table */}
                <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <Receipt className="size-4" />
                            Daftar Transaksi
                        </CardTitle>
                        <CardDescription>
                            Ditemukan {transactions.total} transaksi sesuai filter
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs font-semibold uppercase text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
                                    <tr>
                                        <th className="px-4 py-3">No. Invoice</th>
                                        <th className="px-4 py-3">Waktu</th>
                                        <th className="px-4 py-3">Kasir</th>
                                        <th className="px-4 py-3">Pelanggan</th>
                                        <th className="px-4 py-3 text-center">Metode</th>
                                        <th className="px-4 py-3 text-right">Total Tagihan</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {transactions.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-neutral-500">
                                                Tidak ada riwayat transaksi yang ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        transactions.data.map((trx) => (
                                            <tr
                                                key={trx.id}
                                                className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40"
                                            >
                                                <td className="px-4 py-3 font-mono font-bold text-xs text-neutral-900 dark:text-neutral-100">
                                                    {trx.invoice_number}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-neutral-500 whitespace-nowrap">
                                                    {formatDate(trx.created_at)}
                                                </td>
                                                <td className="px-4 py-3 text-xs font-medium text-neutral-800 dark:text-neutral-200">
                                                    {trx.user?.name || 'Kasir'}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
                                                    {trx.customer_name || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase text-neutral-700 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                                                        {trx.payment_method}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                                                    {formatRupiah(trx.total)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge
                                                        variant={
                                                            trx.status === 'completed'
                                                                ? 'default'
                                                                : 'destructive'
                                                        }
                                                        className="text-xs"
                                                    >
                                                        {trx.status === 'completed'
                                                            ? 'Selesai'
                                                            : 'Dibatalkan'}
                                                    </Badge>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => setViewingTransaction(trx)}
                                                            className="h-8 gap-1 text-xs"
                                                        >
                                                            <Eye className="size-3.5" />
                                                            Detail
                                                        </Button>
                                                        {isAdmin && trx.status === 'completed' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    setCancellingTransaction(trx)
                                                                }
                                                                className="h-8 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30"
                                                                title="Batalkan Transaksi & Kembalikan Stok"
                                                            >
                                                                <Ban className="size-3.5" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="mt-4">
                            <Pagination links={transactions.links} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Detail Transaksi & Struk */}
            <Dialog
                open={!!viewingTransaction}
                onOpenChange={(open) => !open && setViewingTransaction(null)}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Detail Transaksi</DialogTitle>
                        <DialogDescription>
                            Rincian pembelian dan pembayaran untuk invoice{' '}
                            <strong>{viewingTransaction?.invoice_number}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    {viewingTransaction && (
                        <div className="rounded-lg border border-neutral-200 bg-white p-4 font-mono text-xs text-neutral-900 space-y-3 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100">
                            <div className="border-b border-neutral-200 pb-2.5 dark:border-neutral-800 space-y-1">
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Invoice:</span>
                                    <span className="font-bold">
                                        {viewingTransaction.invoice_number}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Tanggal:</span>
                                    <span>{formatDate(viewingTransaction.created_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Kasir:</span>
                                    <span>{viewingTransaction.user?.name}</span>
                                </div>
                                {viewingTransaction.customer_name && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-500">Pelanggan:</span>
                                        <span>{viewingTransaction.customer_name}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Status:</span>
                                    <span className="font-bold uppercase">
                                        {viewingTransaction.status}
                                    </span>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="border-b border-neutral-200 pb-2.5 dark:border-neutral-800 space-y-2">
                                <span className="font-bold block text-neutral-600 dark:text-neutral-400">
                                    ITEM DIBELI:
                                </span>
                                {viewingTransaction.items?.map((it, idx) => (
                                    <div key={idx}>
                                        <div className="font-semibold">{it.product_name}</div>
                                        <div className="flex justify-between text-neutral-500">
                                            <span>
                                                {it.quantity} x {formatRupiah(it.unit_price)}
                                            </span>
                                            <span className="font-bold text-neutral-900 dark:text-neutral-100">
                                                {formatRupiah(it.subtotal)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Summary */}
                            <div className="space-y-1 text-right">
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Subtotal:</span>
                                    <span>{formatRupiah(viewingTransaction.subtotal)}</span>
                                </div>
                                {Number(viewingTransaction.discount) > 0 && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span>Diskon:</span>
                                        <span>-{formatRupiah(viewingTransaction.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-sm pt-1 border-t border-neutral-200 dark:border-neutral-800">
                                    <span>TOTAL:</span>
                                    <span>{formatRupiah(viewingTransaction.total)}</span>
                                </div>
                                <div className="flex justify-between text-neutral-600 dark:text-neutral-400 pt-1">
                                    <span>
                                        Bayar ({viewingTransaction.payment_method.toUpperCase()}):
                                    </span>
                                    <span>{formatRupiah(viewingTransaction.amount_paid)}</span>
                                </div>
                                <div className="flex justify-between font-semibold">
                                    <span>Kembalian:</span>
                                    <span>{formatRupiah(viewingTransaction.change_due)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-row gap-2 sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setViewingTransaction(null)}
                            className="flex-1"
                        >
                            Tutup
                        </Button>
                        <Button
                            type="button"
                            onClick={() => window.print()}
                            className="flex-1 gap-1.5"
                        >
                            <Printer className="size-4" />
                            Cetak Struk
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Batalkan Transaksi */}
            <Dialog
                open={!!cancellingTransaction}
                onOpenChange={(open) => !open && setCancellingTransaction(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-rose-600 flex items-center gap-2">
                            <Ban className="size-5" />
                            Batalkan Transaksi?
                        </DialogTitle>
                        <DialogDescription>
                            Anda akan membatalkan invoice{' '}
                            <strong>{cancellingTransaction?.invoice_number}</strong> sebesar{' '}
                            <strong>{cancellingTransaction && formatRupiah(cancellingTransaction.total)}</strong>.
                            Stok produk yang terjual dalam transaksi ini akan otomatis dikembalikan ke inventori toko.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCancellingTransaction(null)}
                        >
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleCancelTransaction}>
                            Ya, Batalkan Transaksi & Kembalikan Stok
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

TransactionsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Riwayat Transaksi', href: '/transactions' },
    ],
};
