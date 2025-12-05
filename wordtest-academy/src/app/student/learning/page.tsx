'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
    Container,
    Title,
    Text,
    Paper,
    Button,
    Stack,
    Group,
} from '@mantine/core';
import { IconBook } from '@tabler/icons-react';
import TypingTest from '@/components/tests/TypingTest';

export default function LearningPage() {
    const router = useRouter();
    const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
    const [words, setWords] = useState<any[]>([]);

    // 대시보드 데이터 조회
    const { data } = useQuery({
        queryKey: ['student-dashboard'],
        queryFn: async () => {
            const res = await fetch('/api/student/dashboard');
            if (!res.ok) throw new Error('Failed to fetch dashboard');
            return res.json();
        },
    });

    const handleStartLesson = async (lessonId: string) => {
        try {
            // 단어 목록 조회
            const res = await fetch(`/api/student/lessons/${lessonId}/words`);
            if (!res.ok) throw new Error('Failed to fetch words');

            const { words: lessonWords } = await res.json();
            setWords(lessonWords);
            setSelectedLesson(lessonId);
        } catch (error) {
            console.error('Start lesson error:', error);
        }
    };

    const handleComplete = () => {
        setSelectedLesson(null);
        setWords([]);
        router.push('/student/dashboard');
    };

    if (selectedLesson && words.length > 0) {
        return (
            <TypingTest
                lessonId={selectedLesson}
                words={words}
                onComplete={handleComplete}
            />
        );
    }

    const todayLessons = data?.todayLessons || [];
    const incompleteLessons = data?.incompleteLessons || [];

    return (
        <Container size="md" py="xl">
            <Title order={1} mb="xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                나의 학습
            </Title>

            {/* 오늘의 학습 */}
            {todayLessons.length > 0 && (
                <Paper
                    mb="xl"
                    p="xl"
                    style={{
                        border: '3px solid #000',
                        boxShadow: '6px 6px 0 #000',
                    }}
                >
                    <Text size="lg" fw={700} mb="md">
                        오늘의 학습
                    </Text>
                    <Stack gap="md">
                        {todayLessons.map((lesson: any) => (
                            <Paper
                                key={lesson.id}
                                p="md"
                                style={{
                                    border: '2px solid #000',
                                }}
                            >
                                <Group justify="space-between">
                                    <div>
                                        <Group gap="xs" mb="xs">
                                            <IconBook size={20} />
                                            <Text fw={700}>
                                                {lesson.student_curriculum?.curriculum?.name || '학습'}
                                            </Text>
                                        </Group>
                                        <Text size="sm" c="dimmed">
                                            Day {lesson.day_number} - 단어 {lesson.start_word_no}~
                                            {lesson.end_word_no}번
                                        </Text>
                                    </div>
                                    <Button
                                        size="md"
                                        onClick={() => handleStartLesson(lesson.id)}
                                        style={{
                                            backgroundColor: '#ffd15c',
                                            color: '#000',
                                            border: '3px solid #000',
                                        }}
                                    >
                                        학습 시작
                                    </Button>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                </Paper>
            )}

            {/* 미완료 학습 */}
            {incompleteLessons.length > 0 && (
                <Paper
                    p="xl"
                    style={{
                        border: '3px solid #000',
                        boxShadow: '6px 6px 0 #000',
                        backgroundColor: '#fff3cd',
                    }}
                >
                    <Text size="lg" fw={700} mb="md">
                        미완료 학습
                    </Text>
                    <Stack gap="md">
                        {incompleteLessons.map((lesson: any) => (
                            <Paper
                                key={lesson.id}
                                p="md"
                                style={{
                                    border: '2px solid #000',
                                    backgroundColor: '#fff',
                                }}
                            >
                                <Group justify="space-between">
                                    <div>
                                        <Group gap="xs" mb="xs">
                                            <IconBook size={20} />
                                            <Text fw={700}>
                                                {lesson.student_curriculum?.curriculum?.name || '학습'}
                                            </Text>
                                        </Group>
                                        <Text size="sm" c="dimmed">
                                            {new Date(lesson.lesson_date).toLocaleDateString('ko-KR')} - Day{' '}
                                            {lesson.day_number}
                                        </Text>
                                    </div>
                                    <Button
                                        size="md"
                                        variant="outline"
                                        onClick={() => handleStartLesson(lesson.id)}
                                        style={{
                                            border: '3px solid #000',
                                        }}
                                    >
                                        보충 학습
                                    </Button>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                </Paper>
            )}

            {todayLessons.length === 0 && incompleteLessons.length === 0 && (
                <Paper
                    p="xl"
                    style={{
                        border: '3px solid #000',
                        boxShadow: '6px 6px 0 #000',
                    }}
                >
                    <Text c="dimmed" ta="center">
                        현재 진행 중인 학습이 없습니다.
                    </Text>
                </Paper>
            )}
        </Container>
    );
}
