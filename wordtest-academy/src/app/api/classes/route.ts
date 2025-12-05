import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/classes - 반 목록 조회
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth(['academy_admin']);

        const { data: classes, error } = await supabaseAdmin
            .from('classes')
            .select(`
        *,
        teacher:users!classes_teacher_id_fkey(id, full_name),
        student_classes(count)
      `)
            .eq('academy_id', session.user.academy_id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 학생 수 계산
        const classesWithCount = classes.map((cls: any) => ({
            ...cls,
            student_count: cls.student_classes?.[0]?.count || 0,
        }));

        return NextResponse.json({ classes: classesWithCount });
    } catch (error: any) {
        console.error('Get classes error:', error);
        return NextResponse.json(
            { error: error.message || '반 목록을 불러오는데 실패했습니다.' },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

// POST /api/classes - 반 생성
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(['academy_admin']);
        const body = await request.json();
        const { name, teacher_id } = body;

        if (!name) {
            return NextResponse.json(
                { error: '반 이름은 필수입니다.' },
                { status: 400 }
            );
        }

        const { data: classData, error } = await supabaseAdmin
            .from('classes')
            .insert({
                name,
                teacher_id: teacher_id || null,
                academy_id: session.user.academy_id,
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ class: classData }, { status: 201 });
    } catch (error: any) {
        console.error('Create class error:', error);
        return NextResponse.json(
            { error: error.message || '반 생성에 실패했습니다.' },
            { status: 500 }
        );
    }
}
