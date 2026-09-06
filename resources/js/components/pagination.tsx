import { Link } from '@inertiajs/react';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginationProps {
    links: PaginationLink[];
    className?: string;
}

export function Pagination({ links, className = '' }: PaginationProps) {
    if (!links || links.length <= 3) {
        return null;
    }

    return (
        <div className={`flex flex-wrap items-center justify-center gap-1 ${className}`}>
            {links.map((link, index) => {
                if (link.url === null) {
                    return (
                        <span
                            key={index}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-neutral-200 px-3 text-sm text-neutral-400 dark:border-neutral-800 dark:text-neutral-600"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    );
                }

                return (
                    <Link
                        key={index}
                        href={link.url}
                        preserveScroll
                        className={`inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors ${
                            link.active
                                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                                : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </div>
    );
}
