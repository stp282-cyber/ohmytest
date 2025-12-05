import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// PATCH /api/student/tests/[id] - 시험 세션 업데이트 (제출)
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['student']);
        const { id } = params;
        const body = await request.json();
        const { status, results } = body;

        // 시험 세션 확인
        const { data: testSession } = await supabaseAdmin
            .from('test_sessions')
            .select('*')
            .eq('id', id)
            .eq('student_id', session.user.id)
            .single();

        if (!testSession) {
            return NextResponse.json(
                { error: '시험을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 시험 세션 업데이트
        const updateData: any = {};
        if (status) updateData.status = status;
        if (status === 'completed') {
            updateData.end_time = new Date().toISOString();
        }

        const { data: updatedSession, error } = await supabaseAdmin
            .from('test_sessions')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 시험 결과 저장
        if (results && Array.isArray(results)) {
            const testResults = results.map((result: any) => ({
                test_session_id: id,
                word_id: result.word_id,
                is_correct: result.is_correct,
                student_answer: result.student_answer,
            }));

            await supabaseAdmin.from('test_results').insert(testResults);

            // 점수 계산
            const correctCount = results.filter((r: any) => r.is_correct).length;
            const totalCount = results.length;
            const score = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

            // 세션에 점수 업데이트
            await supabaseAdmin
                .from('test_sessions')
                .update({ score: Math.round(score) })
                .eq('id', id);

            // daily_lesson 상태 업데이트
            if (status === 'completed' && score >= 80) {
                await supabaseAdmin
                    .from('daily_lessons')
                    .update({ status: 'completed' })
                    .eq('id', testSession.daily_lesson_id);

                // 달러 지급 (완료 보상)
                const { data: academySettings } = await supabaseAdmin
                    .from('academy_settings')
                    .select('daily_completion_dollars')
                    .eq('academy_id', session.user.academy_id)
                    .single();

                const dollars = academySettings?.daily_completion_dollars || 10;

                await supabaseAdmin.from('dollar_transactions').insert({
                    student_id: session.user.id,
                    amount: dollars,
                    transaction_type: 'daily_completion',
                    description: `일일 학습 완료 (${score}점)`,
                });
            }
        }

        return NextResponse.json({ testSession: updatedSession });
    } catch (error: any) {
        console.error('Update test error:', error);
        return NextResponse.json(
            { error: error.message || '시험 업데이트에 실패했습니다.' },
            { status: 500 }
        );
    }
}
