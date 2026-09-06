<?php

namespace App\Http\Controllers;

use App\Http\Requests\StockMovementRequest;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    /**
     * Display inventory log and stock management interface.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $type = $request->input('type');
        $productId = $request->input('product_id');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        $movements = StockMovement::with(['product', 'user'])
            ->when($productId, function ($query, $productId) {
                $query->where('product_id', $productId);
            })
            ->when($type, function ($query, $type) {
                $query->where('type', $type);
            })
            ->when($startDate, function ($query, $startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            })
            ->when($endDate, function ($query, $endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            })
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('reference_number', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%")
                        ->orWhereHas('product', function ($p) use ($search) {
                            $p->where('name', 'like', "%{$search}%")
                                ->orWhere('sku', 'like', "%{$search}%");
                        });
                });
            })
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        $products = Product::orderBy('name')->get(['id', 'sku', 'name', 'stock']);

        return Inertia::render('inventory/index', [
            'movements' => $movements,
            'products' => $products,
            'filters' => [
                'search' => $search,
                'type' => $type,
                'product_id' => $productId,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }

    /**
     * Record a new stock movement (in, out, or adjustment).
     */
    public function store(StockMovementRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $productId = $validated['product_id'];
        $type = $validated['type'];
        $quantity = (int) $validated['quantity'];
        $notes = $validated['notes'] ?? null;
        $referenceNumber = $validated['reference_number'] ?? null;

        DB::transaction(function () use ($productId, $type, $quantity, $notes, $referenceNumber, $request) {
            /** @var Product $product */
            $product = Product::where('id', $productId)->lockForUpdate()->firstOrFail();
            $stockBefore = $product->stock;
            $stockAfter = $stockBefore;
            $qtyChange = 0;

            if ($type === 'in') {
                $stockAfter = $stockBefore + $quantity;
                $qtyChange = $quantity;
                $product->stock = $stockAfter;
                $product->save();
            } elseif ($type === 'out') {
                if ($quantity > $stockBefore) {
                    throw ValidationException::withMessages([
                        'quantity' => 'Jumlah stok keluar ('.$quantity.') tidak boleh melebihi stok yang tersedia ('.$stockBefore.').',
                    ]);
                }
                $stockAfter = $stockBefore - $quantity;
                $qtyChange = -$quantity;
                $product->stock = $stockAfter;
                $product->save();
            } elseif ($type === 'adjustment') {
                // Dalam adjustment, quantity adalah stok fisik aktual yang dihitung (opname)
                $stockAfter = $quantity;
                $qtyChange = $stockAfter - $stockBefore;
                $product->stock = $stockAfter;
                $product->save();
            }

            StockMovement::create([
                'product_id' => $product->id,
                'user_id' => $request->user()->id,
                'type' => $type,
                'quantity' => $qtyChange,
                'stock_before' => $stockBefore,
                'stock_after' => $stockAfter,
                'reference_number' => $referenceNumber,
                'notes' => $notes,
            ]);
        });

        return back()->with('success', 'Perubahan stok berhasil disimpan.');
    }
}
