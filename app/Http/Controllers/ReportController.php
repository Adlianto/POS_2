<?php

namespace App\Http\Controllers;

use App\Models\Transaction;
use App\Models\TransactionItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    /**
     * Display comprehensive POS sales reports.
     */
    public function index(Request $request): Response
    {
        $period = $request->input('period', 'daily'); // 'daily', 'weekly', 'monthly', 'custom'
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        // Set default date range if not specified
        if (! $startDate || ! $endDate) {
            if ($period === 'weekly') {
                $startDate = Carbon::now()->subWeeks(8)->startOfWeek()->format('Y-m-d');
                $endDate = Carbon::now()->endOfWeek()->format('Y-m-d');
            } elseif ($period === 'monthly') {
                $startDate = Carbon::now()->subMonths(11)->startOfMonth()->format('Y-m-d');
                $endDate = Carbon::now()->endOfMonth()->format('Y-m-d');
            } else {
                // daily default: 30 days
                $startDate = Carbon::now()->subDays(29)->format('Y-m-d');
                $endDate = Carbon::now()->format('Y-m-d');
            }
        }

        // Summary metrics for the filtered range
        $completedTransactionsQuery = Transaction::where('status', 'completed')
            ->whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate);

        $totalRevenue = (float) (clone $completedTransactionsQuery)->sum('total');
        $totalTransactions = (int) (clone $completedTransactionsQuery)->count();
        $averageTransaction = $totalTransactions > 0 ? $totalRevenue / $totalTransactions : 0;

        // Gross profit calculation (total revenue - total cost of sold items)
        $totalCost = (float) TransactionItem::whereHas('transaction', function ($q) use ($startDate, $endDate) {
            $q->where('status', 'completed')
                ->whereDate('created_at', '>=', $startDate)
                ->whereDate('created_at', '<=', $endDate);
        })->sum(DB::raw('cost_price * quantity'));

        $grossProfit = $totalRevenue - $totalCost;

        $isSqlite = DB::connection()->getDriverName() === 'sqlite';

        // 1. Sales Breakdown based on period
        if ($period === 'monthly') {
            $dateExpr = $isSqlite ? "strftime('%Y-%m', created_at)" : "DATE_FORMAT(created_at, '%Y-%m')";
            $salesBreakdown = Transaction::select(
                DB::raw("{$dateExpr} as date_group"),
                DB::raw('SUM(total) as revenue'),
                DB::raw('COUNT(id) as transaction_count'),
                DB::raw('SUM(discount) as total_discount')
            )
                ->where('status', 'completed')
                ->whereDate('created_at', '>=', $startDate)
                ->whereDate('created_at', '<=', $endDate)
                ->groupBy('date_group')
                ->orderByDesc('date_group')
                ->get();
        } elseif ($period === 'weekly') {
            $dateExpr = $isSqlite ? "strftime('%Y-W%W', created_at)" : "CONCAT(YEAR(created_at), '-W', LPAD(WEEK(created_at, 1), 2, '0'))";
            $weekStartExpr = $isSqlite ? 'DATE(created_at)' : 'MIN(DATE(created_at))';
            $salesBreakdown = Transaction::select(
                DB::raw("{$dateExpr} as date_group"),
                DB::raw("{$weekStartExpr} as week_start"),
                DB::raw('SUM(total) as revenue'),
                DB::raw('COUNT(id) as transaction_count'),
                DB::raw('SUM(discount) as total_discount')
            )
                ->where('status', 'completed')
                ->whereDate('created_at', '>=', $startDate)
                ->whereDate('created_at', '<=', $endDate)
                ->groupBy('date_group')
                ->orderByDesc('date_group')
                ->get();
        } else {
            // daily
            $salesBreakdown = Transaction::select(
                DB::raw('DATE(created_at) as date_group'),
                DB::raw('SUM(total) as revenue'),
                DB::raw('COUNT(id) as transaction_count'),
                DB::raw('SUM(discount) as total_discount')
            )
                ->where('status', 'completed')
                ->whereDate('created_at', '>=', $startDate)
                ->whereDate('created_at', '<=', $endDate)
                ->groupBy('date_group')
                ->orderByDesc('date_group')
                ->get();
        }

        // 2. Best selling products for the period
        $bestSellingProducts = TransactionItem::select(
            'product_name',
            'product_sku',
            DB::raw('SUM(quantity) as total_qty'),
            DB::raw('SUM(subtotal) as total_sales'),
            DB::raw('SUM(subtotal - (cost_price * quantity)) as estimated_profit')
        )
            ->whereHas('transaction', function ($q) use ($startDate, $endDate) {
                $q->where('status', 'completed')
                    ->whereDate('created_at', '>=', $startDate)
                    ->whereDate('created_at', '<=', $endDate);
            })
            ->groupBy('product_name', 'product_sku')
            ->orderByDesc('total_qty')
            ->limit(15)
            ->get();

        return Inertia::render('reports/index', [
            'summary' => [
                'total_revenue' => $totalRevenue,
                'total_transactions' => $totalTransactions,
                'average_transaction' => $averageTransaction,
                'gross_profit' => $grossProfit,
            ],
            'salesBreakdown' => $salesBreakdown,
            'bestSellingProducts' => $bestSellingProducts,
            'filters' => [
                'period' => $period,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ]);
    }
}
