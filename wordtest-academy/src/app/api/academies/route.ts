import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/academies - 학원 목록 조회
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth(['super_admin']);

        const { data: academies, error } = await supabaseAdmin
            .from('academies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ academies });
    } catch (error: any) {
        console.error('Get academies error:', error);
        return NextResponse.json(
            { error: error.message || '학원 목록을 불러오는데 실패했습니다.' },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

// POST /api/academies - 학원 생성
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(['super_admin']);
        const body = await request.json();
        const { name, logo_url, footer_content } = body;

        if (!name) {
            return NextResponse.json(
                { error: '학원 이름은 필수입니다.' },
                { status: 400 }
            );
        }

        const { data: academy, error } = await supabaseAdmin
            .from('academies')
            .insert({
                name,
                logo_url,
                footer_content,
                status: 'active',
            })
            .select()
            .single();

        if (error) throw error;

        // 학원 설정 기본값 생성
        await supabaseAdmin
            .from('academy_settings')
            .insert({
                academy_id: academy.id,
                daily_completion_dollars: 10,
                game_dollars: 5,
                dictation_blank_percentage: 30,
            });

        return NextResponse.json({ academy }, { status: 201 });
    } catch (error: any) {
        console.error('Create academy error:', error);
        return NextResponse.json(
            { error: error.message || '학원 생성에 실패했습니다.' },
            { status: 500 }
        );
    }
}
