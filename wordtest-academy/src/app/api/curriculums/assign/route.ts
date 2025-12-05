import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/curriculums/assign - 학생에게 커리큘럼 배정
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(['academy_admin']);
        const body = await request.json();
        const { curriculum_id, student_ids, start_date } = body;

        if (!curriculum_id || !student_ids || !Array.isArray(student_ids)) {
            return NextResponse.json(
                { error: '필수 항목을 모두 입력해주세요.' },
                { status: 400 }
            );
        }

        // 커리큘럼 조회
        const { data: curriculum } = await supabaseAdmin
            .from('curriculums')
            .select('*')
            .eq('id', curriculum_id)
            .eq('academy_id', session.user.academy_id)
            .single();

        if (!curriculum) {
            return NextResponse.json(
                { error: '커리큘럼을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        const results = [];

        for (const student_id of student_ids) {
            // student_curriculum 생성
            const { data: studentCurriculum, error: scError } = await supabaseAdmin
                .from('student_curriculums')
                .insert({
                    student_id,
                    curriculum_id,
                    start_date: start_date || new Date().toISOString().split('T')[0],
                    status: 'active',
                })
                .select()
                .single();

            if (scError) {
                console.error('Error creating student curriculum:', scError);
                continue;
            }

            // daily_lessons 자동 생성
            const dailyLessons = [];
            const baseDate = new Date(start_date || new Date());
            let currentWordNo = curriculum.start_word_no;

            for (let day = 1; day <= curriculum.total_days; day++) {
                const lessonDate = new Date(baseDate);
                lessonDate.setDate(baseDate.getDate() + (day - 1));

                const endWordNo = Math.min(
                    currentWordNo + curriculum.words_per_day - 1,
                    curriculum.end_word_no
                );

                dailyLessons.push({
                    student_id,
                    student_curriculum_id: studentCurriculum.id,
                    day_number: day,
                    lesson_date: lessonDate.toISOString().split('T')[0],
                    start_word_no: currentWordNo,
                    end_word_no: endWordNo,
                    status: 'incomplete',
                });

                currentWordNo = endWordNo + 1;
            }

            // daily_lessons 일괄 생성
            await supabaseAdmin.from('daily_lessons').insert(dailyLessons);

            results.push({
                student_id,
                curriculum_id,
                lessons_created: dailyLessons.length,
            });
        }

        return NextResponse.json({
            success: true,
            assigned: results.length,
            results,
        });
    } catch (error: any) {
        console.error('Assign curriculum error:', error);
        return NextResponse.json(
            { error: error.message || '커리큘럼 배정에 실패했습니다.' },
            { status: 500 }
        );
    }
}
