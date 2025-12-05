import { cookies } from 'next/headers';
import { supabaseAdmin } from './supabase';
import bcrypt from 'bcryptjs';

export interface User {
    id: string;
    username: string;
    full_name: string;
    role: 'super_admin' | 'academy_admin' | 'student';
    academy_id: string | null;
    status: string;
}

export interface Session {
    user: User;
    token: string;
}

/**
 * 비밀번호 해시 생성
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * 사용자 인증
 */
export async function authenticateUser(username: string, password: string, academyId?: string): Promise<User | null> {
    try {
        console.log('🔍 [AUTH] Authenticating user:', { username, academyId });

        let query = supabaseAdmin
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('status', 'active')
            .single();

        // Super Admin이 아닌 경우 academy_id도 확인
        if (academyId) {
            query = query.eq('academy_id', academyId);
        }

        const { data: user, error } = await query;

        console.log('🔍 [AUTH] Query result:', { user: user ? 'found' : 'not found', error: error?.message });

        if (error || !user) {
            console.log('❌ [AUTH] User not found or error');
            return null;
        }

        // 비밀번호 검증
        console.log('🔍 [AUTH] Verifying password...');
        const isValid = await verifyPassword(password, user.password_hash);
        console.log('🔍 [AUTH] Password valid:', isValid);

        if (!isValid) {
            console.log('❌ [AUTH] Invalid password');
            return null;
        }

        console.log('✅ [AUTH] Authentication successful');
        // password_hash 제거
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword as User;
    } catch (error) {
        console.error('❌ [AUTH] Authentication error:', error);
        return null;
    }
}

/**
 * 세션 생성
 */
export async function createSession(user: User): Promise<string> {
    const token = Buffer.from(JSON.stringify({
        userId: user.id,
        role: user.role,
        academyId: user.academy_id,
        timestamp: Date.now(),
    })).toString('base64');

    const cookieStore = await cookies();
    cookieStore.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
    });

    return token;
}

/**
 * 세션 가져오기
 */
export async function getSession(): Promise<Session | null> {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');

        if (!sessionCookie) {
            return null;
        }

        const sessionData = JSON.parse(Buffer.from(sessionCookie.value, 'base64').toString());

        // 세션 만료 확인 (7일)
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - sessionData.timestamp > sevenDays) {
            await destroySession();
            return null;
        }

        // 사용자 정보 가져오기
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', sessionData.userId)
            .eq('status', 'active')
            .single();

        if (error || !user) {
            await destroySession();
            return null;
        }

        const { password_hash, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword as User,
            token: sessionCookie.value,
        };
    } catch (error) {
        console.error('Get session error:', error);
        return null;
    }
}

/**
 * 세션 삭제
 */
export async function destroySession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('session');
}

/**
 * 권한 확인
 */
export async function requireAuth(allowedRoles?: string[]): Promise<Session> {
    const session = await getSession();

    if (!session) {
        throw new Error('Unauthorized');
    }

    if (allowedRoles && !allowedRoles.includes(session.user.role)) {
        throw new Error('Forbidden');
    }

    return session;
}

/**
 * 학원 접근 권한 확인
 */
export async function requireAcademyAccess(academyId: string): Promise<Session> {
    const session = await requireAuth();

    // Super Admin은 모든 학원에 접근 가능
    if (session.user.role === 'super_admin') {
        return session;
    }

    // 다른 역할은 자신의 학원만 접근 가능
    if (session.user.academy_id !== academyId) {
        throw new Error('Forbidden');
    }

    return session;
}
