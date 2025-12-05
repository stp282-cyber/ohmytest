import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/student/tests - 시험 세션 시작
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(['student']);
        const body = await request.json();
        const { daily_lesson_id, test_type } = body;

        if (!daily_lesson_id || !test_type) {
            return NextResponse.json(
                { error: '필수 항목을 입력해주세요.' },
                { status: 400 }
            );
        }

        // daily_lesson 조회
        const { data: dailyLesson } = await supabaseAdmin
            .from('daily_lessons')
            .select(`
        *,
        student_curriculum:student_curriculums(
          curriculum:curriculums(
            wordbook_id,
            curriculum_items(test_type, time_limit_minutes)
          )
        )
      `)
            .eq('id', daily_lesson_id)
            .eq('student_id', session.user.id)
            .single();

        if (!dailyLesson) {
            return NextResponse.json(
                { error: '학습을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 시험 세션 생성
        const { data: testSession, error } = await supabaseAdmin
            .from('test_sessions')
            .insert({
                student_id: session.user.id,
                daily_lesson_id,
                test_type,
                status: 'in_progress',
                start_time: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ testSession }, { status: 201 });
    } catch (error: any) {
        console.error('Start test error:', error);
        return NextResponse.json(
            { error: error.message || '시험 시작에 실패했습니다.' },
            { status: 500 }
        );
    }
}
