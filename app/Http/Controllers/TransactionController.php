<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Transaction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TransactionController extends Controller
{
    /**
     * Display a listing of transactions.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $status = $request->input('status');
        $paymentMethod = $request->input('payment_method');

        $transactions = Transaction::with(['user', 'items'])
            ->when($search, function ($query, $search) {
                $query->where('invoice_number', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%");
            })
            ->when($startDate, function ($query, $startDate) {
                $query->whereDate('created_at', '>=', $startDate);
            })
            ->when($endDate, function ($query, $endDate) {
                $query->whereDate('created_at', '<=', $endDate);
            })
            ->when($status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($paymentMethod, function ($query, $paymentMethod) {
                $query->where('payment_method', $paymentMethod);
            })
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('transactions/index', [
            'transactions' => $transactions,
            'filters' => [
                'search' => $search,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $status,
                'payment_method' => $paymentMethod,
            ],
        ]);
    }

    /**
     * Display the specified transaction details.
     */
    public function show(Transaction $transaction): Response
    {
        $transaction->load(['user', 'items']);

        return Inertia::render('transactions/show', [
            'transaction' => $transaction,
        ]);
    }

    /**
     * Cancel a transaction (admin only) and restore stock.
     */
    public function cancel(Request $request, Transaction $transaction): RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            abort(403, 'Hanya admin yang dapat membatalkan transaksi.');
        }

        $cancelled = DB::transaction(function () use ($transaction, $request) {
            /** @var Transaction $lockedTransaction */
            $lockedTransaction = Transaction::where('id', $transaction->id)->lockForUpdate()->firstOrFail();

            if ($lockedTransaction->status === 'cancelled') {
                return false;
            }

            $lockedTransaction->status = 'cancelled';
            $lockedTransaction->save();

            // Kembalikan stok untuk setiap item dengan urutan ID agar bebas deadlock
            $sortedItems = $lockedTransaction->items->sortBy('product_id');
            foreach ($sortedItems as $item) {
                if ($item->product_id) {
                    /** @var Product|null $product */
                    $product = Product::where('id', $item->product_id)->lockForUpdate()->first();
                    if ($product) {
                        $stockBefore = $product->stock;
                        $stockAfter = $stockBefore + $item->quantity;
                        $product->increment('stock', $item->quantity);

                        StockMovement::create([
                            'product_id' => $product->id,
                            'user_id' => $request->user()->id,
                            'type' => 'cancelled',
                            'quantity' => $item->quantity,
                            'stock_before' => $stockBefore,
                            'stock_after' => $stockAfter,
                            'reference_number' => $lockedTransaction->invoice_number,
                            'notes' => 'Pembatalan transaksi oleh admin',
                        ]);
                    }
                }
            }

            return true;
        });

        if (! $cancelled) {
            return back()->with('error', 'Transaksi ini sudah dibatalkan sebelumnya.');
        }

        return back()->with('success', 'Transaksi berhasil dibatalkan dan stok dikembalikan.');
    }
}
