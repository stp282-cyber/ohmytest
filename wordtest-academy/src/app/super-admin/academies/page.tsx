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
    Textarea,
    Stack,
    Grid,
    Card,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus, IconEdit, IconTrash, IconBuilding, IconUsers } from '@tabler/icons-react';
import { motion } from 'framer-motion';

interface Academy {
    id: string;
    name: string;
    logo_url: string | null;
    footer_content: string | null;
    status: string;
    created_at: string;
}

export default function AcademiesPage() {
    const queryClient = useQueryClient();
    const [opened, { open, close }] = useDisclosure(false);
    const [editingAcademy, setEditingAcademy] = useState<Academy | null>(null);

    const form = useForm({
        initialValues: {
            name: '',
            logo_url: '',
            footer_content: '',
        },
        validate: {
            name: (value) => (!value ? '학원 이름은 필수입니다' : null),
        },
    });

    // 학원 목록 조회
    const { data, isLoading } = useQuery({
        queryKey: ['academies'],
        queryFn: async () => {
            const res = await fetch('/api/academies');
            if (!res.ok) throw new Error('Failed to fetch academies');
            return res.json();
        },
    });

    // 학원 생성/수정
    const saveMutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            const url = editingAcademy
                ? `/api/academies/${editingAcademy.id}`
                : '/api/academies';
            const method = editingAcademy ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academies'] });
            notifications.show({
                title: '성공',
                message: editingAcademy ? '학원이 수정되었습니다.' : '학원이 생성되었습니다.',
                color: 'green',
            });
            close();
            form.reset();
            setEditingAcademy(null);
        },
        onError: (error: Error) => {
            notifications.show({
                title: '오류',
                message: error.message,
                color: 'red',
            });
        },
    });

    // 학원 삭제
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/academies/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['academies'] });
            notifications.show({
                title: '성공',
                message: '학원이 삭제되었습니다.',
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

    const handleEdit = (academy: Academy) => {
        setEditingAcademy(academy);
        form.setValues({
            name: academy.name,
            logo_url: academy.logo_url || '',
            footer_content: academy.footer_content || '',
        });
        open();
    };

    const handleDelete = (academy: Academy) => {
        modals.openConfirmModal({
            title: '학원 삭제',
            children: (
                <Text size="sm">
                    정말로 <strong>{academy.name}</strong>을(를) 삭제하시겠습니까?
                    <br />
                    이 작업은 되돌릴 수 없으며, 모든 관련 데이터가 삭제됩니다.
                </Text>
            ),
            labels: { confirm: '삭제', cancel: '취소' },
            confirmProps: { color: 'red' },
            onConfirm: () => deleteMutation.mutate(academy.id),
        });
    };

    const handleCreate = () => {
        setEditingAcademy(null);
        form.reset();
        open();
    };

    const academies: Academy[] = data?.academies || [];

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <Title order={1} style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    학원 관리
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
                    학원 추가
                </Button>
            </Group>

            <Grid mb="xl">
                <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card
                        shadow="sm"
                        padding="lg"
                        style={{
                            border: '3px solid #000',
                            boxShadow: '6px 6px 0 #000',
                        }}
                    >
                        <IconBuilding size={40} />
                        <Text size="xl" fw={700} mt="md">
                            전체 학원
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantBlue">
                            {academies.length}
                        </Text>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 6 }}>
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
                            활성 학원
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantGreen">
                            {academies.filter((a) => a.status === 'active').length}
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
                {isLoading ? (
                    <Text>로딩 중...</Text>
                ) : academies.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                        아직 등록된 학원이 없습니다.
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
                                <Table.Th>학원명</Table.Th>
                                <Table.Th>상태</Table.Th>
                                <Table.Th>생성일</Table.Th>
                                <Table.Th>작업</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {academies.map((academy) => (
                                <Table.Tr key={academy.id}>
                                    <Table.Td>
                                        <Text fw={700}>{academy.name}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={academy.status === 'active' ? 'green' : 'red'}
                                            variant="filled"
                                        >
                                            {academy.status === 'active' ? '활성' : '정지'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        {new Date(academy.created_at).toLocaleDateString('ko-KR')}
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <ActionIcon
                                                variant="light"
                                                color="blue"
                                                onClick={() => handleEdit(academy)}
                                            >
                                                <IconEdit size={18} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="light"
                                                color="red"
                                                onClick={() => handleDelete(academy)}
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
                    setEditingAcademy(null);
                }}
                title={
                    <Text size="lg" fw={700}>
                        {editingAcademy ? '학원 수정' : '학원 추가'}
                    </Text>
                }
                size="lg"
            >
                <form onSubmit={form.onSubmit((values) => saveMutation.mutate(values))}>
                    <Stack gap="md">
                        <TextInput
                            label="학원 이름"
                            placeholder="예: 이스턴영어공부방"
                            required
                            {...form.getInputProps('name')}
                        />

                        <TextInput
                            label="로고 URL"
                            placeholder="https://example.com/logo.png"
                            {...form.getInputProps('logo_url')}
                        />

                        <Textarea
                            label="푸터 내용"
                            placeholder="학원 정보, 연락처 등"
                            rows={4}
                            {...form.getInputProps('footer_content')}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button
                                variant="default"
                                onClick={() => {
                                    close();
                                    form.reset();
                                    setEditingAcademy(null);
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
                                {editingAcademy ? '수정' : '생성'}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </div>
    );
}
