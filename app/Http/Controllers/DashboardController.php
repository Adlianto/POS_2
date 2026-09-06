<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the POS system dashboard.
     */
    public function index(Request $request): Response
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();

        // 1. Total penjualan & jumlah transaksi
        $todayTransactions = Transaction::whereDate('created_at', $today)
            ->where('status', 'completed');
        $todaySales = (clone $todayTransactions)->sum('total');
        $todayCount = (clone $todayTransactions)->count();

        $monthTransactions = Transaction::where('created_at', '>=', $startOfMonth)
            ->where('status', 'completed');
        $monthSales = (clone $monthTransactions)->sum('total');
        $monthCount = (clone $monthTransactions)->count();

        // 2. Produk & Kategori stats
        $totalProducts = Product::count();
        $totalCategories = Category::count();

        // 3. Stok menipis (stock <= min_stock_alert)
        $lowStockProducts = Product::with('category')
            ->lowStock()
            ->orderBy('stock', 'asc')
            ->limit(10)
            ->get();

        // 4. Produk terlaris (top 5 by quantity sold)
        $topProducts = TransactionItem::select(
            'product_name',
            'product_sku',
            DB::raw('SUM(quantity) as total_sold'),
            DB::raw('SUM(subtotal) as total_revenue')
        )
            ->whereHas('transaction', function ($q) {
                $q->where('status', 'completed');
            })
            ->groupBy('product_name', 'product_sku')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        // 5. Ringkasan penjualan 7 hari terakhir
        $sevenDaysAgo = Carbon::today()->subDays(6);
        $dailySalesRaw = Transaction::select(
            DB::raw('DATE(created_at) as sale_date'),
            DB::raw('SUM(total) as revenue'),
            DB::raw('COUNT(id) as transaction_count')
        )
            ->where('created_at', '>=', $sevenDaysAgo)
            ->where('status', 'completed')
            ->groupBy('sale_date')
            ->orderBy('sale_date', 'asc')
            ->get()
            ->keyBy('sale_date');

        $chartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i)->format('Y-m-d');
            $chartData[] = [
                'date' => $date,
                'label' => Carbon::parse($date)->translatedFormat('d M'),
                'revenue' => isset($dailySalesRaw[$date]) ? (float) $dailySalesRaw[$date]->revenue : 0,
                'transactions' => isset($dailySalesRaw[$date]) ? (int) $dailySalesRaw[$date]->transaction_count : 0,
            ];
        }

        // 6. Transaksi terkini
        $recentTransactions = Transaction::with('user')
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        return Inertia::render('dashboard', [
            'stats' => [
                'today_sales' => (float) $todaySales,
                'today_transactions' => (int) $todayCount,
                'month_sales' => (float) $monthSales,
                'month_transactions' => (int) $monthCount,
                'total_products' => $totalProducts,
                'total_categories' => $totalCategories,
                'low_stock_count' => $lowStockProducts->count(),
            ],
            'lowStockProducts' => $lowStockProducts,
            'topProducts' => $topProducts,
            'salesChart' => $chartData,
            'recentTransactions' => $recentTransactions,
        ]);
    }
}
