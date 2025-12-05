'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Text, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            username: '',
            password: '',
        },
        validate: {
            username: (value) => (!value ? '사용자명을 입력해주세요' : null),
            password: (value) => (!value ? '비밀번호를 입력해주세요' : null),
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        setLoading(true);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (!response.ok) {
                notifications.show({
                    title: '로그인 실패',
                    message: data.error || '로그인에 실패했습니다.',
                    color: 'red',
                });
                return;
            }

            notifications.show({
                title: '로그인 성공',
                message: `환영합니다, ${data.user.full_name}님!`,
                color: 'green',
            });

            // 역할에 따라 리다이렉트
            switch (data.user.role) {
                case 'super_admin':
                    router.push('/super-admin/academies');
                    break;
                case 'academy_admin':
                    router.push('/academy-admin/students');
                    break;
                case 'student':
                    router.push('/student/dashboard');
                    break;
                default:
                    router.push('/');
            }
        } catch (error) {
            console.error('Login error:', error);
            notifications.show({
                title: '오류',
                message: '로그인 중 오류가 발생했습니다.',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container size={420} my={100}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Title
                    ta="center"
                    style={{
                        fontFamily: 'var(--font-space-grotesk)',
                        fontWeight: 900,
                        fontSize: '2.5rem',
                        textTransform: 'uppercase',
                        letterSpacing: '2px',
                        marginBottom: '2rem',
                    }}
                >
                    WordTest Academy
                </Title>

                <Paper
                    withBorder
                    shadow="md"
                    p={30}
                    radius={0}
                    style={{
                        border: '4px solid #000',
                        boxShadow: '8px 8px 0 #000',
                    }}
                >
                    <form onSubmit={form.onSubmit(handleSubmit)}>
                        <Stack gap="md">
                            <TextInput
                                label="사용자명"
                                placeholder="한글 이름 또는 아이디"
                                required
                                {...form.getInputProps('username')}
                                styles={{
                                    input: {
                                        border: '3px solid #000',
                                        '&:focus': {
                                            borderColor: '#000',
                                        },
                                    },
                                }}
                            />

                            <PasswordInput
                                label="비밀번호"
                                placeholder="비밀번호를 입력하세요"
                                required
                                {...form.getInputProps('password')}
                                styles={{
                                    input: {
                                        border: '3px solid #000',
                                        '&:focus': {
                                            borderColor: '#000',
                                        },
                                    },
                                }}
                            />

                            <Button
                                type="submit"
                                fullWidth
                                loading={loading}
                                size="lg"
                                style={{
                                    marginTop: '1rem',
                                    backgroundColor: '#ffd15c',
                                    color: '#000',
                                    border: '3px solid #000',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                }}
                            >
                                로그인
                            </Button>
                        </Stack>
                    </form>

                    <Text ta="center" mt="md" size="sm" c="dimmed">
                        WordTest Academy는 멀티 테넌트 SaaS 영단어 학습 플랫폼입니다.
                    </Text>
                </Paper>
            </motion.div>
        </Container>
    );
}
