'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Title,
    Button,
    Table,
    Badge,
    ActionIcon,
    Group,
    Text,
    Paper,
    Modal,
    TextInput,
    PasswordInput,
    Select,
    Stack,
    Grid,
    Card,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus, IconEdit, IconTrash, IconUsers, IconSchool } from '@tabler/icons-react';

interface User {
    id: string;
    username: string;
    full_name: string;
    role: string;
    academy_id: string | null;
    status: string;
    academies?: { name: string };
}

export default function UsersPage() {
    const queryClient = useQueryClient();
    const [opened, { open, close }] = useDisclosure(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const form = useForm({
        initialValues: {
            username: '',
            password: '',
            full_name: '',
            role: 'academy_admin',
            academy_id: '',
        },
        validate: {
            username: (value) => (!value ? '사용자명은 필수입니다' : null),
            password: (value, values) =>
                !editingUser && !value ? '비밀번호는 필수입니다' : null,
            full_name: (value) => (!value ? '이름은 필수입니다' : null),
            academy_id: (value, values) =>
                (values.role === 'academy_admin' || values.role === 'student') && !value
                    ? '학원을 선택해주세요'
                    : null,
        },
    });

    // 사용자 목록 조회
    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await fetch('/api/users');
            if (!res.ok) throw new Error('Failed to fetch users');
            return res.json();
        },
    });

    // 학원 목록 조회
    const { data: academiesData } = useQuery({
        queryKey: ['academies'],
        queryFn: async () => {
            const res = await fetch('/api/academies');
            if (!res.ok) throw new Error('Failed to fetch academies');
            return res.json();
        },
    });

    // 사용자 생성/수정
    const saveMutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
            const method = editingUser ? 'PATCH' : 'POST';

            // 비밀번호가 비어있으면 제외
            const payload = { ...values };
            if (editingUser && !values.password) {
                delete payload.password;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            notifications.show({
                title: '성공',
                message: editingUser ? '사용자가 수정되었습니다.' : '사용자가 생성되었습니다.',
                color: 'green',
            });
            close();
            form.reset();
            setEditingUser(null);
        },
        onError: (error: Error) => {
            notifications.show({
                title: '오류',
                message: error.message,
                color: 'red',
            });
        },
    });

    // 사용자 삭제
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            notifications.show({
                title: '성공',
                message: '사용자가 삭제되었습니다.',
                color: 'green',
            });
        },
        onError: (error: Error) => {
            notifications.show({
                title: '오류',
                message: error.message,
                color: 'red',
            });
        },
    });

    const handleEdit = (user: User) => {
        setEditingUser(user);
        form.setValues({
            username: user.username,
            password: '',
            full_name: user.full_name,
            role: user.role,
            academy_id: user.academy_id || '',
        });
        open();
    };

    const handleDelete = (user: User) => {
        modals.openConfirmModal({
            title: '사용자 삭제',
            children: (
                <Text size="sm">
                    정말로 <strong>{user.full_name}</strong>을(를) 삭제하시겠습니까?
                </Text>
            ),
            labels: { confirm: '삭제', cancel: '취소' },
            confirmProps: { color: 'red' },
            onConfirm: () => deleteMutation.mutate(user.id),
        });
    };

    const handleCreate = () => {
        setEditingUser(null);
        form.reset();
        open();
    };

    const users: User[] = usersData?.users || [];
    const academies = academiesData?.academies || [];

    const academyOptions = academies.map((a: any) => ({
        value: a.id,
        label: a.name,
    }));

    const roleLabels: Record<string, string> = {
        super_admin: '최고 관리자',
        academy_admin: '학원 관리자',
        student: '학생',
    };

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <Title order={1} style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    사용자 관리
                </Title>
                <Button
                    leftSection={<IconPlus size={20} />}
                    onClick={handleCreate}
                    style={{
                        backgroundColor: '#ffd15c',
                        color: '#000',
                        border: '3px solid #000',
                    }}
                >
                    사용자 추가
                </Button>
            </Group>

            <Grid mb="xl">
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card
                        shadow="sm"
                        padding="lg"
                        style={{
                            border: '3px solid #000',
                            boxShadow: '6px 6px 0 #000',
                        }}
                    >
                        <IconUsers size={40} />
                        <Text size="xl" fw={700} mt="md">
                            전체 사용자
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantBlue">
                            {users.length}
                        </Text>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card
                        shadow="sm"
                        padding="lg"
                        style={{
                            border: '3px solid #000',
                            boxShadow: '6px 6px 0 #000',
                        }}
                    >
                        <IconSchool size={40} />
                        <Text size="xl" fw={700} mt="md">
                            학원 관리자
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantPink">
                            {users.filter((u) => u.role === 'academy_admin').length}
                        </Text>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card
                        shadow="sm"
                        padding="lg"
                        style={{
                            border: '3px solid #000',
                            boxShadow: '6px 6px 0 #000',
                        }}
                    >
                        <IconUsers size={40} />
                        <Text size="xl" fw={700} mt="md">
                            학생
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantGreen">
                            {users.filter((u) => u.role === 'student').length}
                        </Text>
                    </Card>
                </Grid.Col>
            </Grid>

            <Paper
                p="xl"
                style={{
                    border: '3px solid #000',
                    boxShadow: '6px 6px 0 #000',
                }}
            >
                {usersLoading ? (
                    <Text>로딩 중...</Text>
                ) : users.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                        아직 등록된 사용자가 없습니다.
                    </Text>
                ) : (
                    <Table
                        striped
                        highlightOnHover
                        style={{
                            border: '3px solid #000',
                        }}
                    >
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>사용자명</Table.Th>
                                <Table.Th>이름</Table.Th>
                                <Table.Th>역할</Table.Th>
                                <Table.Th>학원</Table.Th>
                                <Table.Th>상태</Table.Th>
                                <Table.Th>작업</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {users.map((user) => (
                                <Table.Tr key={user.id}>
                                    <Table.Td>
                                        <Text fw={700}>{user.username}</Text>
                                    </Table.Td>
                                    <Table.Td>{user.full_name}</Table.Td>
                                    <Table.Td>
                                        <Badge variant="light">{roleLabels[user.role]}</Badge>
                                    </Table.Td>
                                    <Table.Td>{user.academies?.name || '-'}</Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={user.status === 'active' ? 'green' : 'red'}
                                            variant="filled"
                                        >
                                            {user.status === 'active' ? '활성' : '정지'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <ActionIcon
                                                variant="light"
                                                color="blue"
                                                onClick={() => handleEdit(user)}
                                            >
                                                <IconEdit size={18} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="light"
                                                color="red"
                                                onClick={() => handleDelete(user)}
                                            >
                                                <IconTrash size={18} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                )}
            </Paper>

            <Modal
                opened={opened}
                onClose={() => {
                    close();
                    form.reset();
                    setEditingUser(null);
                }}
                title={
                    <Text size="lg" fw={700}>
                        {editingUser ? '사용자 수정' : '사용자 추가'}
                    </Text>
                }
                size="lg"
            >
                <form onSubmit={form.onSubmit((values) => saveMutation.mutate(values))}>
                    <Stack gap="md">
                        <TextInput
                            label="사용자명"
                            placeholder="한글 이름 또는 아이디"
                            required
                            disabled={!!editingUser}
                            {...form.getInputProps('username')}
                        />

                        <TextInput
                            label="이름"
                            placeholder="홍길동"
                            required
                            {...form.getInputProps('full_name')}
                        />

                        <PasswordInput
                            label={editingUser ? '비밀번호 (변경시에만 입력)' : '비밀번호'}
                            placeholder="비밀번호"
                            required={!editingUser}
                            {...form.getInputProps('password')}
                        />

                        <Select
                            label="역할"
                            placeholder="역할 선택"
                            required
                            data={[
                                { value: 'super_admin', label: '최고 관리자' },
                                { value: 'academy_admin', label: '학원 관리자' },
                                { value: 'student', label: '학생' },
                            ]}
                            {...form.getInputProps('role')}
                        />

                        {(form.values.role === 'academy_admin' ||
                            form.values.role === 'student') && (
                                <Select
                                    label="학원"
                                    placeholder="학원 선택"
                                    required
                                    data={academyOptions}
                                    {...form.getInputProps('academy_id')}
                                />
                            )}

                        <Group justify="flex-end" mt="md">
                            <Button
                                variant="default"
                                onClick={() => {
                                    close();
                                    form.reset();
                                    setEditingUser(null);
                                }}
                            >
                                취소
                            </Button>
                            <Button
                                type="submit"
                                loading={saveMutation.isPending}
                                style={{
                                    backgroundColor: '#ffd15c',
                                    color: '#000',
                                    border: '3px solid #000',
                                }}
                            >
                                {editingUser ? '수정' : '생성'}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </div>
    );
}
