/**
 * Format a number or numeric string to Indonesian Rupiah currency format (e.g. Rp 15.000)
 */
export function formatRupiah(amount: number | string | null | undefined): string {
    const numeric = typeof amount === 'string' ? parseFloat(amount) : (amount ?? 0);
    if (isNaN(numeric)) {
        return 'Rp 0';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numeric);
}

/**
 * Format a date string to Indonesian locale format
 */
export function formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            dateStyle: 'medium',
            timeStyle: 'short',
        }).format(date);
    } catch {
        return dateString;
    }
}
