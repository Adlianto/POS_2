import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Boxes,
    LayoutGrid,
    Package,
    ReceiptText,
    ShoppingCart,
    Tags,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { auth } = usePage().props;
    const isAdmin = auth.user?.role === 'admin';

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Point of Sale (Kasir)',
            href: '/pos',
            icon: ShoppingCart,
        },
        {
            title: 'Riwayat Transaksi',
            href: '/transactions',
            icon: ReceiptText,
        },
    ];

    if (isAdmin) {
        mainNavItems.push(
            {
                title: 'Produk',
                href: '/products',
                icon: Package,
            },
            {
                title: 'Kategori',
                href: '/categories',
                icon: Tags,
            },
            {
                title: 'Inventori & Stok',
                href: '/inventory',
                icon: Boxes,
            },
            {
                title: 'Laporan Penjualan',
                href: '/reports',
                icon: BarChart3,
            }
        );
    }

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
