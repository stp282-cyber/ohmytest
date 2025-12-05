import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hashPassword } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/users - 사용자 목록 조회
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth(['super_admin']);
        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const academyId = searchParams.get('academy_id');

        let query = supabaseAdmin
            .from('users')
            .select('*, academies(name)')
            .order('created_at', { ascending: false });

        if (role) {
            query = query.eq('role', role);
        }

        if (academyId) {
            query = query.eq('academy_id', academyId);
        }

        const { data: users, error } = await query;

        if (error) throw error;

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error('Get users error:', error);
        return NextResponse.json(
            { error: error.message || '사용자 목록을 불러오는데 실패했습니다.' },
            { status: error.message === 'Unauthorized' ? 401 : 500 }
        );
    }
}

// POST /api/users - 사용자 생성
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(['super_admin']);
        const body = await request.json();
        const { username, password, full_name, role, academy_id } = body;

        if (!username || !password || !full_name || !role) {
            return NextResponse.json(
                { error: '필수 항목을 모두 입력해주세요.' },
                { status: 400 }
            );
        }

        // Academy Admin이나 Student는 academy_id 필수
        if ((role === 'academy_admin' || role === 'student') && !academy_id) {
            return NextResponse.json(
                { error: '학원을 선택해주세요.' },
                { status: 400 }
            );
        }

        // 비밀번호 해싱
        const password_hash = await hashPassword(password);

        // 사용자 생성
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .insert({
                username,
                password_hash,
                full_name,
                role,
                academy_id: role === 'super_admin' ? null : academy_id,
                status: 'active',
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                // Unique constraint violation
                return NextResponse.json(
                    { error: '이미 존재하는 사용자명입니다.' },
                    { status: 400 }
                );
            }
            throw error;
        }

        // password_hash 제거
        const { password_hash: _, ...userWithoutPassword } = user;

        return NextResponse.json({ user: userWithoutPassword }, { status: 201 });
    } catch (error: any) {
        console.error('Create user error:', error);
        return NextResponse.json(
            { error: error.message || '사용자 생성에 실패했습니다.' },
            { status: 500 }
        );
    }
}
