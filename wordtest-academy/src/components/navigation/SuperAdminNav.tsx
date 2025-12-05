'use client';

import { NavLink } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import { IconBuilding, IconUsers, IconBook, IconSettings } from '@tabler/icons-react';

export function SuperAdminNav() {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { label: '학원 관리', icon: IconBuilding, href: '/super-admin/academies' },
        { label: '사용자 관리', icon: IconUsers, href: '/super-admin/users' },
        { label: '공유 단어장', icon: IconBook, href: '/super-admin/wordbooks' },
        { label: '설정', icon: IconSettings, href: '/super-admin/settings' },
    ];

    return (
        <>
            {navItems.map((item) => (
                <NavLink
                    key={item.href}
                    label={item.label}
                    leftSection={<item.icon size={20} />}
                    active={pathname === item.href}
                    onClick={() => router.push(item.href)}
                    style={{
                        borderRadius: 0,
                        border: pathname === item.href ? '3px solid #000' : 'none',
                        marginBottom: '0.5rem',
                        fontWeight: 700,
                        backgroundColor: pathname === item.href ? '#ffd15c' : 'transparent',
                    }}
                />
            ))}
        </>
    );
}
