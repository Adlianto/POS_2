<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return auth()->check() ? redirect()->route('dashboard') : Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    // 1. Dashboard (Kasir & Admin)
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // 2. Point of Sale (POS) (Kasir & Admin)
    Route::get('/pos', [PosController::class, 'index'])->name('pos.index');
    Route::get('/pos/find', [PosController::class, 'findProduct'])->name('pos.find');
    Route::post('/pos/checkout', [PosController::class, 'checkout'])->name('pos.checkout');

    // 3. Transaction History (Kasir & Admin)
    Route::get('/transactions', [TransactionController::class, 'index'])->name('transactions.index');
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show'])->name('transactions.show');

    // 4. Modul Khusus Admin
    Route::middleware(['role:admin'])->group(function () {
        // Categories
        Route::get('/categories', [CategoryController::class, 'index'])->name('categories.index');
        Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::put('/categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

        // Products
        Route::get('/products', [ProductController::class, 'index'])->name('products.index');
        Route::post('/products', [ProductController::class, 'store'])->name('products.store');
        Route::put('/products/{product}', [ProductController::class, 'update'])->name('products.update');
        Route::delete('/products/{product}', [ProductController::class, 'destroy'])->name('products.destroy');

        // Inventory
        Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
        Route::post('/inventory/movement', [InventoryController::class, 'store'])->name('inventory.store');

        // Cancel Transaction
        Route::post('/transactions/{transaction}/cancel', [TransactionController::class, 'cancel'])->name('transactions.cancel');

        // Reports
        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    });
});

require __DIR__.'/settings.php';
