import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatRupiah } from '@/lib/format';
import type { Transaction } from '@/types/pos';

interface TransactionShowProps {
    transaction: Transaction;
}

export default function TransactionShow({ transaction }: TransactionShowProps) {
    return (
        <>
            <Head title={`Transaksi ${transaction.invoice_number}`} />

            <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" asChild className="gap-1 text-xs">
                        <Link href="/transactions">
                            <ArrowLeft className="size-3.5" />
                            Kembali ke Riwayat Transaksi
                        </Link>
                    </Button>
                    <Button onClick={() => window.print()} className="gap-2">
                        <Printer className="size-4" />
                        Cetak Struk
                    </Button>
                </div>

                <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-neutral-100 pb-4 dark:border-neutral-800">
                        <div>
                            <CardTitle className="text-xl font-bold font-mono">
                                {transaction.invoice_number}
                            </CardTitle>
                            <CardDescription>
                                Diterbitkan pada {formatDate(transaction.created_at)} oleh kasir{' '}
                                <strong>{transaction.user?.name}</strong>
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 font-semibold text-xs text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 uppercase">
                                {transaction.status}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-6">
                        {/* Transaction items table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs font-semibold uppercase text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
                                    <tr>
                                        <th className="px-4 py-3">Produk</th>
                                        <th className="px-4 py-3 font-mono">SKU</th>
                                        <th className="px-4 py-3 text-right">Harga Satuan</th>
                                        <th className="px-4 py-3 text-center">Kuantitas</th>
                                        <th className="px-4 py-3 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {transaction.items?.map((it) => (
                                        <tr key={it.id}>
                                            <td className="px-4 py-3 font-semibold text-neutral-900 dark:text-neutral-100">
                                                {it.product_name}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                                                {it.product_sku}
                                            </td>
                                            <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
                                                {formatRupiah(it.unit_price)}
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold">
                                                {it.quantity}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                                                {formatRupiah(it.subtotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary breakdown */}
                        <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-neutral-100 pt-4 dark:border-neutral-800">
                            <div className="space-y-1 text-xs text-neutral-500">
                                <div>Metode Pembayaran: <strong className="uppercase text-neutral-900 dark:text-neutral-100">{transaction.payment_method}</strong></div>
                                {transaction.customer_name && <div>Pelanggan: <strong className="text-neutral-900 dark:text-neutral-100">{transaction.customer_name}</strong></div>}
                                {transaction.notes && <div>Catatan: {transaction.notes}</div>}
                            </div>
                            <div className="w-full sm:w-72 space-y-2 text-sm">
                                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                    <span>Subtotal</span>
                                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">{formatRupiah(transaction.subtotal)}</span>
                                </div>
                                {Number(transaction.discount) > 0 && (
                                    <div className="flex justify-between text-emerald-600 font-semibold">
                                        <span>Diskon</span>
                                        <span>-{formatRupiah(transaction.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold text-neutral-900 dark:border-neutral-800 dark:text-neutral-100">
                                    <span>Total Akhir</span>
                                    <span className="text-xl text-emerald-600">{formatRupiah(transaction.total)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-neutral-500 pt-1">
                                    <span>Nominal Bayar</span>
                                    <span>{formatRupiah(transaction.amount_paid)}</span>
                                </div>
                                <div className="flex justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                                    <span>Kembalian</span>
                                    <span>{formatRupiah(transaction.change_due)}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

TransactionShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Riwayat Transaksi', href: '/transactions' },
        { title: 'Detail Transaksi', href: '#' },
    ],
};
