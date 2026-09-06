<?php

namespace App\Http\Controllers;

use App\Http\Requests\PosCheckoutRequest;
use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    /**
     * Display the POS cashier interface.
     */
    public function index(Request $request): Response
    {
        $categories = Category::orderBy('name')->get(['id', 'name']);

        $products = Product::with('category')
            ->active()
            ->orderBy('name')
            ->get();

        return Inertia::render('pos/index', [
            'products' => $products,
            'categories' => $categories,
        ]);
    }

    /**
     * Search product by barcode or SKU quickly (API / JSON).
     */
    public function findProduct(Request $request): JsonResponse
    {
        $code = $request->input('code');

        $product = Product::with('category')
            ->active()
            ->where(function ($q) use ($code) {
                $q->where('sku', $code)
                    ->orWhere('barcode', $code);
            })
            ->first();

        if (! $product) {
            return response()->json(['message' => 'Produk tidak ditemukan'], 404);
        }

        return response()->json(['product' => $product]);
    }

    /**
     * Process POS checkout with atomic database transaction.
     */
    public function checkout(PosCheckoutRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $itemsData = $validated['items'];
        $customerName = $validated['customer_name'] ?? null;
        $discount = (float) ($validated['discount'] ?? 0);
        $tax = (float) ($validated['tax'] ?? 0);
        $paymentMethod = $validated['payment_method'];
        $amountPaid = (float) $validated['amount_paid'];
        $notes = $validated['notes'] ?? null;
        $user = $request->user();

        // Extract product IDs and sort to prevent deadlock on concurrent multi-row locking
        $productQuantities = [];
        foreach ($itemsData as $item) {
            $pid = (int) $item['product_id'];
            $productQuantities[$pid] = ($productQuantities[$pid] ?? 0) + (int) $item['quantity'];
        }
        $productIds = array_keys($productQuantities);
        sort($productIds);

        // Atomic lock per cashier to prevent accidental double-click duplicate checkout
        $lock = Cache::lock('pos_checkout_user_'.$user->id, 5);
        if (! $lock->get()) {
            throw ValidationException::withMessages([
                'items' => 'Transaksi sebelumnya sedang diproses. Mohon tunggu sejenak.',
            ]);
        }

        try {
            $newTransaction = DB::transaction(function () use (
                $productIds,
                $productQuantities,
                $customerName,
                $discount,
                $tax,
                $paymentMethod,
                $amountPaid,
                $notes,
                $user
            ) {
                // Lock products in sorted ascending order to prevent deadlocks
                $products = Product::whereIn('id', $productIds)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                $subtotal = 0;
                $itemsToCreate = [];

                foreach ($productQuantities as $productId => $qty) {
                    /** @var Product|null $product */
                    $product = $products->get($productId);

                    if (! $product) {
                        throw ValidationException::withMessages([
                            'items' => "Produk dengan ID {$productId} tidak ditemukan.",
                        ]);
                    }

                    if ($product->status !== 'active') {
                        throw ValidationException::withMessages([
                            'items' => "Produk '{$product->name}' saat ini sedang dinonaktifkan.",
                        ]);
                    }

                    if ($product->stock < $qty) {
                        throw ValidationException::withMessages([
                            'items' => "Stok untuk produk '{$product->name}' tidak mencukupi. Sisa stok: {$product->stock}, diminta: {$qty}.",
                        ]);
                    }

                    $itemSubtotal = $product->price * $qty;
                    $subtotal += $itemSubtotal;

                    $itemsToCreate[] = [
                        'product' => $product,
                        'quantity' => $qty,
                        'unit_price' => $product->price,
                        'cost_price' => $product->cost_price,
                        'subtotal' => $itemSubtotal,
                    ];
                }

                // Cap discount to subtotal
                $actualDiscount = min($discount, $subtotal);
                $total = max(0, ($subtotal - $actualDiscount) + $tax);

                if ($amountPaid < $total) {
                    throw ValidationException::withMessages([
                        'amount_paid' => 'Jumlah pembayaran (Rp '.number_format($amountPaid, 0, ',', '.').') kurang dari total tagihan (Rp '.number_format($total, 0, ',', '.').').',
                    ]);
                }

                $changeDue = $amountPaid - $total;

                // Generate unique invoice number: TRX-YYYYMMDD-HHIISS-RAND
                $invoiceNumber = 'TRX-'.Carbon::now()->format('YmdHis').'-'.strtoupper(Str::random(4));

                $transaction = Transaction::create([
                    'invoice_number' => $invoiceNumber,
                    'user_id' => $user->id,
                    'customer_name' => $customerName,
                    'subtotal' => $subtotal,
                    'discount' => $actualDiscount,
                    'tax' => $tax,
                    'total' => $total,
                    'payment_method' => $paymentMethod,
                    'amount_paid' => $amountPaid,
                    'change_due' => $changeDue,
                    'status' => 'completed',
                    'notes' => $notes,
                ]);

                // Save items & decrement stock & log stock movement
                foreach ($itemsToCreate as $item) {
                    /** @var Product $prod */
                    $prod = $item['product'];
                    $qty = $item['quantity'];

                    TransactionItem::create([
                        'transaction_id' => $transaction->id,
                        'product_id' => $prod->id,
                        'product_sku' => $prod->sku,
                        'product_name' => $prod->name,
                        'cost_price' => $item['cost_price'],
                        'unit_price' => $item['unit_price'],
                        'quantity' => $qty,
                        'subtotal' => $item['subtotal'],
                    ]);

                    $stockBefore = $prod->stock;
                    $stockAfter = $stockBefore - $qty;

                    $prod->decrement('stock', $qty);

                    StockMovement::create([
                        'product_id' => $prod->id,
                        'user_id' => $user->id,
                        'type' => 'sale',
                        'quantity' => -$qty,
                        'stock_before' => $stockBefore,
                        'stock_after' => $stockAfter,
                        'reference_number' => $invoiceNumber,
                        'notes' => 'Penjualan Kasir POS',
                    ]);
                }

                return $transaction->load(['items', 'user']);
            });

            return back()->with([
                'success' => 'Transaksi berhasil diselesaikan!',
                'receipt' => $newTransaction,
            ]);
        } finally {
            $lock->release();
        }
    }
}
