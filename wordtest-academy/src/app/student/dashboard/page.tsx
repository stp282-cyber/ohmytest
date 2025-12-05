'use client';

import { useQuery } from '@tanstack/react-query';
import {
    Title,
    Text,
    Paper,
    Grid,
    Card,
    Badge,
    Button,
    Stack,
    Group,
} from '@mantine/core';
import { IconBook, IconClock, IconTrophy, IconCoin, IconAlertCircle } from '@tabler/icons-react';

export default function StudentDashboardPage() {
    // 대시보드 데이터 조회
    const { data, isLoading } = useQuery({
        queryKey: ['student-dashboard'],
        queryFn: async () => {
            const res = await fetch('/api/student/dashboard');
            if (!res.ok) throw new Error('Failed to fetch dashboard');
            return res.json();
        },
    });

    const dashboard = data || {
        curriculums: [],
        todayLessons: [],
        incompleteLessons: [],
        recentTests: [],
        totalDollars: 0,
    };

    return (
        <div>
            <Title order={1} mb="xl" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                대시보드
            </Title>

            {/* 통계 카드 */}
            <Grid mb="xl">
                <Grid.Col span={{ base: 12, md: 3 }}>
                    <Card
                        shadow="sm"
                        padding="lg"
                        style={{
                            border: '3px solid #000',
                            boxShadow: '6px 6px 0 #000',
                            backgroundColor: '#ffd15c',
                        }}
                    >
                        <IconCoin size={40} />
                        <Text size="xl" fw={700} mt="md">
                            보유 달러
                        </Text>
                        <Text size="3xl" fw={900}>
                            {dashboard.totalDollars} $
                        </Text>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 3 }}>
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
                            오늘의 학습
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantBlue">
                            {dashboard.todayLessons.length}
                        </Text>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 3 }}>
                    <Card
                        shadow="sm"
                        padding="lg"
                        style={{
                            border: '3px solid #000',
                            boxShadow: '6px 6px 0 #000',
                        }}
                    >
                        <IconAlertCircle size={40} />
                        <Text size="xl" fw={700} mt="md">
                            미완료 학습
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantPink">
                            {dashboard.incompleteLessons.length}
                        </Text>
                    </Card>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 3 }}>
                    <Card
                        shadow="sm"
                        padding="lg"
                        style={{
                            border: '3px solid #000',
                            boxShadow: '6px 6px 0 #000',
                        }}
                    >
                        <IconTrophy size={40} />
                        <Text size="xl" fw={700} mt="md">
                            최근 평균
                        </Text>
                        <Text size="3xl" fw={900} c="vibrantGreen">
                            {dashboard.recentTests.length > 0
                                ? Math.round(
                                    dashboard.recentTests.reduce((sum: number, t: any) => sum + (t.score || 0), 0) /
                                    dashboard.recentTests.length
                                )
                                : 0}
                            점
                        </Text>
                    </Card>
                </Grid.Col>
            </Grid>

            {/* 오늘의 학습 */}
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
                {isLoading ? (
                    <Text c="dimmed">로딩 중...</Text>
                ) : dashboard.todayLessons.length === 0 ? (
                    <Text c="dimmed">오늘 예정된 학습이 없습니다.</Text>
                ) : (
                    <Stack gap="md">
                        {dashboard.todayLessons.map((lesson: any) => (
                            <Paper
                                key={lesson.id}
                                p="md"
                                style={{
                                    border: '2px solid #000',
                                }}
                            >
                                <Group justify="space-between">
                                    <div>
                                        <Text fw={700}>{lesson.student_curriculum?.curriculum?.name}</Text>
                                        <Text size="sm" c="dimmed">
                                            Day {lesson.day_number}
                                        </Text>
                                    </div>
                                    <Group>
                                        <Badge
                                            color={lesson.status === 'completed' ? 'green' : 'yellow'}
                                            variant="filled"
                                        >
                                            {lesson.status === 'completed' ? '완료' : '진행 중'}
                                        </Badge>
                                        <Button
                                            size="sm"
                                            style={{
                                                backgroundColor: '#ffd15c',
                                                color: '#000',
                                                border: '2px solid #000',
                                            }}
                                        >
                                            학습 시작
                                        </Button>
                                    </Group>
                                </Group>
                            </Paper>
                        ))}
                    </Stack>
                )}
            </Paper>

            {/* 미완료 학습 */}
            {dashboard.incompleteLessons.length > 0 && (
                <Paper
                    mb="xl"
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
                        {dashboard.incompleteLessons.slice(0, 5).map((lesson: any) => (
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
                                        <Text fw={700}>{lesson.student_curriculum?.curriculum?.name}</Text>
                                        <Text size="sm" c="dimmed">
                                            {new Date(lesson.lesson_date).toLocaleDateString('ko-KR')} - Day{' '}
                                            {lesson.day_number}
                                        </Text>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        style={{
                                            border: '2px solid #000',
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

            {/* 공지사항 */}
            <Paper
                p="xl"
                style={{
                    border: '3px solid #000',
                    boxShadow: '6px 6px 0 #000',
                }}
            >
                <Text size="lg" fw={700} mb="md">
                    공지사항
                </Text>
                <Text c="dimmed">새로운 공지사항이 없습니다.</Text>
            </Paper>
        </div>
    );
}
