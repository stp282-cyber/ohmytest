import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/student/lessons/[id]/words - 학습용 단어 목록 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['student']);
        const { id } = params;

        // daily_lesson 조회
        const { data: dailyLesson } = await supabaseAdmin
            .from('daily_lessons')
            .select(`
        *,
        student_curriculum:student_curriculums(
          curriculum:curriculums(
            wordbook_id,
            start_word_no,
            end_word_no
          )
        )
      `)
            .eq('id', id)
            .eq('student_id', session.user.id)
            .single();

        if (!dailyLesson) {
            return NextResponse.json(
                { error: '학습을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        const curriculum = dailyLesson.student_curriculum?.curriculum;
        if (!curriculum) {
            return NextResponse.json(
                { error: '커리큘럼 정보가 없습니다.' },
                { status: 404 }
            );
        }

        // 해당 범위의 단어 조회
        const { data: words, error } = await supabaseAdmin
            .from('words')
            .select('*')
            .eq('wordbook_id', curriculum.wordbook_id)
            .gte('no', dailyLesson.start_word_no)
            .lte('no', dailyLesson.end_word_no)
            .order('no', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ words: words || [] });
    } catch (error: any) {
        console.error('Get lesson words error:', error);
        return NextResponse.json(
            { error: error.message || '단어 목록을 불러오는데 실패했습니다.' },
            { status: 500 }
        );
    }
}
