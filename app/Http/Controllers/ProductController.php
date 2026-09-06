<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    /**
     * Display a listing of products.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $categoryId = $request->input('category_id');
        $status = $request->input('status');
        $lowStock = $request->boolean('low_stock');

        $products = Product::with('category')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            })
            ->when($categoryId, function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($lowStock, function ($query) {
                $query->lowStock();
            })
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        $categories = Category::orderBy('name')->get(['id', 'name']);

        return Inertia::render('products/index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId,
                'status' => $status,
                'low_stock' => $lowStock,
            ],
        ]);
    }

    /**
     * Store a newly created product.
     */
    public function store(StoreProductRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated, $request) {
            $product = Product::create($validated);

            // Jika ada stok awal > 0, catat mutasi awal
            if ($product->stock > 0) {
                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => $request->user()->id,
                    'type' => 'in',
                    'quantity' => $product->stock,
                    'stock_before' => 0,
                    'stock_after' => $product->stock,
                    'reference_number' => 'INIT-STOCK',
                    'notes' => 'Stok awal saat pendaftaran produk',
                ]);
            }
        });

        return back()->with('success', 'Produk berhasil ditambahkan.');
    }

    /**
     * Update the specified product.
     */
    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($product, $validated, $request) {
            /** @var Product $lockedProduct */
            $lockedProduct = Product::where('id', $product->id)->lockForUpdate()->firstOrFail();
            $oldStock = $lockedProduct->stock;
            $newStock = (int) $validated['stock'];

            $lockedProduct->update($validated);

            if ($oldStock !== $newStock) {
                $diff = $newStock - $oldStock;
                StockMovement::create([
                    'product_id' => $lockedProduct->id,
                    'user_id' => $request->user()->id,
                    'type' => 'adjustment',
                    'quantity' => $diff,
                    'stock_before' => $oldStock,
                    'stock_after' => $newStock,
                    'reference_number' => 'EDIT-PRODUCT',
                    'notes' => 'Koreksi stok langsung dari edit data produk',
                ]);
            }
        });

        return back()->with('success', 'Produk berhasil diperbarui.');
    }

    /**
     * Remove the specified product.
     */
    public function destroy(Product $product): RedirectResponse
    {
        if ($product->transactionItems()->exists()) {
            return back()->with('error', 'Produk tidak dapat dihapus karena sudah memiliki riwayat transaksi. Nonaktifkan status produk jika tidak lagi dijual.');
        }

        $product->delete();

        return back()->with('success', 'Produk berhasil dihapus.');
    }
}
