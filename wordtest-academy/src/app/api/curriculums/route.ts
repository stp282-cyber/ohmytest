import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/curriculums - 커리큘럼 목록 조회
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth(['academy_admin']);

        const { data: curriculums, error } = await supabaseAdmin
            .from('curriculums')
            .select(`
        *,
        wordbook:wordbooks(id, name, word_count)
      `)
            .eq('academy_id', session.user.academy_id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ curriculums: curriculums || [] });
    } catch (error: any) {
        console.error('Get curriculums error:', error);
        return NextResponse.json(
            { error: error.message || '커리큘럼 목록을 불러오는데 실패했습니다.' },
            { status: 500 }
        );
    }
}

// POST /api/curriculums - 커리큘럼 생성
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(['academy_admin']);
        const body = await request.json();
        const { name, wordbook_id, start_word_no, end_word_no, words_per_day } = body;

        if (!name || !wordbook_id || !start_word_no || !end_word_no || !words_per_day) {
            return NextResponse.json(
                { error: '필수 항목을 모두 입력해주세요.' },
                { status: 400 }
            );
        }

        // 총 단어 수 계산
        const totalWords = end_word_no - start_word_no + 1;
        const totalDays = Math.ceil(totalWords / words_per_day);

        const { data: curriculum, error } = await supabaseAdmin
            .from('curriculums')
            .insert({
                name,
                wordbook_id,
                academy_id: session.user.academy_id,
                start_word_no,
                end_word_no,
                words_per_day,
                total_days: totalDays,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ curriculum }, { status: 201 });
    } catch (error: any) {
        console.error('Create curriculum error:', error);
        return NextResponse.json(
            { error: error.message || '커리큘럼 생성에 실패했습니다.' },
            { status: 500 }
        );
    }
}
