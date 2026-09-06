import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Boxes,
    CheckCircle2,
    Filter,
    Package,
    Pencil,
    Plus,
    Search,
    Trash2,
    XCircle,
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
import { formatRupiah } from '@/lib/format';
import type { Category, PaginatedData, Product } from '@/types/pos';

interface ProductsIndexProps {
    products: PaginatedData<Product>;
    categories: Category[];
    filters: {
        search?: string;
        category_id?: string;
        status?: string;
        low_stock?: boolean;
    };
}

export default function ProductsIndex({ products, categories, filters }: ProductsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || 'all');
    const [status, setStatus] = useState(filters.status || 'all');
    const [lowStockOnly, setLowStockOnly] = useState(filters.low_stock || false);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

    const createForm = useForm({
        category_id: '',
        sku: '',
        barcode: '',
        name: '',
        cost_price: '',
        price: '',
        stock: '0',
        min_stock_alert: '5',
        status: 'active',
        description: '',
    });

    const editForm = useForm({
        category_id: '',
        sku: '',
        barcode: '',
        name: '',
        cost_price: '',
        price: '',
        stock: '0',
        min_stock_alert: '5',
        status: 'active',
        description: '',
    });

    const applyFilters = () => {
        router.get(
            '/products',
            {
                search: search || undefined,
                category_id: categoryId !== 'all' ? categoryId : undefined,
                status: status !== 'all' ? status : undefined,
                low_stock: lowStockOnly ? '1' : undefined,
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
        setCategoryId('all');
        setStatus('all');
        setLowStockOnly(false);
        router.get('/products');
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/products', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const openEdit = (p: Product) => {
        setEditingProduct(p);
        editForm.setData({
            category_id: p.category_id ? String(p.category_id) : '',
            sku: p.sku,
            barcode: p.barcode || '',
            name: p.name,
            cost_price: String(p.cost_price),
            price: String(p.price),
            stock: String(p.stock),
            min_stock_alert: String(p.min_stock_alert),
            status: p.status,
            description: p.description || '',
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        editForm.put(`/products/${editingProduct.id}`, {
            onSuccess: () => {
                setEditingProduct(null);
                editForm.reset();
            },
        });
    };

    const handleDelete = () => {
        if (!deletingProduct) return;
        router.delete(`/products/${deletingProduct.id}`, {
            onSuccess: () => setDeletingProduct(null),
        });
    };

    // Auto-generate SKU helper for new product
    const generateSku = () => {
        const rand = Math.floor(1000 + Math.random() * 9000);
        createForm.setData('sku', `PRD-${rand}`);
    };

    return (
        <>
            <Head title="Manajemen Produk" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Katalog & Manajemen Produk
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Kelola harga jual, harga modal, SKU, serta batas minimal stok inventori.
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                        <Plus className="size-4" />
                        Tambah Produk
                    </Button>
                </div>

                {/* Filter & Search Bar */}
                <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 size-4 text-neutral-400" />
                                    <Input
                                        placeholder="Cari SKU, Barcode, Nama..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>

                                <Select value={categoryId} onValueChange={setCategoryId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Kategori</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status Produk" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Semua Status</SelectItem>
                                        <SelectItem value="active">Aktif</SelectItem>
                                        <SelectItem value="inactive">Nonaktif</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant={lowStockOnly ? 'default' : 'outline'}
                                        onClick={() => setLowStockOnly(!lowStockOnly)}
                                        className="flex-1 gap-1 text-xs"
                                    >
                                        <AlertTriangle className="size-3.5" />
                                        {lowStockOnly ? 'Hanya Stok Menipis' : 'Filter Stok Menipis'}
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2">
                                <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
                                    Reset Filter
                                </Button>
                                <Button type="submit" size="sm" className="gap-1">
                                    <Filter className="size-3.5" />
                                    Terapkan Filter
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Product Table */}
                <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Daftar Produk</CardTitle>
                        <CardDescription>
                            Ditemukan {products.total} produk dalam inventori
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs font-semibold uppercase text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
                                    <tr>
                                        <th className="px-4 py-3">Produk</th>
                                        <th className="px-4 py-3">Kategori</th>
                                        <th className="px-4 py-3 text-right">Harga Beli</th>
                                        <th className="px-4 py-3 text-right">Harga Jual</th>
                                        <th className="px-4 py-3 text-center">Stok Fisik</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {products.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-neutral-500">
                                                Tidak ada produk yang cocok dengan pencarian.
                                            </td>
                                        </tr>
                                    ) : (
                                        products.data.map((p) => {
                                            const isLow = p.stock <= p.min_stock_alert;
                                            return (
                                                <tr
                                                    key={p.id}
                                                    className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40"
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex size-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
                                                                <Package className="size-5" />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                                    {p.name}
                                                                </div>
                                                                <div className="flex items-center gap-2 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                                                                    <span>SKU: {p.sku}</span>
                                                                    {p.barcode && <span>• {p.barcode}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                                        {p.category?.name || (
                                                            <span className="text-neutral-400 italic">
                                                                Umum
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-neutral-600 dark:text-neutral-400">
                                                        {formatRupiah(p.cost_price)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {formatRupiah(p.price)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <div className="inline-flex items-center gap-1.5">
                                                            <span
                                                                className={`font-semibold ${
                                                                    isLow
                                                                        ? 'text-amber-600 dark:text-amber-400 font-bold'
                                                                        : 'text-neutral-900 dark:text-neutral-100'
                                                                }`}
                                                            >
                                                                {p.stock}
                                                            </span>
                                                            {isLow && (
                                                                <AlertTriangle className="size-3.5 text-amber-500" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge
                                                            variant={
                                                                p.status === 'active'
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                            className="text-xs"
                                                        >
                                                            {p.status === 'active'
                                                                ? 'Aktif'
                                                                : 'Nonaktif'}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex justify-end gap-1">
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => openEdit(p)}
                                                                className="size-8"
                                                            >
                                                                <Pencil className="size-4" />
                                                            </Button>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                onClick={() => setDeletingProduct(p)}
                                                                className="size-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                            >
                                                                <Trash2 className="size-4" />
                                                            </Button>
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
                            <Pagination links={products.links} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Tambah Produk */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-xl">
                    <form onSubmit={handleCreateSubmit}>
                        <DialogHeader>
                            <DialogTitle>Tambah Produk Baru</DialogTitle>
                            <DialogDescription>
                                Masukkan rincian harga, kategori, dan stok awal produk.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4 sm:grid-cols-2">
                            <div className="sm:col-span-2 grid gap-2">
                                <Label htmlFor="p_name">Nama Produk</Label>
                                <Input
                                    id="p_name"
                                    placeholder="Contoh: Kopi Kapal Api 200g"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={createForm.errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="p_sku">SKU / Kode Produk</Label>
                                    <button
                                        type="button"
                                        onClick={generateSku}
                                        className="text-xs text-blue-600 hover:underline"
                                    >
                                        Auto Generate
                                    </button>
                                </div>
                                <Input
                                    id="p_sku"
                                    placeholder="SKU unik"
                                    value={createForm.data.sku}
                                    onChange={(e) => createForm.setData('sku', e.target.value)}
                                    required
                                />
                                <InputError message={createForm.errors.sku} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="p_barcode">Barcode (Opsional)</Label>
                                <Input
                                    id="p_barcode"
                                    placeholder="Nomor barcode / scanner"
                                    value={createForm.data.barcode}
                                    onChange={(e) => createForm.setData('barcode', e.target.value)}
                                />
                                <InputError message={createForm.errors.barcode} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="p_cat">Kategori</Label>
                                <Select
                                    value={createForm.data.category_id}
                                    onValueChange={(val) => createForm.setData('category_id', val)}
                                >
                                    <SelectTrigger id="p_cat">
                                        <SelectValue placeholder="Pilih Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={createForm.errors.category_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="p_status">Status Penjualan</Label>
                                <Select
                                    value={createForm.data.status}
                                    onValueChange={(val: 'active' | 'inactive') =>
                                        createForm.setData('status', val)
                                    }
                                >
                                    <SelectTrigger id="p_status">
                                        <SelectValue placeholder="Pilih Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Aktif (Dijual)</SelectItem>
                                        <SelectItem value="inactive">Nonaktif (Diarsipkan)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={createForm.errors.status} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="p_cost">Harga Beli / Modal (Rp)</Label>
                                <Input
                                    id="p_cost"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={createForm.data.cost_price}
                                    onChange={(e) => createForm.setData('cost_price', e.target.value)}
                                    required
                                />
                                <InputError message={createForm.errors.cost_price} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="p_price">Harga Jual Kasir (Rp)</Label>
                                <Input
                                    id="p_price"
                                    type="number"
                                    min="0"
                                    placeholder="0"
                                    value={createForm.data.price}
                                    onChange={(e) => createForm.setData('price', e.target.value)}
                                    required
                                />
                                <InputError message={createForm.errors.price} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="p_stock">Stok Awal</Label>
                                <Input
                                    id="p_stock"
                                    type="number"
                                    min="0"
                                    value={createForm.data.stock}
                                    onChange={(e) => createForm.setData('stock', e.target.value)}
                                    required
                                />
                                <InputError message={createForm.errors.stock} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="p_alert">Batas Peringatan Stok Minimum</Label>
                                <Input
                                    id="p_alert"
                                    type="number"
                                    min="0"
                                    value={createForm.data.min_stock_alert}
                                    onChange={(e) =>
                                        createForm.setData('min_stock_alert', e.target.value)
                                    }
                                    required
                                />
                                <InputError message={createForm.errors.min_stock_alert} />
                            </div>

                            <div className="sm:col-span-2 grid gap-2">
                                <Label htmlFor="p_desc">Deskripsi Produk (Opsional)</Label>
                                <Input
                                    id="p_desc"
                                    placeholder="Keterangan singkat produk..."
                                    value={createForm.data.description}
                                    onChange={(e) => createForm.setData('description', e.target.value)}
                                />
                                <InputError message={createForm.errors.description} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCreateOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={createForm.processing}>
                                {createForm.processing ? 'Menyimpan...' : 'Simpan Produk'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Edit Produk */}
            <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
                <DialogContent className="max-w-xl">
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit Data Produk</DialogTitle>
                            <DialogDescription>
                                Perbarui informasi nama, harga, dan ketersediaan produk.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4 sm:grid-cols-2">
                            <div className="sm:col-span-2 grid gap-2">
                                <Label htmlFor="ep_name">Nama Produk</Label>
                                <Input
                                    id="ep_name"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={editForm.errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="ep_sku">SKU / Kode Produk</Label>
                                <Input
                                    id="ep_sku"
                                    value={editForm.data.sku}
                                    onChange={(e) => editForm.setData('sku', e.target.value)}
                                    required
                                />
                                <InputError message={editForm.errors.sku} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="ep_barcode">Barcode (Opsional)</Label>
                                <Input
                                    id="ep_barcode"
                                    value={editForm.data.barcode}
                                    onChange={(e) => editForm.setData('barcode', e.target.value)}
                                />
                                <InputError message={editForm.errors.barcode} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="ep_cat">Kategori</Label>
                                <Select
                                    value={editForm.data.category_id}
                                    onValueChange={(val) => editForm.setData('category_id', val)}
                                >
                                    <SelectTrigger id="ep_cat">
                                        <SelectValue placeholder="Pilih Kategori" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editForm.errors.category_id} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="ep_status">Status Penjualan</Label>
                                <Select
                                    value={editForm.data.status}
                                    onValueChange={(val: 'active' | 'inactive') =>
                                        editForm.setData('status', val)
                                    }
                                >
                                    <SelectTrigger id="ep_status">
                                        <SelectValue placeholder="Pilih Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Aktif (Dijual)</SelectItem>
                                        <SelectItem value="inactive">Nonaktif (Diarsipkan)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <InputError message={editForm.errors.status} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="ep_cost">Harga Beli / Modal (Rp)</Label>
                                <Input
                                    id="ep_cost"
                                    type="number"
                                    min="0"
                                    value={editForm.data.cost_price}
                                    onChange={(e) => editForm.setData('cost_price', e.target.value)}
                                    required
                                />
                                <InputError message={editForm.errors.cost_price} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="ep_price">Harga Jual Kasir (Rp)</Label>
                                <Input
                                    id="ep_price"
                                    type="number"
                                    min="0"
                                    value={editForm.data.price}
                                    onChange={(e) => editForm.setData('price', e.target.value)}
                                    required
                                />
                                <InputError message={editForm.errors.price} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="ep_stock">Stok</Label>
                                <Input
                                    id="ep_stock"
                                    type="number"
                                    min="0"
                                    value={editForm.data.stock}
                                    onChange={(e) => editForm.setData('stock', e.target.value)}
                                    required
                                />
                                <InputError message={editForm.errors.stock} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="ep_alert">Batas Peringatan Stok</Label>
                                <Input
                                    id="ep_alert"
                                    type="number"
                                    min="0"
                                    value={editForm.data.min_stock_alert}
                                    onChange={(e) =>
                                        editForm.setData('min_stock_alert', e.target.value)
                                    }
                                    required
                                />
                                <InputError message={editForm.errors.min_stock_alert} />
                            </div>

                            <div className="sm:col-span-2 grid gap-2">
                                <Label htmlFor="ep_desc">Deskripsi</Label>
                                <Input
                                    id="ep_desc"
                                    value={editForm.data.description}
                                    onChange={(e) => editForm.setData('description', e.target.value)}
                                />
                                <InputError message={editForm.errors.description} />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingProduct(null)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Hapus Produk */}
            <Dialog open={!!deletingProduct} onOpenChange={(open) => !open && setDeletingProduct(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Produk</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus produk <strong>{deletingProduct?.name}</strong>?
                            Jika produk sudah memiliki riwayat transaksi, produk sebaiknya dinonaktifkan alih-alih dihapus.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeletingProduct(null)}
                        >
                            Batal
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Hapus
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

ProductsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Produk', href: '/products' },
    ],
};
