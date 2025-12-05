import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/student/dashboard - 학생 대시보드 데이터
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth(['student']);
        const studentId = session.user.id;

        // 학생의 커리큘럼 조회
        const { data: studentCurriculums } = await supabaseAdmin
            .from('student_curriculums')
            .select(`
        *,
        curriculum:curriculums(
          id,
          name,
          wordbook:wordbooks(id, name)
        )
      `)
            .eq('student_id', studentId)
            .eq('status', 'active');

        // 오늘의 학습 (daily_lessons)
        const today = new Date().toISOString().split('T')[0];
        const { data: todayLessons } = await supabaseAdmin
            .from('daily_lessons')
            .select(`
        *,
        student_curriculum:student_curriculums(
          curriculum:curriculums(name)
        )
      `)
            .eq('student_id', studentId)
            .eq('lesson_date', today);

        // 미완료 학습
        const { data: incompleteLessons } = await supabaseAdmin
            .from('daily_lessons')
            .select(`
        *,
        student_curriculum:student_curriculums(
          curriculum:curriculums(name)
        )
      `)
            .eq('student_id', studentId)
            .eq('status', 'incomplete')
            .lt('lesson_date', today)
            .order('lesson_date', { ascending: false })
            .limit(10);

        // 최근 시험 결과
        const { data: recentTests } = await supabaseAdmin
            .from('test_sessions')
            .select('*')
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
            .limit(5);

        // 달러 잔액
        const { data: dollarTransactions } = await supabaseAdmin
            .from('dollar_transactions')
            .select('amount')
            .eq('student_id', studentId);

        const totalDollars = dollarTransactions?.reduce(
            (sum, t) => sum + t.amount,
            0
        ) || 0;

        return NextResponse.json({
            curriculums: studentCurriculums || [],
            todayLessons: todayLessons || [],
            incompleteLessons: incompleteLessons || [],
            recentTests: recentTests || [],
            totalDollars,
        });
    } catch (error: any) {
        console.error('Get dashboard error:', error);
        return NextResponse.json(
            { error: error.message || '대시보드 데이터를 불러오는데 실패했습니다.' },
            { status: 500 }
        );
    }
}
