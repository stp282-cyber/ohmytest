'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Container,
    Paper,
    Title,
    Text,
    TextInput,
    Button,
    Progress,
    Group,
    Stack,
    Badge,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconRefresh } from '@tabler/icons-react';

interface Word {
    id: string;
    english: string;
    korean: string;
    no: number;
}

interface TypingTestProps {
    lessonId: string;
    words: Word[];
    onComplete: (results: any[]) => void;
}

export default function TypingTest({ lessonId, words, onComplete }: TypingTestProps) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const currentWord = words[currentIndex];
    const progress = ((currentIndex + 1) / words.length) * 100;

    const checkAnswer = () => {
        const userAnswer = answer.trim().toLowerCase();
        const correctAnswer = currentWord.english.toLowerCase();
        const correct = userAnswer === correctAnswer;

        setIsCorrect(correct);
        setShowResult(true);

        const result = {
            word_id: currentWord.id,
            is_correct: correct,
            student_answer: answer.trim(),
        };

        setResults([...results, result]);
    };

    const handleNext = () => {
        if (currentIndex < words.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setAnswer('');
            setShowResult(false);
        } else {
            // 시험 완료
            handleComplete();
        }
    };

    const handleRetry = () => {
        setAnswer('');
        setShowResult(false);
    };

    const handleComplete = async () => {
        try {
            // 시험 세션 생성
            const sessionRes = await fetch('/api/student/tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    daily_lesson_id: lessonId,
                    test_type: 'typing',
                }),
            });

            if (!sessionRes.ok) throw new Error('Failed to create test session');

            const { testSession } = await sessionRes.json();

            // 결과 제출
            const submitRes = await fetch(`/api/student/tests/${testSession.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'completed',
                    results: [...results, {
                        word_id: currentWord.id,
                        is_correct: isCorrect,
                        student_answer: answer.trim(),
                    }],
                }),
            });

            if (!submitRes.ok) throw new Error('Failed to submit test');

            const correctCount = results.filter(r => r.is_correct).length + (isCorrect ? 1 : 0);
            const score = Math.round((correctCount / words.length) * 100);

            notifications.show({
                title: '시험 완료!',
                message: `점수: ${score}점 (${correctCount}/${words.length})`,
                color: score >= 80 ? 'green' : 'yellow',
            });

            onComplete(results);
        } catch (error) {
            console.error('Complete test error:', error);
            notifications.show({
                title: '오류',
                message: '시험 제출에 실패했습니다.',
                color: 'red',
            });
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !showResult && answer.trim()) {
            checkAnswer();
        } else if (e.key === 'Enter' && showResult) {
            handleNext();
        }
    };

    if (!currentWord) {
        return (
            <Container size="sm" py="xl">
                <Text>단어를 불러오는 중...</Text>
            </Container>
        );
    }

    return (
        <Container size="sm" py="xl">
            <Stack gap="xl">
                {/* 진행률 */}
                <div>
                    <Group justify="space-between" mb="xs">
                        <Text size="sm" fw={500}>
                            진행률
                        </Text>
                        <Text size="sm" c="dimmed">
                            {currentIndex + 1} / {words.length}
                        </Text>
                    </Group>
                    <Progress value={progress} size="lg" style={{ border: '2px solid #000' }} />
                </div>

                {/* 문제 카드 */}
                <Paper
                    p="xl"
                    style={{
                        border: '4px solid #000',
                        boxShadow: '8px 8px 0 #000',
                        backgroundColor: showResult
                            ? isCorrect
                                ? '#d4edda'
                                : '#f8d7da'
                            : '#fff',
                    }}
                >
                    <Stack gap="lg">
                        <div>
                            <Text size="sm" c="dimmed" mb="xs">
                                한글 뜻
                            </Text>
                            <Title order={2} style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                                {currentWord.korean}
                            </Title>
                        </div>

                        {!showResult ? (
                            <TextInput
                                size="lg"
                                placeholder="영어 단어를 입력하세요"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                onKeyPress={handleKeyPress}
                                autoFocus
                                styles={{
                                    input: {
                                        border: '3px solid #000',
                                        fontSize: '1.5rem',
                                        fontWeight: 700,
                                    },
                                }}
                            />
                        ) : (
                            <div>
                                <Group gap="xs" mb="sm">
                                    {isCorrect ? (
                                        <Badge size="lg" color="green" leftSection={<IconCheck size={16} />}>
                                            정답!
                                        </Badge>
                                    ) : (
                                        <Badge size="lg" color="red" leftSection={<IconX size={16} />}>
                                            오답
                                        </Badge>
                                    )}
                                </Group>

                                <Stack gap="xs">
                                    <div>
                                        <Text size="sm" c="dimmed">
                                            정답
                                        </Text>
                                        <Text size="xl" fw={700} c="green">
                                            {currentWord.english}
                                        </Text>
                                    </div>

                                    {!isCorrect && (
                                        <div>
                                            <Text size="sm" c="dimmed">
                                                내 답
                                            </Text>
                                            <Text size="xl" fw={700} c="red">
                                                {answer || '(입력 없음)'}
                                            </Text>
                                        </div>
                                    )}
                                </Stack>
                            </div>
                        )}
                    </Stack>
                </Paper>

                {/* 버튼 */}
                <Group justify="center">
                    {!showResult ? (
                        <Button
                            size="lg"
                            onClick={checkAnswer}
                            disabled={!answer.trim()}
                            style={{
                                backgroundColor: '#ffd15c',
                                color: '#000',
                                border: '3px solid #000',
                                minWidth: '200px',
                            }}
                        >
                            확인
                        </Button>
                    ) : (
                        <>
                            {!isCorrect && (
                                <Button
                                    size="lg"
                                    variant="outline"
                                    onClick={handleRetry}
                                    leftSection={<IconRefresh size={20} />}
                                    style={{
                                        border: '3px solid #000',
                                    }}
                                >
                                    다시 풀기
                                </Button>
                            )}
                            <Button
                                size="lg"
                                onClick={handleNext}
                                style={{
                                    backgroundColor: '#ffd15c',
                                    color: '#000',
                                    border: '3px solid #000',
                                    minWidth: '200px',
                                }}
                            >
                                {currentIndex < words.length - 1 ? '다음' : '완료'}
                            </Button>
                        </>
                    )}
                </Group>
            </Stack>
        </Container>
    );
}
