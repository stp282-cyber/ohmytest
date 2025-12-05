import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/wordbooks/[id]/words - 단어 목록 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['academy_admin']);
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        // 단어장 권한 확인
        const { data: wordbook } = await supabaseAdmin
            .from('wordbooks')
            .select('academy_id, is_shared')
            .eq('id', id)
            .single();

        if (
            !wordbook ||
            (wordbook.academy_id !== session.user.academy_id && !wordbook.is_shared)
        ) {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            );
        }

        // 단어 목록 조회
        const { data: words, error, count } = await supabaseAdmin
            .from('words')
            .select('*', { count: 'exact' })
            .eq('wordbook_id', id)
            .order('no', { ascending: true })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return NextResponse.json({
            words,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error: any) {
        console.error('Get words error:', error);
        return NextResponse.json(
            { error: error.message || '단어 목록을 불러오는데 실패했습니다.' },
            { status: 500 }
        );
    }
}

// POST /api/wordbooks/[id]/words - 단어 추가
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['academy_admin']);
        const { id } = params;
        const body = await request.json();
        const { words } = body; // 배열로 받음

        // 단어장 권한 확인
        const { data: wordbook } = await supabaseAdmin
            .from('wordbooks')
            .select('academy_id')
            .eq('id', id)
            .single();

        if (wordbook?.academy_id !== session.user.academy_id) {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            );
        }

        // 단어 추가
        const wordsToInsert = words.map((word: any) => ({
            ...word,
            wordbook_id: id,
        }));

        const { data: insertedWords, error } = await supabaseAdmin
            .from('words')
            .insert(wordsToInsert)
            .select();

        if (error) throw error;

        // 단어장 word_count 업데이트
        const { count } = await supabaseAdmin
            .from('words')
            .select('*', { count: 'exact', head: true })
            .eq('wordbook_id', id);

        await supabaseAdmin
            .from('wordbooks')
            .update({ word_count: count || 0 })
            .eq('id', id);

        return NextResponse.json({ words: insertedWords }, { status: 201 });
    } catch (error: any) {
        console.error('Create words error:', error);
        return NextResponse.json(
            { error: error.message || '단어 추가에 실패했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE /api/wordbooks/[id]/words - 모든 단어 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['academy_admin']);
        const { id } = params;

        // 단어장 권한 확인
        const { data: wordbook } = await supabaseAdmin
            .from('wordbooks')
            .select('academy_id')
            .eq('id', id)
            .single();

        if (wordbook?.academy_id !== session.user.academy_id) {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            );
        }

        // 모든 단어 삭제
        const { error } = await supabaseAdmin
            .from('words')
            .delete()
            .eq('wordbook_id', id);

        if (error) throw error;

        // 단어장 word_count 업데이트
        await supabaseAdmin
            .from('wordbooks')
            .update({ word_count: 0 })
            .eq('id', id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete words error:', error);
        return NextResponse.json(
            { error: error.message || '단어 삭제에 실패했습니다.' },
            { status: 500 }
        );
    }
}
