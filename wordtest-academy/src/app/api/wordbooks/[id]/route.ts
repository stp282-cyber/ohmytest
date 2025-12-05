import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/wordbooks/[id] - 단어장 상세 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['academy_admin']);
        const { id } = params;

        const { data: wordbook, error } = await supabaseAdmin
            .from('wordbooks')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!wordbook) {
            return NextResponse.json(
                { error: '단어장을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // 권한 확인 (자신의 학원 또는 공유 단어장)
        if (
            wordbook.academy_id !== session.user.academy_id &&
            !wordbook.is_shared
        ) {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            );
        }

        return NextResponse.json({ wordbook });
    } catch (error: any) {
        console.error('Get wordbook error:', error);
        return NextResponse.json(
            { error: error.message || '단어장 정보를 불러오는데 실패했습니다.' },
            { status: 500 }
        );
    }
}

// PATCH /api/wordbooks/[id] - 단어장 수정
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['academy_admin']);
        const { id } = params;
        const body = await request.json();
        const { name, textbook_name } = body;

        // 권한 확인
        const { data: existingWordbook } = await supabaseAdmin
            .from('wordbooks')
            .select('academy_id')
            .eq('id', id)
            .single();

        if (existingWordbook?.academy_id !== session.user.academy_id) {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            );
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (textbook_name !== undefined) updateData.textbook_name = textbook_name;

        const { data: wordbook, error } = await supabaseAdmin
            .from('wordbooks')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ wordbook });
    } catch (error: any) {
        console.error('Update wordbook error:', error);
        return NextResponse.json(
            { error: error.message || '단어장 수정에 실패했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE /api/wordbooks/[id] - 단어장 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['academy_admin']);
        const { id } = params;

        // 권한 확인
        const { data: existingWordbook } = await supabaseAdmin
            .from('wordbooks')
            .select('academy_id')
            .eq('id', id)
            .single();

        if (existingWordbook?.academy_id !== session.user.academy_id) {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            );
        }

        const { error } = await supabaseAdmin.from('wordbooks').delete().eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete wordbook error:', error);
        return NextResponse.json(
            { error: error.message || '단어장 삭제에 실패했습니다.' },
            { status: 500 }
        );
    }
}
