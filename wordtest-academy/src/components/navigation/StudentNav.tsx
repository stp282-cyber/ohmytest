'use client';

import { NavLink } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import {
    IconHome,
    IconBook,
    IconMail,
    IconSettings,
    IconCoin
} from '@tabler/icons-react';

export function StudentNav() {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { label: '대시보드', icon: IconHome, href: '/student/dashboard' },
        { label: '나의 학습', icon: IconBook, href: '/student/learning' },
        { label: '쪽지함', icon: IconMail, href: '/student/messages' },
        { label: '달러 현황', icon: IconCoin, href: '/student/dollars' },
        { label: '개인 설정', icon: IconSettings, href: '/student/settings' },
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
