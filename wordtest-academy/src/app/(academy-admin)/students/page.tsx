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
    MultiSelect,
    Select,
    Stack,
    Grid,
    Card,
    Tabs,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus, IconEdit, IconTrash, IconUsers, IconSchool, IconUserPlus } from '@tabler/icons-react';

interface Student {
    id: string;
    username: string;
    full_name: string;
    status: string;
    student_classes: Array<{
        class_id: string;
        classes: { id: string; name: string };
    }>;
}

export default function StudentsPage() {
    const queryClient = useQueryClient();
    const [opened, { open, close }] = useDisclosure(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    const form = useForm({
        initialValues: {
            username: '',
            password: '',
            full_name: '',
            class_ids: [] as string[],
        },
        validate: {
            username: (value) => (!value ? '사용자명은 필수입니다' : null),
            password: (value, values) =>
                !editingStudent && !value ? '비밀번호는 필수입니다' : null,
            full_name: (value) => (!value ? '이름은 필수입니다' : null),
        },
    });

    // 학생 목록 조회
    const { data: studentsData, isLoading: studentsLoading } = useQuery({
        queryKey: ['students'],
        queryFn: async () => {
            const res = await fetch('/api/students');
            if (!res.ok) throw new Error('Failed to fetch students');
            return res.json();
        },
    });

    // 반 목록 조회
    const { data: classesData } = useQuery({
        queryKey: ['classes'],
        queryFn: async () => {
            const res = await fetch('/api/classes');
            if (!res.ok) throw new Error('Failed to fetch classes');
            return res.json();
        },
    });

    // 학생 생성/수정
    const saveMutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            const url = editingStudent ? `/api/students/${editingStudent.id}` : '/api/students';
            const method = editingStudent ? 'PATCH' : 'POST';

            const payload = { ...values };
            if (editingStudent && !values.password) {
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
            queryClient.invalidateQueries({ queryKey: ['students'] });
            notifications.show({
                title: '성공',
                message: editingStudent ? '학생이 수정되었습니다.' : '학생이 생성되었습니다.',
                color: 'green',
            });
            close();
            form.reset();
            setEditingStudent(null);
        },
        onError: (error: Error) => {
            notifications.show({
                title: '오류',
                message: error.message,
                color: 'red',
            });
        },
    });

    // 학생 삭제
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            notifications.show({
                title: '성공',
                message: '학생이 삭제되었습니다.',
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

    const handleEdit = (student: Student) => {
        setEditingStudent(student);
        form.setValues({
            username: student.username,
            password: '',
            full_name: student.full_name,
            class_ids: student.student_classes.map((sc) => sc.class_id),
        });
        open();
    };

    const handleDelete = (student: Student) => {
        modals.openConfirmModal({
            title: '학생 삭제',
            children: (
                <Text size="sm">
                    정말로 <strong>{student.full_name}</strong>을(를) 삭제하시겠습니까?
                    <br />
                    모든 학습 기록이 삭제됩니다.
                </Text>
            ),
            labels: { confirm: '삭제', cancel: '취소' },
            confirmProps: { color: 'red' },
            onConfirm: () => deleteMutation.mutate(student.id),
        });
    };

    const handleCreate = () => {
        setEditingStudent(null);
        form.reset();
        open();
    };

    const students: Student[] = studentsData?.students || [];
    const classes = classesData?.classes || [];

    const classOptions = classes.map((c: any) => ({
        value: c.id,
        label: c.name,
    }));

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <Title order={1} style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    학생 관리
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
                    학생 추가
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
                            전체 학생
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantBlue">
                            {students.length}
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
                            전체 반
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantPink">
                            {classes.length}
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
                        <IconUserPlus size={40} />
                        <Text size="xl" fw={700} mt="md">
                            활성 학생
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantGreen">
                            {students.filter((s) => s.status === 'active').length}
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
                {studentsLoading ? (
                    <Text>로딩 중...</Text>
                ) : students.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                        아직 등록된 학생이 없습니다.
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
                                <Table.Th>반</Table.Th>
                                <Table.Th>상태</Table.Th>
                                <Table.Th>작업</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {students.map((student) => (
                                <Table.Tr key={student.id}>
                                    <Table.Td>
                                        <Text fw={700}>{student.username}</Text>
                                    </Table.Td>
                                    <Table.Td>{student.full_name}</Table.Td>
                                    <Table.Td>
                                        {student.student_classes.length > 0 ? (
                                            <Group gap="xs">
                                                {student.student_classes.map((sc) => (
                                                    <Badge key={sc.class_id} variant="light">
                                                        {sc.classes.name}
                                                    </Badge>
                                                ))}
                                            </Group>
                                        ) : (
                                            <Text c="dimmed" size="sm">
                                                미배정
                                            </Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        <Badge
                                            color={student.status === 'active' ? 'green' : 'red'}
                                            variant="filled"
                                        >
                                            {student.status === 'active' ? '정상' : '휴원'}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <ActionIcon
                                                variant="light"
                                                color="blue"
                                                onClick={() => handleEdit(student)}
                                            >
                                                <IconEdit size={18} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="light"
                                                color="red"
                                                onClick={() => handleDelete(student)}
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
                    setEditingStudent(null);
                }}
                title={
                    <Text size="lg" fw={700}>
                        {editingStudent ? '학생 수정' : '학생 추가'}
                    </Text>
                }
                size="lg"
            >
                <form onSubmit={form.onSubmit((values) => saveMutation.mutate(values))}>
                    <Stack gap="md">
                        <TextInput
                            label="사용자명 (한글 가능)"
                            placeholder="홍길동"
                            required
                            disabled={!!editingStudent}
                            {...form.getInputProps('username')}
                        />

                        <TextInput
                            label="이름"
                            placeholder="홍길동"
                            required
                            {...form.getInputProps('full_name')}
                        />

                        <PasswordInput
                            label={editingStudent ? '비밀번호 (변경시에만 입력)' : '비밀번호'}
                            placeholder="비밀번호"
                            required={!editingStudent}
                            {...form.getInputProps('password')}
                        />

                        <MultiSelect
                            label="반 배정"
                            placeholder="반 선택 (복수 선택 가능)"
                            data={classOptions}
                            {...form.getInputProps('class_ids')}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button
                                variant="default"
                                onClick={() => {
                                    close();
                                    form.reset();
                                    setEditingStudent(null);
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
                                {editingStudent ? '수정' : '생성'}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </div>
    );
}
