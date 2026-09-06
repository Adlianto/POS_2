import { Head, router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Search, Tag, Trash2 } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Pagination } from '@/components/pagination';
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
import type { Category, PaginatedData } from '@/types/pos';

interface CategoriesIndexProps {
    categories: PaginatedData<Category>;
    filters: {
        search?: string;
    };
}

export default function CategoriesIndex({ categories, filters }: CategoriesIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

    // Form create
    const createForm = useForm({
        name: '',
        slug: '',
        description: '',
    });

    // Form edit
    const editForm = useForm({
        name: '',
        slug: '',
        description: '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/categories', { search }, { preserveState: true, replace: true });
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post('/categories', {
            onSuccess: () => {
                setIsCreateOpen(false);
                createForm.reset();
            },
        });
    };

    const openEdit = (cat: Category) => {
        setEditingCategory(cat);
        editForm.setData({
            name: cat.name,
            slug: cat.slug,
            description: cat.description || '',
        });
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCategory) return;
        editForm.put(`/categories/${editingCategory.id}`, {
            onSuccess: () => {
                setEditingCategory(null);
                editForm.reset();
            },
        });
    };

    const handleDelete = () => {
        if (!deletingCategory) return;
        router.delete(`/categories/${deletingCategory.id}`, {
            onSuccess: () => setDeletingCategory(null),
        });
    };

    return (
        <>
            <Head title="Manajemen Kategori" />

            <div className="flex flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                            Manajemen Kategori Produk
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Kelola pengelompokan produk untuk mempermudah pencarian dan filter di kasir POS.
                        </p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                        <Plus className="size-4" />
                        Tambah Kategori
                    </Button>
                </div>

                {/* Filter & Search */}
                <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 size-4 text-neutral-400" />
                                <Input
                                    placeholder="Cari kategori berdasarkan nama atau deskripsi..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit" variant="secondary">
                                Cari
                            </Button>
                            {filters.search && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => {
                                        setSearch('');
                                        router.get('/categories');
                                    }}
                                >
                                    Reset
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Categories Table */}
                <Card className="border-neutral-200/80 shadow-xs dark:border-neutral-800">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">Daftar Kategori</CardTitle>
                        <CardDescription>
                            Total {categories.total} kategori terdaftar dalam sistem
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b border-neutral-200 bg-neutral-50/50 text-xs font-semibold uppercase text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900/50 dark:text-neutral-400">
                                    <tr>
                                        <th className="px-4 py-3">Nama Kategori</th>
                                        <th className="px-4 py-3">Slug / Kode URL</th>
                                        <th className="px-4 py-3">Deskripsi</th>
                                        <th className="px-4 py-3 text-center">Jumlah Produk</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {categories.data.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-neutral-500">
                                                Tidak ada kategori ditemukan.
                                            </td>
                                        </tr>
                                    ) : (
                                        categories.data.map((cat) => (
                                            <tr
                                                key={cat.id}
                                                className="hover:bg-neutral-50/80 dark:hover:bg-neutral-900/40"
                                            >
                                                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                                                    <Tag className="size-4 text-neutral-400" />
                                                    {cat.name}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                                                    {cat.slug}
                                                </td>
                                                <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400 max-w-xs truncate">
                                                    {cat.description || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
                                                        {cat.products_count ?? 0} produk
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => openEdit(cat)}
                                                            className="size-8"
                                                        >
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => setDeletingCategory(cat)}
                                                            className="size-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
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
                            <Pagination links={categories.links} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Tambah Kategori */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <form onSubmit={handleCreateSubmit}>
                        <DialogHeader>
                            <DialogTitle>Tambah Kategori Baru</DialogTitle>
                            <DialogDescription>
                                Masukkan nama dan deskripsi untuk membuat kategori produk baru.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nama Kategori</Label>
                                <Input
                                    id="name"
                                    placeholder="Contoh: Makanan Instan"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={createForm.errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="slug">Slug (Opsional)</Label>
                                <Input
                                    id="slug"
                                    placeholder="Otomatis digenerate jika dikosongkan"
                                    value={createForm.data.slug}
                                    onChange={(e) => createForm.setData('slug', e.target.value)}
                                />
                                <InputError message={createForm.errors.slug} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Deskripsi</Label>
                                <Input
                                    id="description"
                                    placeholder="Keterangan singkat kategori..."
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
                                {createForm.processing ? 'Menyimpan...' : 'Simpan Kategori'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Edit Kategori */}
            <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                <DialogContent>
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit Kategori</DialogTitle>
                            <DialogDescription>Perbarui data kategori produk.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit_name">Nama Kategori</Label>
                                <Input
                                    id="edit_name"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={editForm.errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_slug">Slug</Label>
                                <Input
                                    id="edit_slug"
                                    value={editForm.data.slug}
                                    onChange={(e) => editForm.setData('slug', e.target.value)}
                                    required
                                />
                                <InputError message={editForm.errors.slug} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit_description">Deskripsi</Label>
                                <Input
                                    id="edit_description"
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
                                onClick={() => setEditingCategory(null)}
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

            {/* Modal Konfirmasi Hapus */}
            <Dialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Hapus Kategori</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin menghapus kategori{' '}
                            <strong>{deletingCategory?.name}</strong>? Tindakan ini tidak dapat
                            dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDeletingCategory(null)}
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

CategoriesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Kategori', href: '/categories' },
    ],
};
