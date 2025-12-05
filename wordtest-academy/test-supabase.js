// Supabase 연결 테스트
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('=== 환경 변수 확인 ===');
console.log('SUPABASE_URL:', supabaseUrl ? '✅ 설정됨' : '❌ 없음');
console.log('SERVICE_ROLE_KEY:', supabaseKey ? '✅ 설정됨' : '❌ 없음');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ 환경 변수가 설정되지 않았습니다!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('\n=== Supabase 연결 테스트 ===');
        const { data, error } = await supabase
            .from('users')
            .select('username, role')
            .eq('username', 'admin')
            .single();

        if (error) {
            console.error('❌ 쿼리 오류:', error.message);
            return;
        }

        if (data) {
            console.log('✅ 사용자 찾음:', data);
        } else {
            console.log('❌ 사용자 없음');
        }
    } catch (err) {
        console.error('❌ 연결 오류:', err.message);
    }
}

testConnection();
