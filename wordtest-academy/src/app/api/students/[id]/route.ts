import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hashPassword } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/students/[id] - 학생 상세 조회
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['academy_admin']);
        const { id } = params;

        const { data: student, error } = await supabaseAdmin
            .from('users')
            .select(`
        *,
        student_classes(
          class_id,
          classes(id, name)
        )
      `)
            .eq('id', id)
            .eq('role', 'student')
            .eq('academy_id', session.user.academy_id)
            .single();

        if (error) throw error;

        if (!student) {
            return NextResponse.json(
                { error: '학생을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        const { password_hash, ...studentWithoutPassword } = student;

        return NextResponse.json({ student: studentWithoutPassword });
    } catch (error: any) {
        console.error('Get student error:', error);
        return NextResponse.json(
            { error: error.message || '학생 정보를 불러오는데 실패했습니다.' },
            { status: 500 }
        );
    }
}

// PATCH /api/students/[id] - 학생 수정
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['academy_admin']);
        const { id } = params;
        const body = await request.json();
        const { full_name, password, status, class_ids } = body;

        // 학생이 해당 학원 소속인지 확인
        const { data: existingStudent } = await supabaseAdmin
            .from('users')
            .select('academy_id')
            .eq('id', id)
            .single();

        if (existingStudent?.academy_id !== session.user.academy_id) {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            );
        }

        const updateData: any = {};
        if (full_name !== undefined) updateData.full_name = full_name;
        if (status !== undefined) updateData.status = status;
        if (password) {
            updateData.password_hash = await hashPassword(password);
        }

        const { data: student, error } = await supabaseAdmin
            .from('users')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 반 배정 업데이트
        if (class_ids !== undefined) {
            // 기존 배정 삭제
            await supabaseAdmin.from('student_classes').delete().eq('student_id', id);

            // 새 배정 추가
            if (class_ids.length > 0) {
                const classAssignments = class_ids.map((class_id: string) => ({
                    student_id: id,
                    class_id,
                }));
                await supabaseAdmin.from('student_classes').insert(classAssignments);
            }
        }

        const { password_hash, ...studentWithoutPassword } = student;

        return NextResponse.json({ student: studentWithoutPassword });
    } catch (error: any) {
        console.error('Update student error:', error);
        return NextResponse.json(
            { error: error.message || '학생 수정에 실패했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE /api/students/[id] - 학생 삭제
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['academy_admin']);
        const { id } = params;

        // 학생이 해당 학원 소속인지 확인
        const { data: existingStudent } = await supabaseAdmin
            .from('users')
            .select('academy_id')
            .eq('id', id)
            .single();

        if (existingStudent?.academy_id !== session.user.academy_id) {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            );
        }

        const { error } = await supabaseAdmin.from('users').delete().eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete student error:', error);
        return NextResponse.json(
            { error: error.message || '학생 삭제에 실패했습니다.' },
            { status: 500 }
        );
    }
}
