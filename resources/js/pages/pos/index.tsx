import { Head, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Check,
    CreditCard,
    DollarSign,
    Minus,
    Package,
    Plus,
    Printer,
    QrCode,
    Receipt,
    RefreshCw,
    Search,
    ShoppingBag,
    ShoppingCart,
    Trash2,
    Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { formatDate, formatRupiah } from '@/lib/format';
import type { CartItem, Category, Product, Transaction } from '@/types/pos';

interface PosIndexProps {
    products: Product[];
    categories: Category[];
}

export default function PosIndex({ products, categories }: PosIndexProps) {
    const pageProps = usePage().props as {
        auth?: { user?: { name: string } };
        flash?: { receipt?: Transaction; success?: string; error?: string };
    };

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [discount, setDiscount] = useState<number>(0);
    const [customerName, setCustomerName] = useState<string>('');

    // Payment modal state
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'qris' | 'card'>('cash');
    const [amountPaid, setAmountPaid] = useState<string>('');
    const [paymentNotes, setPaymentNotes] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Receipt modal state
    const [completedReceipt, setCompletedReceipt] = useState<Transaction | null>(null);
    const [lastShownReceiptId, setLastShownReceiptId] = useState<number | null>(null);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    // Handle flash receipt from server after successful checkout
    useEffect(() => {
        if (pageProps.flash?.receipt && pageProps.flash.receipt.id !== lastShownReceiptId) {
            setCompletedReceipt(pageProps.flash.receipt);
            setLastShownReceiptId(pageProps.flash.receipt.id);
            setCart([]);
            setDiscount(0);
            setCustomerName('');
            setIsPaymentOpen(false);
            setCheckoutError(null);
        }
    }, [pageProps.flash?.receipt, lastShownReceiptId]);

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesCategory =
                selectedCategory === 'all' || p.category_id === selectedCategory;
            const q = search.toLowerCase();
            const matchesSearch =
                p.name.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q) ||
                (p.barcode && p.barcode.toLowerCase().includes(q));
            return matchesCategory && matchesSearch;
        });
    }, [products, selectedCategory, search]);

    // Cart calculations
    const subtotal = useMemo(() => {
        return cart.reduce((acc, item) => {
            const price = Number(item.product.price);
            return acc + price * item.quantity;
        }, 0);
    }, [cart]);

    const actualDiscount = useMemo(() => {
        return Math.min(discount, subtotal);
    }, [discount, subtotal]);

    const total = useMemo(() => {
        return Math.max(0, subtotal - actualDiscount);
    }, [subtotal, actualDiscount]);

    const changeDue = useMemo(() => {
        const paid = parseFloat(amountPaid) || 0;
        return paid - total;
    }, [amountPaid, total]);

    // Cart actions
    const addToCart = (product: Product) => {
        if (product.stock <= 0) return;

        setCart((prev) => {
            const existingIndex = prev.findIndex((item) => item.product.id === product.id);
            if (existingIndex > -1) {
                const currentQty = prev[existingIndex].quantity;
                if (currentQty >= product.stock) {
                    alert(`Stok maksimal untuk ${product.name} adalah ${product.stock} pcs.`);
                    return prev;
                }
                const updated = [...prev];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    quantity: currentQty + 1,
                };
                return updated;
            } else {
                return [...prev, { product, quantity: 1 }];
            }
        });
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart((prev) => {
            return prev
                .map((item) => {
                    if (item.product.id === productId) {
                        const newQty = item.quantity + delta;
                        if (newQty <= 0) return null;
                        if (newQty > item.product.stock) {
                            alert(
                                `Stok tidak mencukupi. Sisa stok: ${item.product.stock} pcs.`
                            );
                            return item;
                        }
                        return { ...item, quantity: newQty };
                    }
                    return item;
                })
                .filter(Boolean) as CartItem[];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart((prev) => prev.filter((item) => item.product.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
        setDiscount(0);
    };

    // Quick barcode scan helper (adds immediately if exact SKU or barcode matches)
    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const trimmed = search.trim();
            const exactMatch = products.find(
                (p) =>
                    p.sku.toLowerCase() === trimmed.toLowerCase() ||
                    (p.barcode && p.barcode.toLowerCase() === trimmed.toLowerCase())
            );
            if (exactMatch && exactMatch.stock > 0) {
                addToCart(exactMatch);
                setSearch('');
            }
        }
    };

    // Quick cash suggestion buttons
    const quickCashOptions = useMemo(() => {
        const nominals = [total, 10000, 20000, 50000, 100000, 200000, 500000];
        const filtered = nominals.filter((val) => val >= total);
        return Array.from(new Set(filtered)).sort((a, b) => a - b).slice(0, 4);
    }, [total]);

    const openPaymentModal = () => {
        if (cart.length === 0) return;
        setAmountPaid(String(total));
        setCheckoutError(null);
        setIsPaymentOpen(true);
    };

    const handleCheckoutSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const paid = parseFloat(amountPaid) || 0;
        if (paid < total) {
            setCheckoutError('Jumlah uang pembayaran tidak mencukupi total tagihan!');
            return;
        }

        setCheckoutError(null);
        setIsSubmitting(true);
        router.post(
            '/pos/checkout',
            {
                items: cart.map((c) => ({
                    product_id: c.product.id,
                    quantity: c.quantity,
                })),
                customer_name: customerName || null,
                discount: actualDiscount,
                tax: 0,
                payment_method: paymentMethod,
                amount_paid: paid,
                notes: paymentNotes || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCheckoutError(null);
                },
                onError: (errors) => {
                    const firstMsg = Object.values(errors)[0] as string;
                    setCheckoutError(firstMsg || 'Terjadi kesalahan saat memproses transaksi.');
                },
                onFinish: () => setIsSubmitting(false),
            }
        );
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Head title="Point of Sale (Kasir)" />

            <div className="flex h-[calc(100vh-4.25rem)] flex-col lg:flex-row overflow-hidden">
                {/* Left Area: Products Catalog & Search (approx 65%) */}
                <div className="flex flex-1 flex-col overflow-y-auto border-r border-neutral-200 bg-neutral-50/40 p-4 lg:p-6 dark:border-neutral-800 dark:bg-neutral-950/40">
                    {/* Top Search & Filter Bar */}
                    <div className="flex flex-col gap-3 pb-4">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-3 size-4 text-neutral-400" />
                            <Input
                                placeholder="Scan Barcode atau ketik nama produk / SKU (tekan Enter untuk auto-add)..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                autoFocus
                                className="h-11 bg-white pl-10 text-sm shadow-xs dark:bg-neutral-900"
                            />
                        </div>

                        {/* Category Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                            <Button
                                size="sm"
                                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                                onClick={() => setSelectedCategory('all')}
                                className="h-8 rounded-full text-xs font-medium"
                            >
                                Semua
                            </Button>
                            {categories.map((cat) => (
                                <Button
                                    key={cat.id}
                                    size="sm"
                                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className="h-8 rounded-full text-xs font-medium whitespace-nowrap"
                                >
                                    {cat.name}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Products Grid */}
                    {filteredProducts.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center py-16 text-center text-neutral-400">
                            <Package className="size-12 stroke-1" />
                            <p className="mt-2 text-sm font-medium">Produk tidak ditemukan</p>
                            <p className="text-xs">Coba kata kunci pencarian atau kategori lain.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                            {filteredProducts.map((p) => {
                                const isOutOfStock = p.stock <= 0;
                                const cartItem = cart.find((i) => i.product.id === p.id);

                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => addToCart(p)}
                                        disabled={isOutOfStock}
                                        type="button"
                                        className={`group relative flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all duration-150 ${
                                            isOutOfStock
                                                ? 'cursor-not-allowed border-neutral-200 bg-neutral-100/70 opacity-60 dark:border-neutral-800 dark:bg-neutral-900/50'
                                                : 'cursor-pointer border-neutral-200/90 bg-white shadow-2xs hover:border-emerald-500 hover:shadow-md active:scale-[0.98] dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-emerald-500'
                                        }`}
                                    >
                                        {cartItem && (
                                            <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-emerald-600 font-bold text-xs text-white shadow-sm">
                                                {cartItem.quantity}
                                            </span>
                                        )}

                                        <div>
                                            <div className="flex items-center justify-between text-[11px] text-neutral-500">
                                                <span className="font-mono">{p.sku}</span>
                                                <span
                                                    className={`font-semibold ${
                                                        isOutOfStock
                                                            ? 'text-rose-500'
                                                            : p.stock <= p.min_stock_alert
                                                              ? 'text-amber-600'
                                                              : 'text-neutral-500'
                                                    }`}
                                                >
                                                    Stok: {p.stock}
                                                </span>
                                            </div>

                                            <h3 className="mt-1 text-sm font-semibold text-neutral-900 line-clamp-2 dark:text-neutral-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                                                {p.name}
                                            </h3>

                                            {p.category && (
                                                <span className="mt-1 inline-block text-[11px] text-neutral-400">
                                                    {p.category.name}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                                {formatRupiah(p.price)}
                                            </span>
                                            <div className="flex size-7 items-center justify-center rounded-md bg-neutral-100 text-neutral-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors dark:bg-neutral-800 dark:text-neutral-300">
                                                <Plus className="size-4" />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Right Area: Cart & Checkout (approx 35%) */}
                <div className="flex w-full flex-col border-t border-neutral-200 bg-white lg:w-96 xl:w-[420px] lg:border-t-0 dark:border-neutral-800 dark:bg-neutral-900">
                    {/* Cart Header */}
                    <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3.5 dark:border-neutral-800">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="size-5 text-emerald-600" />
                            <h2 className="font-bold text-neutral-900 dark:text-neutral-100">
                                Keranjang Kasir
                            </h2>
                            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                                {cart.reduce((a, b) => a + b.quantity, 0)} item
                            </span>
                        </div>
                        {cart.length > 0 && (
                            <button
                                onClick={clearCart}
                                type="button"
                                className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                            >
                                <Trash2 className="size-3.5" /> Kosongkan
                            </button>
                        )}
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 p-4 dark:divide-neutral-800">
                        {cart.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center py-12 text-center text-neutral-400">
                                <ShoppingBag className="size-12 stroke-1" />
                                <p className="mt-2 text-sm font-medium">Keranjang masih kosong</p>
                                <p className="text-xs">Klik produk di samping untuk menambahkan ke struk.</p>
                            </div>
                        ) : (
                            cart.map((item) => {
                                const itemSubtotal =
                                    Number(item.product.price) * item.quantity;

                                return (
                                    <div key={item.product.id} className="py-3 first:pt-0 last:pb-0">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                                                    {item.product.name}
                                                </h4>
                                                <p className="text-xs text-neutral-500">
                                                    {formatRupiah(item.product.price)} / pcs
                                                </p>
                                            </div>
                                            <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                                                {formatRupiah(itemSubtotal)}
                                            </span>
                                        </div>

                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800">
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(item.product.id, -1)
                                                    }
                                                    type="button"
                                                    className="flex size-7 items-center justify-center text-neutral-600 hover:bg-neutral-200 rounded-l-md dark:text-neutral-300 dark:hover:bg-neutral-700"
                                                >
                                                    <Minus className="size-3.5" />
                                                </button>
                                                <span className="w-8 text-center font-bold text-xs">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        updateQuantity(item.product.id, 1)
                                                    }
                                                    type="button"
                                                    className="flex size-7 items-center justify-center text-neutral-600 hover:bg-neutral-200 rounded-r-md dark:text-neutral-300 dark:hover:bg-neutral-700"
                                                >
                                                    <Plus className="size-3.5" />
                                                </button>
                                            </div>

                                            <button
                                                onClick={() => removeFromCart(item.product.id)}
                                                type="button"
                                                className="text-neutral-400 hover:text-rose-600 transition-colors"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Cart Summary & Checkout Footer */}
                    <div className="border-t border-neutral-200 bg-neutral-50/70 p-4 dark:border-neutral-800 dark:bg-neutral-950/60">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                                <span>Subtotal</span>
                                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                                    {formatRupiah(subtotal)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                                <span>Diskon Transaksi (Rp)</span>
                                <Input
                                    type="number"
                                    min="0"
                                    value={discount || ''}
                                    onChange={(e) =>
                                        setDiscount(Math.max(0, parseFloat(e.target.value) || 0))
                                    }
                                    placeholder="0"
                                    className="h-7 w-28 text-right text-xs bg-white dark:bg-neutral-900"
                                />
                            </div>

                            <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold text-neutral-900 dark:border-neutral-800 dark:text-neutral-100">
                                <span>Total Tagihan</span>
                                <span className="text-xl text-emerald-600 dark:text-emerald-400">
                                    {formatRupiah(total)}
                                </span>
                            </div>
                        </div>

                        <Button
                            onClick={openPaymentModal}
                            disabled={cart.length === 0}
                            size="lg"
                            className="mt-4 w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-base shadow-sm"
                        >
                            <CreditCard className="size-5" />
                            Bayar Sekarang ({formatRupiah(total)})
                        </Button>
                    </div>
                </div>
            </div>

            {/* Modal Pembayaran */}
            <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
                <DialogContent className="max-w-md">
                    <form onSubmit={handleCheckoutSubmit}>
                        <DialogHeader>
                            <DialogTitle>Penyelesaian Pembayaran</DialogTitle>
                            <DialogDescription>
                                Pilih metode pembayaran dan input nominal yang diterima.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            {/* Grand Total Box */}
                            <div className="rounded-xl bg-emerald-500/10 p-4 text-center border border-emerald-500/20">
                                <span className="text-xs font-medium text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">
                                    Total Yang Harus Dibayar
                                </span>
                                <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
                                    {formatRupiah(total)}
                                </div>
                            </div>

                            {checkoutError && (
                                <div className="rounded-lg bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-400 flex items-center gap-2">
                                    <AlertCircle className="size-4 shrink-0 text-rose-600" />
                                    <span>{checkoutError}</span>
                                </div>
                            )}

                            {/* Customer Name */}
                            <div className="grid gap-1.5">
                                <Label htmlFor="cust_name">Nama Pelanggan (Opsional)</Label>
                                <Input
                                    id="cust_name"
                                    placeholder="Contoh: Pelanggan Umum / Bpk. Rudi"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                />
                            </div>

                            {/* Payment Method Selector */}
                            <div className="grid gap-1.5">
                                <Label>Metode Pembayaran</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { id: 'cash', label: 'Tunai', icon: Wallet },
                                        { id: 'qris', label: 'QRIS', icon: QrCode },
                                        { id: 'transfer', label: 'Transfer', icon: RefreshCw },
                                        { id: 'card', label: 'Kartu', icon: CreditCard },
                                    ].map((m) => {
                                        const Icon = m.icon;
                                        const isSelected = paymentMethod === m.id;
                                        return (
                                            <button
                                                key={m.id}
                                                type="button"
                                                onClick={() => {
                                                    setPaymentMethod(m.id as any);
                                                    if (m.id !== 'cash') {
                                                        setAmountPaid(String(total));
                                                    }
                                                }}
                                                className={`flex flex-col items-center justify-center gap-1 rounded-lg border p-2 text-xs font-semibold transition-all ${
                                                    isSelected
                                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                                                        : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400'
                                                }`}
                                            >
                                                <Icon className="size-4" />
                                                {m.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Quick Nominal Buttons for Cash */}
                            {paymentMethod === 'cash' && (
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-neutral-500">Pilihan Nominal Cepat</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {quickCashOptions.map((nom, idx) => (
                                            <Button
                                                key={idx}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setAmountPaid(String(nom))}
                                                className="text-xs h-8"
                                            >
                                                {nom === total ? 'Uang Pas' : formatRupiah(nom)}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Amount Paid Input */}
                            <div className="grid gap-1.5">
                                <Label htmlFor="paid_amount">Nominal Uang Diterima (Rp)</Label>
                                <Input
                                    id="paid_amount"
                                    type="number"
                                    min="0"
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(e.target.value)}
                                    placeholder="0"
                                    required
                                    className="text-lg font-bold font-mono"
                                />
                            </div>

                            {/* Kembalian calculation */}
                            <div className="rounded-lg border p-3 bg-neutral-50 dark:bg-neutral-900/50">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-600 dark:text-neutral-400">
                                        Kembalian:
                                    </span>
                                    <span
                                        className={`font-bold font-mono text-base ${
                                            changeDue < 0
                                                ? 'text-rose-600'
                                                : 'text-emerald-600 dark:text-emerald-400'
                                        }`}
                                    >
                                        {changeDue < 0
                                            ? `Kurang ${formatRupiah(Math.abs(changeDue))}`
                                            : formatRupiah(changeDue)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsPaymentOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || changeDue < 0}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                            >
                                {isSubmitting ? 'Memproses Transaksi...' : 'Selesaikan Transaksi'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal Struk Transaksi (Receipt Print) */}
            <Dialog open={!!completedReceipt} onOpenChange={(open) => !open && setCompletedReceipt(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-emerald-600">
                            <Check className="size-5" />
                            Transaksi Berhasil!
                        </DialogTitle>
                        <DialogDescription>
                            Struk transaksi telah diterbitkan dan stok produk telah diperbarui.
                        </DialogDescription>
                    </DialogHeader>

                    {completedReceipt && (
                        <div
                            id="receipt-print-area"
                            className="rounded-lg border border-dashed border-neutral-300 bg-white p-5 font-mono text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                        >
                            <div className="text-center pb-3 border-b border-neutral-200 dark:border-neutral-800">
                                <h2 className="text-base font-bold">POS RETAIL STORE</h2>
                                <p className="text-[11px] text-neutral-500">
                                    Jl. Kemakmuran No. 10, Jakarta
                                </p>
                                <p className="text-[11px] text-neutral-500">Telp: 0812-3456-7890</p>
                            </div>

                            <div className="py-2.5 space-y-1 text-[11px] border-b border-neutral-200 dark:border-neutral-800">
                                <div className="flex justify-between">
                                    <span>No. Nota:</span>
                                    <span className="font-semibold">
                                        {completedReceipt.invoice_number}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Tanggal:</span>
                                    <span>{formatDate(completedReceipt.created_at)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Kasir:</span>
                                    <span>{completedReceipt.user?.name || pageProps.auth?.user?.name}</span>
                                </div>
                                {completedReceipt.customer_name && (
                                    <div className="flex justify-between">
                                        <span>Pelanggan:</span>
                                        <span>{completedReceipt.customer_name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Item List */}
                            <div className="py-3 border-b border-neutral-200 dark:border-neutral-800 space-y-2">
                                {completedReceipt.items?.map((it, idx) => (
                                    <div key={idx}>
                                        <div className="font-semibold">{it.product_name}</div>
                                        <div className="flex justify-between text-[11px] text-neutral-600 dark:text-neutral-400">
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

                            {/* Totals */}
                            <div className="py-2.5 space-y-1 text-right">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <span>{formatRupiah(completedReceipt.subtotal)}</span>
                                </div>
                                {Number(completedReceipt.discount) > 0 && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span>Diskon:</span>
                                        <span>-{formatRupiah(completedReceipt.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-sm pt-1 border-t border-neutral-200 dark:border-neutral-800">
                                    <span>TOTAL:</span>
                                    <span>{formatRupiah(completedReceipt.total)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] pt-1">
                                    <span>Bayar ({completedReceipt.payment_method.toUpperCase()}):</span>
                                    <span>{formatRupiah(completedReceipt.amount_paid)}</span>
                                </div>
                                <div className="flex justify-between text-[11px] font-semibold">
                                    <span>Kembalian:</span>
                                    <span>{formatRupiah(completedReceipt.change_due)}</span>
                                </div>
                            </div>

                            <div className="text-center pt-3 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500">
                                <p>Terima Kasih Atas Kunjungan Anda!</p>
                                <p>Barang yang sudah dibeli tidak dapat ditukar.</p>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="flex-row gap-2 sm:justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCompletedReceipt(null)}
                            className="flex-1"
                        >
                            Transaksi Baru
                        </Button>
                        <Button
                            type="button"
                            onClick={handlePrint}
                            className="flex-1 gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900"
                        >
                            <Printer className="size-4" />
                            Cetak Struk
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

PosIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Point of Sale (Kasir)', href: '/pos' },
    ],
};
