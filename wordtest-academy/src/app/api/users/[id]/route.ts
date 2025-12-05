import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hashPassword } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/users/[id] - 사용자 상세 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['super_admin']);
        const { id } = params;

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*, academies(name)')
            .eq('id', id)
            .single();

        if (error) throw error;

        if (!user) {
            return NextResponse.json(
                { error: '사용자를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        const { password_hash, ...userWithoutPassword } = user;

        return NextResponse.json({ user: userWithoutPassword });
    } catch (error: any) {
        console.error('Get user error:', error);
        return NextResponse.json(
            { error: error.message || '사용자 정보를 불러오는데 실패했습니다.' },
            { status: 500 }
        );
    }
}

// PATCH /api/users/[id] - 사용자 수정
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['super_admin']);
        const { id } = params;
        const body = await request.json();
        const { full_name, password, status, academy_id } = body;

        const updateData: any = {};
        if (full_name !== undefined) updateData.full_name = full_name;
        if (status !== undefined) updateData.status = status;
        if (academy_id !== undefined) updateData.academy_id = academy_id;

        // 비밀번호 변경
        if (password) {
            updateData.password_hash = await hashPassword(password);
        }

        const { data: user, error } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        const { password_hash, ...userWithoutPassword } = user;

        return NextResponse.json({ user: userWithoutPassword });
    } catch (error: any) {
        console.error('Update user error:', error);
        return NextResponse.json(
            { error: error.message || '사용자 수정에 실패했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE /api/users/[id] - 사용자 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['super_admin']);
        const { id } = params;

        // 자기 자신은 삭제 불가
        if (session.user.id === id) {
            return NextResponse.json(
                { error: '자기 자신은 삭제할 수 없습니다.' },
                { status: 400 }
            );
        }

        const { error } = await supabaseAdmin
            .from('users')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete user error:', error);
        return NextResponse.json(
            { error: error.message || '사용자 삭제에 실패했습니다.' },
            { status: 500 }
        );
    }
}
