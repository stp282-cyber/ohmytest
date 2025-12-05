'use client';

import { AppShell, Burger, Group, Text, Avatar, Menu, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import { notifications } from '@mantine/notifications';
import { ReactNode } from 'react';

interface DashboardLayoutProps {
    children: ReactNode;
    user: {
        full_name: string;
        role: string;
    };
    navigation: ReactNode;
}

export function DashboardLayout({ children, user, navigation }: DashboardLayoutProps) {
    const [opened, { toggle }] = useDisclosure();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            notifications.show({
                title: '로그아웃',
                message: '성공적으로 로그아웃되었습니다.',
                color: 'blue',
            });
            router.push('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AppShell
            header={{ height: 70 }}
            navbar={{
                width: 280,
                breakpoint: 'sm',
                collapsed: { mobile: !opened },
            }}
            padding="md"
        >
            <AppShell.Header
                style={{
                    border: '4px solid #000',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                }}
            >
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
                        <Text
                            size="xl"
                            fw={900}
                            style={{
                                fontFamily: 'var(--font-space-grotesk)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                            }}
                        >
                            WordTest Academy
                        </Text>
                    </Group>

                    <Menu shadow="md" width={200}>
                        <Menu.Target>
                            <UnstyledButton>
                                <Group gap="xs">
                                    <Avatar color="vibrantBlue" radius="xl">
                                        {user.full_name.charAt(0)}
                                    </Avatar>
                                    <div style={{ flex: 1 }}>
                                        <Text size="sm" fw={700}>
                                            {user.full_name}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {user.role === 'super_admin' && '최고 관리자'}
                                            {user.role === 'academy_admin' && '학원 관리자'}
                                            {user.role === 'student' && '학생'}
                                        </Text>
                                    </div>
                                </Group>
                            </UnstyledButton>
                        </Menu.Target>

                        <Menu.Dropdown>
                            <Menu.Item onClick={handleLogout}>로그아웃</Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar
                p="md"
                style={{
                    border: '4px solid #000',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderBottom: 'none',
                }}
            >
                {navigation}
            </AppShell.Navbar>

            <AppShell.Main
                style={{
                    backgroundColor: '#f5f5f5',
                }}
            >
                {children}
            </AppShell.Main>
        </AppShell>
    );
}
