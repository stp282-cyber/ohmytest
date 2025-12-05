import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hashPassword } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/students - 학생 목록 조회
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth(['academy_admin']);
        const { searchParams } = new URL(request.url);
        const classId = searchParams.get('class_id');

        let query = supabaseAdmin
            .from('users')
            .select(`
        *,
        student_classes(
          class_id,
          classes(id, name)
        )
      `)
            .eq('role', 'student')
            .eq('academy_id', session.user.academy_id)
            .order('created_at', { ascending: false });

        const { data: students, error } = await query;

        if (error) throw error;

        // 특정 반의 학생만 필터링
        let filteredStudents = students;
        if (classId) {
            filteredStudents = students.filter((student: any) =>
                student.student_classes.some((sc: any) => sc.class_id === classId)
            );
        }

        return NextResponse.json({ students: filteredStudents });
    } catch (error: any) {
        console.error('Get students error:', error);
        return NextResponse.json(
            { error: error.message || '학생 목록을 불러오는데 실패했습니다.' },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

// POST /api/students - 학생 생성
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(['academy_admin']);
        const body = await request.json();
        const { username, password, full_name, class_ids } = body;

        if (!username || !password || !full_name) {
            return NextResponse.json(
                { error: '필수 항목을 모두 입력해주세요.' },
                { status: 400 }
            );
        }

        // 비밀번호 해싱
        const password_hash = await hashPassword(password);

        // 학생 생성
        const { data: student, error } = await supabaseAdmin
            .from('users')
            .insert({
                username,
                password_hash,
                full_name,
                role: 'student',
                academy_id: session.user.academy_id,
                status: 'active',
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return NextResponse.json(
                    { error: '이미 존재하는 사용자명입니다.' },
                    { status: 400 }
                );
            }
            throw error;
        }

        // 반 배정
        if (class_ids && class_ids.length > 0) {
            const classAssignments = class_ids.map((class_id: string) => ({
                student_id: student.id,
                class_id,
            }));

            await supabaseAdmin.from('student_classes').insert(classAssignments);
        }

        const { password_hash: _, ...studentWithoutPassword } = student;

        return NextResponse.json({ student: studentWithoutPassword }, { status: 201 });
    } catch (error: any) {
        console.error('Create student error:', error);
        return NextResponse.json(
            { error: error.message || '학생 생성에 실패했습니다.' },
            { status: 500 }
        );
    }
}
