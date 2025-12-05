import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/wordbooks - 단어장 목록 조회
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth(['academy_admin']);
        const { searchParams } = new URL(request.url);
        const includeShared = searchParams.get('include_shared') === 'true';

        let query = supabaseAdmin
            .from('wordbooks')
            .select('*')
            .order('created_at', { ascending: false });

        if (includeShared) {
            // 자신의 학원 단어장 + 공유 단어장
            query = query.or(`academy_id.eq.${session.user.academy_id},is_shared.eq.true`);
        } else {
            // 자신의 학원 단어장만
            query = query.eq('academy_id', session.user.academy_id);
        }

        const { data: wordbooks, error } = await query;

        if (error) throw error;

        return NextResponse.json({ wordbooks });
    } catch (error: any) {
        console.error('Get wordbooks error:', error);
        return NextResponse.json(
            { error: error.message || '단어장 목록을 불러오는데 실패했습니다.' },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

// POST /api/wordbooks - 단어장 생성
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(['academy_admin']);
        const body = await request.json();
        const { name, textbook_name } = body;

        if (!name) {
            return NextResponse.json(
                { error: '단어장 이름은 필수입니다.' },
                { status: 400 }
            );
        }

        const { data: wordbook, error } = await supabaseAdmin
            .from('wordbooks')
            .insert({
                name,
                textbook_name,
                academy_id: session.user.academy_id,
                is_shared: false,
                word_count: 0,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ wordbook }, { status: 201 });
    } catch (error: any) {
        console.error('Create wordbook error:', error);
        return NextResponse.json(
            { error: error.message || '단어장 생성에 실패했습니다.' },
            { status: 500 }
        );
    }
}
