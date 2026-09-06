<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;

beforeEach(function () {
    $this->admin = User::factory()->create([
        'name' => 'Admin Test',
        'email' => 'admin@test.com',
        'role' => 'admin',
    ]);

    $this->kasir = User::factory()->create([
        'name' => 'Kasir Test',
        'email' => 'kasir@test.com',
        'role' => 'kasir',
    ]);

    $this->category = Category::create([
        'name' => 'Minuman',
        'slug' => 'minuman',
        'description' => 'Kategori minuman segar',
    ]);

    $this->product = Product::create([
        'category_id' => $this->category->id,
        'sku' => 'AQUA-01',
        'name' => 'Aqua 600ml',
        'cost_price' => 3000,
        'price' => 4000,
        'stock' => 50,
        'min_stock_alert' => 10,
        'status' => 'active',
    ]);
});

test('role authorization allows admin everywhere but restricts kasir on admin routes', function () {
    // Kasir can access dashboard, POS, transactions
    $this->actingAs($this->kasir)
        ->get('/dashboard')
        ->assertOk();

    $this->actingAs($this->kasir)
        ->get('/pos')
        ->assertOk();

    $this->actingAs($this->kasir)
        ->get('/transactions')
        ->assertOk();

    // Kasir is forbidden on admin-only routes
    $this->actingAs($this->kasir)
        ->get('/categories')
        ->assertForbidden();

    $this->actingAs($this->kasir)
        ->get('/products')
        ->assertForbidden();

    $this->actingAs($this->kasir)
        ->get('/inventory')
        ->assertForbidden();

    $this->actingAs($this->kasir)
        ->get('/reports')
        ->assertForbidden();

    // Admin can access all routes
    $this->actingAs($this->admin)
        ->get('/categories')
        ->assertOk();

    $this->actingAs($this->admin)
        ->get('/products')
        ->assertOk();

    $this->actingAs($this->admin)
        ->get('/inventory')
        ->assertOk();

    $this->actingAs($this->admin)
        ->get('/reports')
        ->assertOk();
});

test('admin can create, update, and delete categories', function () {
    // Create
    $response = $this->actingAs($this->admin)->post('/categories', [
        'name' => 'Makanan Ringan',
        'slug' => 'makanan-ringan',
        'description' => 'Snack dan biskuit',
    ]);
    $response->assertSessionHas('success');
    $this->assertDatabaseHas('categories', ['slug' => 'makanan-ringan']);

    $category = Category::where('slug', 'makanan-ringan')->first();

    // Update
    $response = $this->actingAs($this->admin)->put("/categories/{$category->id}", [
        'name' => 'Makanan & Snack',
        'slug' => 'makanan-snack',
        'description' => 'Snack, biskuit, keripik',
    ]);
    $response->assertSessionHas('success');
    $this->assertDatabaseHas('categories', ['slug' => 'makanan-snack']);

    // Delete empty category
    $response = $this->actingAs($this->admin)->delete("/categories/{$category->id}");
    $response->assertSessionHas('success');
    $this->assertDatabaseMissing('categories', ['id' => $category->id]);
});

test('category with products cannot be deleted', function () {
    $response = $this->actingAs($this->admin)->delete("/categories/{$this->category->id}");
    $response->assertSessionHas('error');
    $this->assertDatabaseHas('categories', ['id' => $this->category->id]);
});

test('admin can create product with initial stock movement', function () {
    $response = $this->actingAs($this->admin)->post('/products', [
        'category_id' => $this->category->id,
        'sku' => 'TEH-01',
        'name' => 'Teh Kotak 300ml',
        'cost_price' => 3500,
        'price' => 5000,
        'stock' => 30,
        'min_stock_alert' => 5,
        'status' => 'active',
    ]);

    $response->assertSessionHas('success');
    $this->assertDatabaseHas('products', ['sku' => 'TEH-01']);

    $createdProduct = Product::where('sku', 'TEH-01')->first();
    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $createdProduct->id,
        'type' => 'in',
        'quantity' => 30,
        'stock_before' => 0,
        'stock_after' => 30,
    ]);
});

test('product validation rejects sell price lower than cost price or duplicate sku', function () {
    // Duplicate SKU
    $response = $this->actingAs($this->admin)->post('/products', [
        'sku' => 'AQUA-01', // already exists
        'name' => 'Another Aqua',
        'cost_price' => 3000,
        'price' => 4000,
        'stock' => 10,
        'status' => 'active',
    ]);
    $response->assertSessionHasErrors(['sku']);

    // Price < Cost price
    $response = $this->actingAs($this->admin)->post('/products', [
        'sku' => 'CHIP-01',
        'name' => 'Chips',
        'cost_price' => 5000,
        'price' => 4000, // lower than cost
        'stock' => 10,
        'status' => 'active',
    ]);
    $response->assertSessionHasErrors(['price']);
});

test('inventory stock movement handles in, out, and adjustment accurately', function () {
    // 1. Stock In: +20 to current 50 = 70
    $this->actingAs($this->admin)->post('/inventory/movement', [
        'product_id' => $this->product->id,
        'type' => 'in',
        'quantity' => 20,
        'notes' => 'Penerimaan supplier',
    ])->assertSessionHas('success');

    $this->assertEquals(70, $this->product->fresh()->stock);

    // 2. Stock Out: -10 from 70 = 60
    $this->actingAs($this->admin)->post('/inventory/movement', [
        'product_id' => $this->product->id,
        'type' => 'out',
        'quantity' => 10,
        'notes' => 'Barang rusak',
    ])->assertSessionHas('success');

    $this->assertEquals(60, $this->product->fresh()->stock);

    // 3. Stock Adjustment: Opname fisik actual 55
    $this->actingAs($this->admin)->post('/inventory/movement', [
        'product_id' => $this->product->id,
        'type' => 'adjustment',
        'quantity' => 55, // target fisik
        'notes' => 'Stock opname fisik bulanan',
    ])->assertSessionHas('success');

    $this->assertEquals(55, $this->product->fresh()->stock);
});

test('pos checkout processes sale atomically, deducts stock, and creates transaction items', function () {
    $initialStock = $this->product->stock; // 50
    $qtyToBuy = 3;

    $response = $this->actingAs($this->kasir)->post('/pos/checkout', [
        'items' => [
            ['product_id' => $this->product->id, 'quantity' => $qtyToBuy],
        ],
        'customer_name' => 'Budi Santoso',
        'discount' => 1000,
        'payment_method' => 'cash',
        'amount_paid' => 20000,
    ]);

    $response->assertSessionHas('success');
    $response->assertSessionHas('receipt');

    // Verify stock is deducted
    $this->assertEquals($initialStock - $qtyToBuy, $this->product->fresh()->stock);

    // Verify transaction created
    $expectedTotal = ($this->product->price * $qtyToBuy) - 1000;
    $this->assertDatabaseHas('transactions', [
        'user_id' => $this->kasir->id,
        'customer_name' => 'Budi Santoso',
        'subtotal' => $this->product->price * $qtyToBuy,
        'discount' => 1000,
        'total' => $expectedTotal,
        'payment_method' => 'cash',
        'amount_paid' => 20000,
        'change_due' => 20000 - $expectedTotal,
        'status' => 'completed',
    ]);

    // Verify stock movement logged as sale
    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $this->product->id,
        'user_id' => $this->kasir->id,
        'type' => 'sale',
        'quantity' => -$qtyToBuy,
        'stock_before' => $initialStock,
        'stock_after' => $initialStock - $qtyToBuy,
    ]);
});

test('pos checkout rejects when stock is insufficient', function () {
    $initialStock = $this->product->stock; // 50

    // Try to buy 60 pcs
    $response = $this->actingAs($this->kasir)->post('/pos/checkout', [
        'items' => [
            ['product_id' => $this->product->id, 'quantity' => 60],
        ],
        'payment_method' => 'cash',
        'amount_paid' => 300000,
    ]);

    $response->assertSessionHasErrors(['items']);

    // Stock must remain unchanged!
    $this->assertEquals($initialStock, $this->product->fresh()->stock);
});

test('admin can cancel transaction and restore stock', function () {
    // First make a sale
    $this->actingAs($this->kasir)->post('/pos/checkout', [
        'items' => [
            ['product_id' => $this->product->id, 'quantity' => 5],
        ],
        'payment_method' => 'cash',
        'amount_paid' => 20000,
    ]);

    $this->assertEquals(45, $this->product->fresh()->stock);

    $transaction = Transaction::latest('id')->first();

    // Admin cancels transaction
    $response = $this->actingAs($this->admin)->post("/transactions/{$transaction->id}/cancel");
    $response->assertSessionHas('success');

    // Stock must be restored to 50
    $this->assertEquals(50, $this->product->fresh()->stock);
    $this->assertEquals('cancelled', $transaction->fresh()->status);

    // Second cancellation attempt should fail safely without duplicating stock
    $secondResponse = $this->actingAs($this->admin)->post("/transactions/{$transaction->id}/cancel");
    $secondResponse->assertSessionHas('error');
    $this->assertEquals(50, $this->product->fresh()->stock);
});

test('pos checkout caps excessive discount to subtotal', function () {
    // Buy 1 Aqua (price: 4000) with discount 10000
    $response = $this->actingAs($this->kasir)->post('/pos/checkout', [
        'items' => [
            ['product_id' => $this->product->id, 'quantity' => 1],
        ],
        'discount' => 10000,
        'payment_method' => 'cash',
        'amount_paid' => 0,
    ]);

    $response->assertSessionHas('success');
    $trx = Transaction::latest('id')->first();
    // Discount must be capped to subtotal (4000) and total is 0
    $this->assertEquals(4000, $trx->discount);
    $this->assertEquals(0, $trx->total);
});

test('reports endpoint aggregates sales metrics across daily, weekly, and monthly periods', function () {
    $this->actingAs($this->admin)
        ->get('/reports?period=daily')
        ->assertOk();

    $this->actingAs($this->admin)
        ->get('/reports?period=weekly')
        ->assertOk();

    $this->actingAs($this->admin)
        ->get('/reports?period=monthly')
        ->assertOk();
});
