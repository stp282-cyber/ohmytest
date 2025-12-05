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
    FileButton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { IconPlus, IconEdit, IconTrash, IconBook, IconDownload, IconUpload, IconFileDownload } from '@tabler/icons-react';

interface Wordbook {
    id: string;
    name: string;
    textbook_name: string;
    word_count: number;
    created_at: string;
}

export default function WordbooksPage() {
    const queryClient = useQueryClient();
    const [opened, { open, close }] = useDisclosure(false);
    const [editingWordbook, setEditingWordbook] = useState<Wordbook | null>(null);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadWordbookId, setUploadWordbookId] = useState<string>('');

    const form = useForm({
        initialValues: {
            name: '',
            textbook_name: '',
        },
        validate: {
            name: (value) => (!value ? '단어장 이름은 필수입니다' : null),
        },
    });

    // 단어장 목록 조회
    const { data, isLoading } = useQuery({
        queryKey: ['wordbooks'],
        queryFn: async () => {
            const res = await fetch('/api/wordbooks');
            if (!res.ok) throw new Error('Failed to fetch wordbooks');
            return res.json();
        },
    });

    // 단어장 생성/수정
    const saveMutation = useMutation({
        mutationFn: async (values: typeof form.values) => {
            const url = editingWordbook ? `/api/wordbooks/${editingWordbook.id}` : '/api/wordbooks';
            const method = editingWordbook ? 'PATCH' : 'POST';

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
            queryClient.invalidateQueries({ queryKey: ['wordbooks'] });
            notifications.show({
                title: '성공',
                message: editingWordbook ? '단어장이 수정되었습니다.' : '단어장이 생성되었습니다.',
                color: 'green',
            });
            close();
            form.reset();
            setEditingWordbook(null);
        },
        onError: (error: Error) => {
            notifications.show({
                title: '오류',
                message: error.message,
                color: 'red',
            });
        },
    });

    // 단어장 삭제
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const res = await fetch(`/api/wordbooks/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wordbooks'] });
            notifications.show({
                title: '성공',
                message: '단어장이 삭제되었습니다.',
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

    // Excel 업로드
    const uploadMutation = useMutation({
        mutationFn: async ({ file, wordbookId }: { file: File; wordbookId: string }) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('wordbook_id', wordbookId);
            formData.append('clear_existing', 'true');

            const res = await fetch('/api/wordbooks/import', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error);
            }

            return res.json();
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['wordbooks'] });
            notifications.show({
                title: '성공',
                message: `${data.imported}개의 단어가 업로드되었습니다.`,
                color: 'green',
            });
            setUploadFile(null);
            setUploadWordbookId('');
        },
        onError: (error: Error) => {
            notifications.show({
                title: '오류',
                message: error.message,
                color: 'red',
            });
        },
    });

    const handleEdit = (wordbook: Wordbook) => {
        setEditingWordbook(wordbook);
        form.setValues({
            name: wordbook.name,
            textbook_name: wordbook.textbook_name || '',
        });
        open();
    };

    const handleDelete = (wordbook: Wordbook) => {
        modals.openConfirmModal({
            title: '단어장 삭제',
            children: (
                <Text size="sm">
                    정말로 <strong>{wordbook.name}</strong>을(를) 삭제하시겠습니까?
                    <br />
                    모든 단어가 삭제됩니다.
                </Text>
            ),
            labels: { confirm: '삭제', cancel: '취소' },
            confirmProps: { color: 'red' },
            onConfirm: () => deleteMutation.mutate(wordbook.id),
        });
    };

    const handleCreate = () => {
        setEditingWordbook(null);
        form.reset();
        open();
    };

    const handleDownloadTemplate = () => {
        window.open('/api/wordbooks/template', '_blank');
    };

    const handleExport = (wordbookId: string) => {
        window.open(`/api/wordbooks/export/${wordbookId}`, '_blank');
    };

    const handleUpload = (wordbook: Wordbook) => {
        modals.open({
            title: `${wordbook.name} - Excel 업로드`,
            children: (
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Excel 파일을 업로드하면 기존 단어가 모두 삭제되고 새로운 단어로 대체됩니다.
                    </Text>
                    <FileButton
                        onChange={(file) => {
                            if (file) {
                                uploadMutation.mutate({ file, wordbookId: wordbook.id });
                                modals.closeAll();
                            }
                        }}
                        accept=".xlsx,.xls"
                    >
                        {(props) => (
                            <Button {...props} leftSection={<IconUpload size={16} />}>
                                파일 선택
                            </Button>
                        )}
                    </FileButton>
                </Stack>
            ),
        });
    };

    const wordbooks: Wordbook[] = data?.wordbooks || [];

    return (
        <div>
            <Group justify="space-between" mb="xl">
                <Title order={1} style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    단어장 관리
                </Title>
                <Group>
                    <Button
                        leftSection={<IconFileDownload size={20} />}
                        onClick={handleDownloadTemplate}
                        variant="outline"
                    >
                        템플릿 다운로드
                    </Button>
                    <Button
                        leftSection={<IconPlus size={20} />}
                        onClick={handleCreate}
                        style={{
                            backgroundColor: '#ffd15c',
                            color: '#000',
                            border: '3px solid #000',
                        }}
                    >
                        단어장 추가
                    </Button>
                </Group>
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
                            전체 단어장
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantBlue">
                            {wordbooks.length}
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
                        <IconBook size={40} />
                        <Text size="xl" fw={700} mt="md">
                            전체 단어
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantGreen">
                            {wordbooks.reduce((sum, w) => sum + w.word_count, 0)}
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
                ) : wordbooks.length === 0 ? (
                    <Text c="dimmed" ta="center" py="xl">
                        아직 등록된 단어장이 없습니다.
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
                                <Table.Th>단어장명</Table.Th>
                                <Table.Th>교재명</Table.Th>
                                <Table.Th>단어 수</Table.Th>
                                <Table.Th>생성일</Table.Th>
                                <Table.Th>작업</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {wordbooks.map((wordbook) => (
                                <Table.Tr key={wordbook.id}>
                                    <Table.Td>
                                        <Text fw={700}>{wordbook.name}</Text>
                                    </Table.Td>
                                    <Table.Td>{wordbook.textbook_name || '-'}</Table.Td>
                                    <Table.Td>
                                        <Text fw={600}>{wordbook.word_count}개</Text>
                                    </Table.Td>
                                    <Table.Td>
                                        {new Date(wordbook.created_at).toLocaleDateString('ko-KR')}
                                    </Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <ActionIcon
                                                variant="light"
                                                color="green"
                                                onClick={() => handleUpload(wordbook)}
                                                title="Excel 업로드"
                                            >
                                                <IconUpload size={18} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="light"
                                                color="cyan"
                                                onClick={() => handleExport(wordbook.id)}
                                                title="Excel 다운로드"
                                            >
                                                <IconDownload size={18} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="light"
                                                color="blue"
                                                onClick={() => handleEdit(wordbook)}
                                            >
                                                <IconEdit size={18} />
                                            </ActionIcon>
                                            <ActionIcon
                                                variant="light"
                                                color="red"
                                                onClick={() => handleDelete(wordbook)}
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
                    setEditingWordbook(null);
                }}
                title={
                    <Text size="lg" fw={700}>
                        {editingWordbook ? '단어장 수정' : '단어장 추가'}
                    </Text>
                }
                size="md"
            >
                <form onSubmit={form.onSubmit((values) => saveMutation.mutate(values))}>
                    <Stack gap="md">
                        <TextInput
                            label="단어장 이름"
                            placeholder="예: 중학 영단어 1학년"
                            required
                            {...form.getInputProps('name')}
                        />

                        <TextInput
                            label="교재명"
                            placeholder="예: 능률 중학 영어"
                            {...form.getInputProps('textbook_name')}
                        />

                        <Group justify="flex-end" mt="md">
                            <Button
                                variant="default"
                                onClick={() => {
                                    close();
                                    form.reset();
                                    setEditingWordbook(null);
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
                                {editingWordbook ? '수정' : '생성'}
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </div>
    );
}
