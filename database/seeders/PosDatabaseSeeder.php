<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Transaction;
use App\Models\TransactionItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PosDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Buat User Admin & Kasir
        $admin = User::firstOrCreate(
            ['email' => 'admin@pos.com'],
            [
                'name' => 'Admin POS',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );
        $admin->role = 'admin';
        $admin->save();

        $kasir = User::firstOrCreate(
            ['email' => 'kasir@pos.com'],
            [
                'name' => 'Kasir 01',
                'password' => Hash::make('password'),
                'role' => 'kasir',
                'email_verified_at' => now(),
            ]
        );
        $kasir->role = 'kasir';
        $kasir->save();

        // 2. Buat Kategori
        $categoriesData = [
            ['name' => 'Makanan Ringan', 'slug' => 'makanan-ringan', 'description' => 'Camilan, snack, dan biskuit'],
            ['name' => 'Minuman', 'slug' => 'minuman', 'description' => 'Air mineral, teh, kopi, dan jus kemasan'],
            ['name' => 'Sembako & Dapur', 'slug' => 'sembako-dapur', 'description' => 'Beras, minyak goreng, gula, dan bumbu'],
            ['name' => 'Perawatan Diri', 'slug' => 'perawatan-diri', 'description' => 'Sabun, sampo, dan pasta gigi'],
            ['name' => 'Alat Tulis & Kantor', 'slug' => 'alat-tulis-kantor', 'description' => 'Buku tulis, pulpen, dan perlengkapan kerja'],
        ];

        $categories = [];
        foreach ($categoriesData as $catData) {
            $categories[$catData['slug']] = Category::firstOrCreate(
                ['slug' => $catData['slug']],
                $catData
            );
        }

        // 3. Buat Produk
        $productsData = [
            [
                'name' => 'Indomie Mi Goreng Spesial',
                'sku' => 'IND-GRG-01',
                'barcode' => '8998866200101',
                'category_id' => $categories['makanan-ringan']->id,
                'cost_price' => 2800,
                'price' => 3500,
                'stock' => 120,
                'min_stock_alert' => 15,
                'status' => 'active',
                'description' => 'Mi instan goreng rasa original 85g',
            ],
            [
                'name' => 'Indomie Kuah Rasa Soto',
                'sku' => 'IND-STO-02',
                'barcode' => '8998866200102',
                'category_id' => $categories['makanan-ringan']->id,
                'cost_price' => 2800,
                'price' => 3500,
                'stock' => 95,
                'min_stock_alert' => 15,
                'status' => 'active',
                'description' => 'Mi instan kuah rasa soto mie 75g',
            ],
            [
                'name' => 'Chitato Sapi Panggang 68g',
                'sku' => 'CHT-SAP-01',
                'barcode' => '8998866200103',
                'category_id' => $categories['makanan-ringan']->id,
                'cost_price' => 9000,
                'price' => 11500,
                'stock' => 35,
                'min_stock_alert' => 10,
                'status' => 'active',
                'description' => 'Keripik kentang bergelombang rasa sapi panggang',
            ],
            [
                'name' => 'SilverQueen Cashew 58g',
                'sku' => 'SLV-CSH-01',
                'barcode' => '8998866200104',
                'category_id' => $categories['makanan-ringan']->id,
                'cost_price' => 14000,
                'price' => 17500,
                'stock' => 25,
                'min_stock_alert' => 5,
                'status' => 'active',
                'description' => 'Cokelat susu dengan kacang mete',
            ],
            [
                'name' => 'Aqua Air Mineral Botol 600ml',
                'sku' => 'AQU-BTL-600',
                'barcode' => '8998866200201',
                'category_id' => $categories['minuman']->id,
                'cost_price' => 3000,
                'price' => 4000,
                'stock' => 80,
                'min_stock_alert' => 20,
                'status' => 'active',
                'description' => 'Air mineral pegunungan botol 600ml',
            ],
            [
                'name' => 'Teh Botol Sosro Kotak 350ml',
                'sku' => 'TEH-SSR-350',
                'barcode' => '8998866200202',
                'category_id' => $categories['minuman']->id,
                'cost_price' => 3500,
                'price' => 5000,
                'stock' => 45,
                'min_stock_alert' => 10,
                'status' => 'active',
                'description' => 'Minuman teh melati dalam kemasan kotak',
            ],
            [
                'name' => 'Pocari Sweat Botol 500ml',
                'sku' => 'POC-SWT-500',
                'barcode' => '8998866200203',
                'category_id' => $categories['minuman']->id,
                'cost_price' => 6500,
                'price' => 8500,
                'stock' => 40,
                'min_stock_alert' => 10,
                'status' => 'active',
                'description' => 'Minuman isotonik pengganti ion tubuh',
            ],
            [
                'name' => 'Kopi Kapal Api Special Mix 10s',
                'sku' => 'KPL-API-MIX',
                'barcode' => '8998866200204',
                'category_id' => $categories['minuman']->id,
                'cost_price' => 12000,
                'price' => 15000,
                'stock' => 50,
                'min_stock_alert' => 10,
                'status' => 'active',
                'description' => 'Kopi bubuk instan dengan gula isi 10 sachet',
            ],
            [
                'name' => 'Beras Premium Ramos 5kg',
                'sku' => 'BRS-RMS-05K',
                'barcode' => '8998866200301',
                'category_id' => $categories['sembako-dapur']->id,
                'cost_price' => 64000,
                'price' => 72000,
                'stock' => 20,
                'min_stock_alert' => 5,
                'status' => 'active',
                'description' => 'Beras putih pulen kualitas premium kemasan 5kg',
            ],
            [
                'name' => 'Minyak Goreng Filma Pouch 2L',
                'sku' => 'MYK-FLM-02L',
                'barcode' => '8998866200302',
                'category_id' => $categories['sembako-dapur']->id,
                'cost_price' => 32000,
                'price' => 37000,
                'stock' => 30,
                'min_stock_alert' => 5,
                'status' => 'active',
                'description' => 'Minyak goreng kelapa sawit higienis 2 liter',
            ],
            [
                'name' => 'Gula Pasir Gulaku Kuning 1kg',
                'sku' => 'GUL-KNG-01K',
                'barcode' => '8998866200303',
                'category_id' => $categories['sembako-dapur']->id,
                'cost_price' => 15000,
                'price' => 18000,
                'stock' => 40,
                'min_stock_alert' => 10,
                'status' => 'active',
                'description' => 'Gula tebu murni kemasan 1kg',
            ],
            [
                'name' => 'Sabun Mandi Lifebuoy Total 10',
                'sku' => 'SBN-LFB-01',
                'barcode' => '8998866200401',
                'category_id' => $categories['perawatan-diri']->id,
                'cost_price' => 3800,
                'price' => 5000,
                'stock' => 60,
                'min_stock_alert' => 10,
                'status' => 'active',
                'description' => 'Sabun batang antibakteri 110g',
            ],
            [
                'name' => 'Pasta Gigi Pepsodent Fresh Cool 120g',
                'sku' => 'PST-PPS-120',
                'barcode' => '8998866200402',
                'category_id' => $categories['perawatan-diri']->id,
                'cost_price' => 8500,
                'price' => 11000,
                'stock' => 50,
                'min_stock_alert' => 10,
                'status' => 'active',
                'description' => 'Pasta gigi pencegah gigi berlubang',
            ],
            [
                'name' => 'Buku Tulis Sinar Dunia 38 Lembar',
                'sku' => 'BKU-SND-038',
                'barcode' => '8998866200501',
                'category_id' => $categories['alat-tulis-kantor']->id,
                'cost_price' => 3500,
                'price' => 5000,
                'stock' => 3, // Peringatan Stok Menipis!
                'min_stock_alert' => 10,
                'status' => 'active',
                'description' => 'Buku bergaris untuk catatan sekolah/kantor',
            ],
            [
                'name' => 'Pulpen Gel Standard AE7 Hitam',
                'sku' => 'PLP-STD-AE7',
                'barcode' => '8998866200502',
                'category_id' => $categories['alat-tulis-kantor']->id,
                'cost_price' => 2000,
                'price' => 3000,
                'stock' => 4, // Peringatan Stok Menipis!
                'min_stock_alert' => 15,
                'status' => 'active',
                'description' => 'Pulpen ballpoint ujung runcing 0.5mm',
            ],
        ];

        $createdProducts = [];
        foreach ($productsData as $pData) {
            $product = Product::firstOrCreate(
                ['sku' => $pData['sku']],
                $pData
            );
            $createdProducts[] = $product;

            // Log initial stock movement jika belum ada
            if (StockMovement::where('product_id', $product->id)->doesntExist()) {
                StockMovement::create([
                    'product_id' => $product->id,
                    'user_id' => $admin->id,
                    'type' => 'in',
                    'quantity' => $product->stock,
                    'stock_before' => 0,
                    'stock_after' => $product->stock,
                    'reference_number' => 'INIT-SEED',
                    'notes' => 'Stok awal setup sistem POS',
                    'created_at' => Carbon::now()->subDays(10),
                ]);
            }
        }

        // 4. Buat Contoh Transaksi Historis (3 transaksi realistis)
        if (Transaction::count() === 0) {
            // Transaksi 1: kemarin
            $p1 = $createdProducts[0]; // Indomie Goreng
            $p2 = $createdProducts[4]; // Aqua 600ml
            $subtotal1 = ($p1->price * 2) + ($p2->price * 1);
            $total1 = $subtotal1;

            $trx1 = Transaction::create([
                'invoice_number' => 'TRX-'.Carbon::yesterday()->format('Ymd').'-0001',
                'user_id' => $kasir->id,
                'customer_name' => 'Pelanggan Umum',
                'subtotal' => $subtotal1,
                'discount' => 0,
                'tax' => 0,
                'total' => $total1,
                'payment_method' => 'cash',
                'amount_paid' => 20000,
                'change_due' => 20000 - $total1,
                'status' => 'completed',
                'created_at' => Carbon::yesterday()->setHour(10)->setMinute(15),
            ]);

            TransactionItem::create([
                'transaction_id' => $trx1->id,
                'product_id' => $p1->id,
                'product_sku' => $p1->sku,
                'product_name' => $p1->name,
                'cost_price' => $p1->cost_price,
                'unit_price' => $p1->price,
                'quantity' => 2,
                'subtotal' => $p1->price * 2,
                'created_at' => $trx1->created_at,
            ]);

            TransactionItem::create([
                'transaction_id' => $trx1->id,
                'product_id' => $p2->id,
                'product_sku' => $p2->sku,
                'product_name' => $p2->name,
                'cost_price' => $p2->cost_price,
                'unit_price' => $p2->price,
                'quantity' => 1,
                'subtotal' => $p2->price * 1,
                'created_at' => $trx1->created_at,
            ]);

            // Transaksi 2: hari ini
            $p3 = $createdProducts[8]; // Beras Ramos
            $p4 = $createdProducts[9]; // Minyak Filma
            $subtotal2 = ($p3->price * 1) + ($p4->price * 1);
            $discount2 = 5000;
            $total2 = $subtotal2 - $discount2;

            $trx2 = Transaction::create([
                'invoice_number' => 'TRX-'.Carbon::today()->format('Ymd').'-0002',
                'user_id' => $kasir->id,
                'customer_name' => 'Ibu Maria',
                'subtotal' => $subtotal2,
                'discount' => $discount2,
                'tax' => 0,
                'total' => $total2,
                'payment_method' => 'qris',
                'amount_paid' => $total2,
                'change_due' => 0,
                'status' => 'completed',
                'created_at' => Carbon::today()->setHour(9)->setMinute(30),
            ]);

            TransactionItem::create([
                'transaction_id' => $trx2->id,
                'product_id' => $p3->id,
                'product_sku' => $p3->sku,
                'product_name' => $p3->name,
                'cost_price' => $p3->cost_price,
                'unit_price' => $p3->price,
                'quantity' => 1,
                'subtotal' => $p3->price * 1,
                'created_at' => $trx2->created_at,
            ]);

            TransactionItem::create([
                'transaction_id' => $trx2->id,
                'product_id' => $p4->id,
                'product_sku' => $p4->sku,
                'product_name' => $p4->name,
                'cost_price' => $p4->cost_price,
                'unit_price' => $p4->price,
                'quantity' => 1,
                'subtotal' => $p4->price * 1,
                'created_at' => $trx2->created_at,
            ]);
        }
    }
}
