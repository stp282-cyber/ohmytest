import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/academies/[id] - 학원 상세 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['super_admin']);
        const { id } = params;

        const { data: academy, error } = await supabaseAdmin
            .from('academies')
            .select('*, academy_settings(*)')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!academy) {
            return NextResponse.json(
                { error: '학원을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        return NextResponse.json({ academy });
    } catch (error: any) {
        console.error('Get academy error:', error);
        return NextResponse.json(
            { error: error.message || '학원 정보를 불러오는데 실패했습니다.' },
            { status: 500 }
        );
    }
}

// PATCH /api/academies/[id] - 학원 수정
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['super_admin']);
        const { id } = params;
        const body = await request.json();
        const { name, logo_url, footer_content, status } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (logo_url !== undefined) updateData.logo_url = logo_url;
        if (footer_content !== undefined) updateData.footer_content = footer_content;
        if (status !== undefined) updateData.status = status;

        const { data: academy, error } = await supabaseAdmin
            .from('academies')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ academy });
    } catch (error: any) {
        console.error('Update academy error:', error);
        return NextResponse.json(
            { error: error.message || '학원 수정에 실패했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE /api/academies/[id] - 학원 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['super_admin']);
        const { id } = params;

        // 학원 삭제 (CASCADE로 관련 데이터 자동 삭제)
        const { error } = await supabaseAdmin
            .from('academies')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete academy error:', error);
        return NextResponse.json(
            { error: error.message || '학원 삭제에 실패했습니다.' },
            { status: 500 }
        );
    }
}
