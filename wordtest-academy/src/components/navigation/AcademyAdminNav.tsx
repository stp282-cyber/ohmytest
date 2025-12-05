'use client';

import { NavLink } from '@mantine/core';
import { usePathname, useRouter } from 'next/navigation';
import {
    IconUsers,
    IconSchool,
    IconBook,
    IconList,
    IconBell,
    IconSettings,
    IconChartBar
} from '@tabler/icons-react';

export function AcademyAdminNav() {
    const pathname = usePathname();
    const router = useRouter();

    const navItems = [
        { label: '학생 관리', icon: IconUsers, href: '/academy-admin/students' },
        { label: '반 관리', icon: IconSchool, href: '/academy-admin/classes' },
        { label: '단어장 관리', icon: IconBook, href: '/academy-admin/wordbooks' },
        { label: '커리큘럼 관리', icon: IconList, href: '/academy-admin/curriculums' },
        { label: '공지/쪽지', icon: IconBell, href: '/academy-admin/notices' },
        { label: '진도 관리', icon: IconChartBar, href: '/academy-admin/progress' },
        { label: '설정', icon: IconSettings, href: '/academy-admin/settings' },
    ];

    return (
        <>
            {navItems.map((item) => (
                <NavLink
                    key={item.href}
                    label={item.label}
                    leftSection={<item.icon size={20} />}
                    active={pathname.startsWith(item.href)}
                    onClick={() => router.push(item.href)}
                    style={{
                        borderRadius: 0,
                        border: pathname.startsWith(item.href) ? '3px solid #000' : 'none',
                        marginBottom: '0.5rem',
                        fontWeight: 700,
                        backgroundColor: pathname.startsWith(item.href) ? '#ffd15c' : 'transparent',
                    }}
                />
            ))}
        </>
    );
}
