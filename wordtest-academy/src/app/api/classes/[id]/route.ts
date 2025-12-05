import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/classes/[id] - 반 상세 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['academy_admin']);
        const { id } = params;

        const { data: classData, error } = await supabaseAdmin
            .from('classes')
            .select(`
        *,
        teacher:users!classes_teacher_id_fkey(id, full_name),
        student_classes(
          student:users(id, username, full_name, status)
        )
      `)
            .eq('id', id)
            .eq('academy_id', session.user.academy_id)
            .single();

        if (error) throw error;

        if (!classData) {
            return NextResponse.json(
                { error: '반을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        return NextResponse.json({ class: classData });
    } catch (error: any) {
        console.error('Get class error:', error);
        return NextResponse.json(
            { error: error.message || '반 정보를 불러오는데 실패했습니다.' },
            { status: 500 }
        );
    }
}

// PATCH /api/classes/[id] - 반 수정
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['academy_admin']);
        const { id } = params;
        const body = await request.json();
        const { name, teacher_id } = body;

        // 반이 해당 학원 소속인지 확인
        const { data: existingClass } = await supabaseAdmin
            .from('classes')
            .select('academy_id')
            .eq('id', id)
            .single();

        if (existingClass?.academy_id !== session.user.academy_id) {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            );
        }

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (teacher_id !== undefined) updateData.teacher_id = teacher_id;

        const { data: classData, error } = await supabaseAdmin
            .from('classes')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ class: classData });
    } catch (error: any) {
        console.error('Update class error:', error);
        return NextResponse.json(
            { error: error.message || '반 수정에 실패했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE /api/classes/[id] - 반 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['academy_admin']);
        const { id } = params;

        // 반이 해당 학원 소속인지 확인
        const { data: existingClass } = await supabaseAdmin
            .from('classes')
            .select('academy_id')
            .eq('id', id)
            .single();

        if (existingClass?.academy_id !== session.user.academy_id) {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            );
        }

        const { error } = await supabaseAdmin.from('classes').delete().eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete class error:', error);
        return NextResponse.json(
            { error: error.message || '반 삭제에 실패했습니다.' },
            { status: 500 }
        );
    }
}
