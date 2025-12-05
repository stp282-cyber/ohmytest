'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Title,
    Button,
    Table,
    ActionIcon,
    Group,
    Text,
    Paper,
    Modal,
    TextInput,
    Stack,
    Grid,
    Card,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus, IconEdit, IconTrash, IconSchool, IconUsers } from '@tabler/icons-react';

interface Class {
    id: string;
    name: string;
    teacher?: { id: string; full_name: string };
    student_count: number;
    created_at: string;
}

export default function ClassesPage() {
    const queryClient = useQueryClient();
    const [opened, { open, close }] = useDisclosure(false);
    const [editingClass, setEditingClass] = useState<Class | null>(null);

    const form = useForm({
        initialValues: {
            name: '',
        },
        validate: {
            name: (value) => (!value ? '반 이름은 필수입니다' : null),
        },
    });

    // 반 목록 조회
    const { data, isLoading } = useQuery({
        queryKey: ['classes'],
        queryFn: async () => {
            const res = await fetch('/api/classes');
            if (!res.ok) throw new Error('Failed to fetch classes');
            return res.json();
        },
    });

    // 반 생성/수정
    const saveMutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            const url = editingClass ? `/api/classes/${editingClass.id}` : '/api/classes';
            const method = editingClass ? 'PATCH' : 'POST';

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
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            notifications.show({
                title: '성공',
                message: editingClass ? '반이 수정되었습니다.' : '반이 생성되었습니다.',
                color: 'green',
            });
            close();
            form.reset();
            setEditingClass(null);
        },
        onError: (error: Error) => {
            notifications.show({
                title: '오류',
                message: error.message,
                color: 'red',
            });
        },
    });

    // 반 삭제
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/classes/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['classes'] });
            notifications.show({
                title: '성공',
                message: '반이 삭제되었습니다.',
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

    const handleEdit = (classData: Class) => {
        setEditingClass(classData);
        form.setValues({
            name: classData.name,
        });
        open();
    };

    const handleDelete = (classData: Class) => {
        modals.openConfirmModal({
            title: '반 삭제',
            children: (
                <Text size="sm">
                    정말로 <strong>{classData.name}</strong>을(를) 삭제하시겠습니까?
                    <br />
                    학생들의 반 배정이 해제됩니다.
                </Text>
            ),
            labels: { confirm: '삭제', cancel: '취소' },
            confirmProps: { color: 'red' },
            onConfirm: () => deleteMutation.mutate(classData.id),
        });
    };

    const handleCreate = () => {
        setEditingClass(null);
        form.reset();
        open();
    };

    const classes: Class[] = data?.classes || [];

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <Title order={1} style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    반 관리
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
                    반 추가
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
                        <IconSchool size={40} />
                        <Text size="xl" fw={700} mt="md">
                            전체 반
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantBlue">
                            {classes.length}
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
                            전체 학생
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantGreen">
                            {classes.reduce((sum, c) => sum + c.student_count, 0)}
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
                ) : classes.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                        아직 등록된 반이 없습니다.
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
                                <Table.Th>반 이름</Table.Th>
                                <Table.Th>담임</Table.Th>
                                <Table.Th>학생 수</Table.Th>
                                <Table.Th>생성일</Table.Th>
                                <Table.Th>작업</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {classes.map((classData) => (
                                <Table.Tr key={classData.id}>
                                    <Table.Td>
                                        <Text fw={700}>{classData.name}</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        {classData.teacher?.full_name || (
                                            <Text c="dimmed" size="sm">
                                                미지정
                                            </Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        <Text fw={600}>{classData.student_count}명</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        {new Date(classData.created_at).toLocaleDateString('ko-KR')}
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <ActionIcon
                                                variant="light"
                                                color="blue"
                                                onClick={() => handleEdit(classData)}
                                            >
                                                <IconEdit size={18} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="light"
                                                color="red"
                                                onClick={() => handleDelete(classData)}
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
                    setEditingClass(null);
                }}
                title={
                    <Text size="lg" fw={700}>
                        {editingClass ? '반 수정' : '반 추가'}
                    </Text>
                }
                size="md"
            >
                <form onSubmit={form.onSubmit((values) => saveMutation.mutate(values))}>
                    <Stack gap="md">
                        <TextInput
                            label="반 이름"
                            placeholder="예: 초등 1반, 중등 A반"
                            required
                            {...form.getInputProps('name')}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button
                                variant="default"
                                onClick={() => {
                                    close();
                                    form.reset();
                                    setEditingClass(null);
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
                                {editingClass ? '수정' : '생성'}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </div>
    );
}
