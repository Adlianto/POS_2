import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { flash } = usePage().props as {
        flash?: { success?: string | null; error?: string | null };
    };

    const lastSuccessRef = useRef<string | null>(null);
    const lastErrorRef = useRef<string | null>(null);

    useEffect(() => {
        if (flash?.success && flash.success !== lastSuccessRef.current) {
            toast.success(flash.success);
            lastSuccessRef.current = flash.success;
        }
        if (flash?.error && flash.error !== lastErrorRef.current) {
            toast.error(flash.error);
            lastErrorRef.current = flash.error;
        }
    }, [flash]);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            {children}
        </AppLayoutTemplate>
    );
}
