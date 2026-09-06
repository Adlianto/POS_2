import type { User } from './auth';

export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    products_count?: number;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: number;
    category_id: number | null;
    category?: Category;
    sku: string;
    barcode: string | null;
    name: string;
    cost_price: number | string;
    price: number | string;
    stock: number;
    min_stock_alert: number;
    status: 'active' | 'inactive';
    description: string | null;
    image: string | null;
    created_at: string;
    updated_at: string;
}

export interface StockMovement {
    id: number;
    product_id: number;
    product?: Product;
    user_id: number | null;
    user?: User;
    type: 'in' | 'out' | 'adjustment' | 'sale' | 'cancelled';
    quantity: number;
    stock_before: number;
    stock_after: number;
    reference_number: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface TransactionItem {
    id: number;
    transaction_id: number;
    product_id: number | null;
    product?: Product;
    product_sku: string;
    product_name: string;
    cost_price: number | string;
    unit_price: number | string;
    quantity: number;
    subtotal: number | string;
    created_at: string;
    updated_at: string;
}

export interface Transaction {
    id: number;
    invoice_number: string;
    user_id: number;
    user?: User;
    customer_name: string | null;
    subtotal: number | string;
    discount: number | string;
    tax: number | string;
    total: number | string;
    payment_method: 'cash' | 'transfer' | 'qris' | 'card';
    amount_paid: number | string;
    change_due: number | string;
    status: 'completed' | 'cancelled';
    notes: string | null;
    items?: TransactionItem[];
    created_at: string;
    updated_at: string;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
}
