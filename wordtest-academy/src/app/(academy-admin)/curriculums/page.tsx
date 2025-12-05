'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Title,
    Button,
    Table,
    Group,
    Text,
    Paper,
    Modal,
    TextInput,
    Select,
    NumberInput,
    MultiSelect,
    Stack,
    Grid,
    Card,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconBook, IconUsers, IconCalendar } from '@tabler/icons-react';
import { DateInput } from '@mantine/dates';

export default function CurriculumsPage() {
    const queryClient = useQueryClient();
    const [opened, { open, close }] = useDisclosure(false);
    const [assignOpened, { open: openAssign, close: closeAssign }] = useDisclosure(false);
    const [selectedCurriculum, setSelectedCurriculum] = useState<any>(null);

    const form = useForm({
        initialValues: {
            name: '',
            wordbook_id: '',
            start_word_no: 1,
            end_word_no: 100,
            words_per_day: 20,
        },
        validate: {
            name: (value) => (!value ? '커리큘럼 이름은 필수입니다' : null),
            wordbook_id: (value) => (!value ? '단어장을 선택해주세요' : null),
        },
    });

    const assignForm = useForm({
        initialValues: {
            student_ids: [] as string[],
            start_date: new Date(),
        },
        validate: {
            student_ids: (value) => (value.length === 0 ? '학생을 선택해주세요' : null),
        },
    });

    // 커리큘럼 목록
    const { data: curriculumsData, isLoading } = useQuery({
        queryKey: ['curriculums'],
        queryFn: async () => {
            const res = await fetch('/api/curriculums');
            if (!res.ok) throw new Error('Failed to fetch curriculums');
            return res.json();
        },
    });

    // 단어장 목록
    const { data: wordbooksData } = useQuery({
        queryKey: ['wordbooks'],
        queryFn: async () => {
            const res = await fetch('/api/wordbooks');
            if (!res.ok) throw new Error('Failed to fetch wordbooks');
            return res.json();
        },
    });

    // 학생 목록
    const { data: studentsData } = useQuery({
        queryKey: ['students'],
        queryFn: async () => {
            const res = await fetch('/api/students');
            if (!res.ok) throw new Error('Failed to fetch students');
            return res.json();
        },
    });

    // 커리큘럼 생성
    const createMutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            const res = await fetch('/api/curriculums', {
                method: 'POST',
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
            queryClient.invalidateQueries({ queryKey: ['curriculums'] });
            notifications.show({
                title: '성공',
                message: '커리큘럼이 생성되었습니다.',
                color: 'green',
            });
            close();
            form.reset();
        },
        onError: (error: Error) => {
            notifications.show({
                title: '오류',
                message: error.message,
                color: 'red',
            });
        },
    });

    // 커리큘럼 배정
    const assignMutation = useMutation({
        mutationFn: async (values: typeof assignForm.values) => {
            const res = await fetch('/api/curriculums/assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    curriculum_id: selectedCurriculum.id,
                    student_ids: values.student_ids,
                    start_date: values.start_date.toISOString().split('T')[0],
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            return res.json();
        },
        onSuccess: (data) => {
            notifications.show({
                title: '성공',
                message: `${data.assigned}명의 학생에게 커리큘럼이 배정되었습니다.`,
                color: 'green',
            });
            closeAssign();
            assignForm.reset();
            setSelectedCurriculum(null);
        },
        onError: (error: Error) => {
            notifications.show({
                title: '오류',
                message: error.message,
                color: 'red',
            });
        },
    });

    const handleAssign = (curriculum: any) => {
        setSelectedCurriculum(curriculum);
        openAssign();
    };

    const curriculums = curriculumsData?.curriculums || [];
    const wordbooks = wordbooksData?.wordbooks || [];
    const students = studentsData?.students || [];

    const wordbookOptions = wordbooks.map((w: any) => ({
        value: w.id,
        label: `${w.name} (${w.word_count}개)`,
    }));

    const studentOptions = students.map((s: any) => ({
        value: s.id,
        label: s.full_name,
    }));

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <Title order={1} style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    커리큘럼 관리
                </Title>
                <Button
                    leftSection={<IconPlus size={20} />}
                    onClick={open}
                    style={{
                        backgroundColor: '#ffd15c',
                        color: '#000',
                        border: '3px solid #000',
                    }}
                >
                    커리큘럼 추가
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
                        <IconBook size={40} />
                        <Text size="xl" fw={700} mt="md">
                            전체 커리큘럼
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantBlue">
                            {curriculums.length}
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
                        <IconCalendar size={40} />
                        <Text size="xl" fw={700} mt="md">
                            평균 학습 일수
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantGreen">
                            {curriculums.length > 0
                                ? Math.round(
                                    curriculums.reduce((sum: number, c: any) => sum + c.total_days, 0) /
                                    curriculums.length
                                )
                                : 0}
                            일
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
                ) : curriculums.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                        아직 등록된 커리큘럼이 없습니다.
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
                                <Table.Th>커리큘럼명</Table.Th>
                                <Table.Th>단어장</Table.Th>
                                <Table.Th>단어 범위</Table.Th>
                                <Table.Th>일일 단어</Table.Th>
                                <Table.Th>총 일수</Table.Th>
                                <Table.Th>작업</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {curriculums.map((curriculum: any) => (
                                <Table.Tr key={curriculum.id}>
                                    <Table.Td>
                                        <Text fw={700}>{curriculum.name}</Text>
                                    </Table.Td>
                                    <Table.Td>{curriculum.wordbook?.name}</Table.Td>
                                    <Table.Td>
                                        {curriculum.start_word_no} ~ {curriculum.end_word_no}
                                    </Table.Td>
                                    <Table.Td>{curriculum.words_per_day}개</Table.Td>
                                    <Table.Td>
                                        <Text fw={600}>{curriculum.total_days}일</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            leftSection={<IconUsers size={16} />}
                                            onClick={() => handleAssign(curriculum)}
                                        >
                                            학생 배정
                                        </Button>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                )}
            </Paper>

            {/* 커리큘럼 생성 모달 */}
            <Modal
                opened={opened}
                onClose={() => {
                    close();
                    form.reset();
                }}
                title={<Text size="lg" fw={700}>커리큘럼 추가</Text>}
                size="lg"
            >
                <form onSubmit={form.onSubmit((values) => createMutation.mutate(values))}>
                    <Stack gap="md">
                        <TextInput
                            label="커리큘럼 이름"
                            placeholder="예: 중1 영단어 1학기"
                            required
                            {...form.getInputProps('name')}
                        />

                        <Select
                            label="단어장"
                            placeholder="단어장 선택"
                            required
                            data={wordbookOptions}
                            {...form.getInputProps('wordbook_id')}
                        />

                        <Group grow>
                            <NumberInput
                                label="시작 단어 번호"
                                min={1}
                                {...form.getInputProps('start_word_no')}
                            />
                            <NumberInput
                                label="종료 단어 번호"
                                min={1}
                                {...form.getInputProps('end_word_no')}
                            />
                        </Group>

                        <NumberInput
                            label="일일 학습 단어 수"
                            min={1}
                            max={100}
                            {...form.getInputProps('words_per_day')}
                        />

                        <Text size="sm" c="dimmed">
                            총 학습 일수:{' '}
                            {Math.ceil(
                                (form.values.end_word_no - form.values.start_word_no + 1) /
                                form.values.words_per_day
                            )}
                            일
                        </Text>

                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={() => { close(); form.reset(); }}>
                                취소
                            </Button>
                            <Button
                                type="submit"
                                loading={createMutation.isPending}
                                style={{
                                    backgroundColor: '#ffd15c',
                                    color: '#000',
                                    border: '3px solid #000',
                                }}
                            >
                                생성
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>

            {/* 학생 배정 모달 */}
            <Modal
                opened={assignOpened}
                onClose={() => {
                    closeAssign();
                    assignForm.reset();
                    setSelectedCurriculum(null);
                }}
                title={
                    <Text size="lg" fw={700}>
                        {selectedCurriculum?.name} - 학생 배정
                    </Text>
                }
                size="md"
            >
                <form onSubmit={assignForm.onSubmit((values) => assignMutation.mutate(values))}>
                    <Stack gap="md">
                        <MultiSelect
                            label="학생 선택"
                            placeholder="학생을 선택하세요"
                            required
                            data={studentOptions}
                            {...assignForm.getInputProps('student_ids')}
                        />

                        <DateInput
                            label="시작 날짜"
                            placeholder="시작 날짜"
                            {...assignForm.getInputProps('start_date')}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button
                                variant="default"
                                onClick={() => {
                                    closeAssign();
                                    assignForm.reset();
                                    setSelectedCurriculum(null);
                                }}
                            >
                                취소
                            </Button>
                            <Button
                                type="submit"
                                loading={assignMutation.isPending}
                                style={{
                                    backgroundColor: '#ffd15c',
                                    color: '#000',
                                    border: '3px solid #000',
                                }}
                            >
                                배정
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </div>
    );
}
