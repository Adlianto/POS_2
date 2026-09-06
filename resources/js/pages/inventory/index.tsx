import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    Boxes,
    Calendar,
    Check,
    Filter,
    History,
    MinusCircle,
    PlusCircle,
    RefreshCw,
    Search,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
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
import { formatDate } from '@/lib/format';
import type { PaginatedData, Product, StockMovement } from '@/types/pos';

interface InventoryIndexProps {
    movements: PaginatedData<StockMovement>;
    products: Pick<Product, 'id' | 'sku' | 'name' | 'stock'>[];
    filters: {
        search?: string;
        type?: string;
        product_id?: string;
        start_date?: string;
        end_date?: string;
    };
}

export default function InventoryIndex({ movements, products, filters }: InventoryIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || 'all');
    const [productId, setProductId] = useState(filters.product_id || 'all');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');

    // Modal forms state
    const [activeModal, setActiveModal] = useState<'in' | 'out' | 'adjustment' | null>(null);

    const movementForm = useForm({
        product_id: '',
        type: 'in' as 'in' | 'out' | 'adjustment',
        quantity: '',
        reference_number: '',
        notes: '',
    });

    const openModal = (modalType: 'in' | 'out' | 'adjustment') => {
        setActiveModal(modalType);
        movementForm.reset();
        movementForm.setData('type', modalType);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        movementForm.post('/inventory/movement', {
            onSuccess: () => {
                setActiveModal(null);
                movementForm.reset();
            },
        });
    };

    const applyFilters = () => {
        router.get(
            '/inventory',
            {
                search: search || undefined,
                type: type !== 'all' ? type : undefined,
                product_id: productId !== 'all' ? productId : undefined,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
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
        setType('all');
        setProductId('all');
        setStartDate('');
        setEndDate('');
        router.get('/inventory');
    };

    const selectedProductForAdjustment = products.find(
        (p) => String(p.id) === movementForm.data.product_id
    );

    return (
        <>
            <Head title="Inventori & Mutasi Stok" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header & Quick Action Buttons */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Inventori & Riwayat Mutasi Stok
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Kelola penerimaan barang masuk, pengeluaran barang rusak, dan stock opname fisik.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            onClick={() => openModal('in')}
                            className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <PlusCircle className="size-4" />
                            Stok Masuk
                        </Button>
                        <Button
                            onClick={() => openModal('out')}
                            variant="outline"
                            className="gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400"
                        >
                            <MinusCircle className="size-4" />
                            Stok Keluar
                        </Button>
                        <Button
                            onClick={() => openModal('adjustment')}
                            variant="secondary"
                            className="gap-1.5"
                        >
                            <RefreshCw className="size-4" />
                            Penyesuaian (Opname)
                        </Button>
                    </div>
                </div>

                {/* Filter & Search Card */}
                <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                <div className="relative lg:col-span-2">
                                    <Search className="absolute left-3 top-2.5 size-4 text-neutral-400" />
                                    <Input
                                        placeholder="Cari referensi, catatan, atau produk..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>

                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Semua Jenis Mutasi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Jenis</SelectItem>
                                        <SelectItem value="in">Stok Masuk</SelectItem>
                                        <SelectItem value="out">Stok Keluar</SelectItem>
                                        <SelectItem value="adjustment">Penyesuaian Fisik</SelectItem>
                                        <SelectItem value="sale">Penjualan Kasir</SelectItem>
                                        <SelectItem value="cancelled">Retur / Dibatalkan</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center gap-1">
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        placeholder="Mulai"
                                        className="text-xs"
                                    />
                                </div>

                                <div className="flex items-center gap-1">
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        placeholder="Sampai"
                                        className="text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                                    Reset
                                </Button>
                                <Button type="submit" size="sm" className="gap-1">
                                    <Filter className="size-3.5" />
                                    Terapkan Filter
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Stock Movements Log Table */}
                <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <History className="size-4" />
                            Log Riwayat Perubahan Stok
                        </CardTitle>
                        <CardDescription>
                            Setiap penambahan, pengurangan, dan transaksi kasir tercatat secara otomatis
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs font-semibold uppercase text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
                                    <tr>
                                        <th className="px-4 py-3">Waktu</th>
                                        <th className="px-4 py-3">Produk</th>
                                        <th className="px-4 py-3 text-center">Jenis Mutasi</th>
                                        <th className="px-4 py-3 text-right">Perubahan</th>
                                        <th className="px-4 py-3 text-center">Sebelum / Sesudah</th>
                                        <th className="px-4 py-3">Petugas</th>
                                        <th className="px-4 py-3">Catatan / Ref</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {movements.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-neutral-500">
                                                Belum ada catatan mutasi stok yang sesuai.
                                            </td>
                                        </tr>
                                    ) : (
                                        movements.data.map((m) => {
                                            const isPositive = m.quantity > 0;
                                            return (
                                                <tr
                                                    key={m.id}
                                                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40"
                                                >
                                                    <td className="px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400 whitespace-nowrap">
                                                        {formatDate(m.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                            {m.product?.name || 'Produk Dihapus'}
                                                        </div>
                                                        <div className="text-xs font-mono text-neutral-500">
                                                            {m.product?.sku}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        {m.type === 'in' && (
                                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                                                                Stok Masuk
                                                            </Badge>
                                                        )}
                                                        {m.type === 'out' && (
                                                            <Badge className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400">
                                                                Stok Keluar
                                                            </Badge>
                                                        )}
                                                        {m.type === 'adjustment' && (
                                                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400">
                                                                Penyesuaian
                                                            </Badge>
                                                        )}
                                                        {m.type === 'sale' && (
                                                            <Badge className="bg-neutral-100 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300">
                                                                Penjualan POS
                                                            </Badge>
                                                        )}
                                                        {m.type === 'cancelled' && (
                                                            <Badge className="bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400">
                                                                Retur / Batal
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono font-semibold">
                                                        <span
                                                            className={
                                                                isPositive
                                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                                    : 'text-rose-600 dark:text-rose-400'
                                                            }
                                                        >
                                                            {isPositive ? `+${m.quantity}` : m.quantity} pcs
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                                        <span>{m.stock_before}</span>
                                                        <span className="mx-1.5 text-neutral-400">→</span>
                                                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                                                            {m.stock_after}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
                                                        {m.user?.name || 'Sistem'}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs">
                                                        {m.reference_number && (
                                                            <div className="font-mono font-medium text-neutral-700 dark:text-neutral-300">
                                                                Ref: {m.reference_number}
                                                            </div>
                                                        )}
                                                        <div className="text-neutral-500">
                                                            {m.notes || '-'}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="mt-4">
                            <Pagination links={movements.links} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Input Mutasi Stok (Stok Masuk, Keluar, Adjustment) */}
            <Dialog open={!!activeModal} onOpenChange={(open) => !open && setActiveModal(null)}>
                <DialogContent>
                    <form onSubmit={handleFormSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {activeModal === 'in' && 'Catat Stok Masuk (Restock)'}
                                {activeModal === 'out' && 'Catat Stok Keluar (Rusak / Hilang)'}
                                {activeModal === 'adjustment' && 'Penyesuaian Stok (Stock Opname)'}
                            </DialogTitle>
                            <DialogDescription>
                                {activeModal === 'in' &&
                                    'Tambahkan kuantitas barang yang baru diterima dari supplier ke stok aktif.'}
                                {activeModal === 'out' &&
                                    'Kurangi stok barang yang kadaluarsa, rusak, atau terbuang.'}
                                {activeModal === 'adjustment' &&
                                    'Sesuaikan nilai stok sistem dengan jumlah hitungan fisik riil di toko.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="m_prod">Pilih Produk</Label>
                                <Select
                                    value={movementForm.data.product_id}
                                    onValueChange={(val) => movementForm.setData('product_id', val)}
                                >
                                    <SelectTrigger id="m_prod">
                                        <SelectValue placeholder="Pilih produk..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.name} (Stok saat ini: {p.stock})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={movementForm.errors.product_id} />
                            </div>

                            {selectedProductForAdjustment && (
                                <div className="rounded-md bg-neutral-50 p-3 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
                                    Stok saat ini di sistem:{' '}
                                    <strong className="text-neutral-900 dark:text-neutral-100 text-sm">
                                        {selectedProductForAdjustment.stock} pcs
                                    </strong>
                                </div>
                            )}

                            <div className="grid gap-2">
                                <Label htmlFor="m_qty">
                                    {activeModal === 'adjustment'
                                        ? 'Jumlah Stok Fisik Riil (Target)'
                                        : 'Kuantitas (pcs)'}
                                </Label>
                                <Input
                                    id="m_qty"
                                    type="number"
                                    min="0"
                                    placeholder={
                                        activeModal === 'adjustment'
                                            ? 'Masukkan jumlah hasil hitungan fisik'
                                            : 'Masukkan jumlah pcs'
                                    }
                                    value={movementForm.data.quantity}
                                    onChange={(e) => movementForm.setData('quantity', e.target.value)}
                                    required
                                />
                                <InputError message={movementForm.errors.quantity} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="m_ref">No. Referensi / Surat Jalan (Opsional)</Label>
                                <Input
                                    id="m_ref"
                                    placeholder="Contoh: PO-2026-001 atau INV-SUP-12"
                                    value={movementForm.data.reference_number}
                                    onChange={(e) =>
                                        movementForm.setData('reference_number', e.target.value)
                                    }
                                />
                                <InputError message={movementForm.errors.reference_number} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="m_notes">Catatan / Alasan</Label>
                                <Input
                                    id="m_notes"
                                    placeholder="Keterangan tambahan..."
                                    value={movementForm.data.notes}
                                    onChange={(e) => movementForm.setData('notes', e.target.value)}
                                />
                                <InputError message={movementForm.errors.notes} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setActiveModal(null)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={movementForm.processing}>
                                {movementForm.processing ? 'Menyimpan...' : 'Simpan Mutasi'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

InventoryIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Inventori & Stok', href: '/inventory' },
    ],
};
