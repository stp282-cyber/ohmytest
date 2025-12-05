import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import * as XLSX from 'xlsx';

// POST /api/wordbooks/import - Excel 파일 업로드
export async function POST(request: NextRequest) {
    try {
        const session = await requireAuth(['academy_admin']);
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const wordbookId = formData.get('wordbook_id') as string;

        if (!file) {
            return NextResponse.json(
                { error: '파일을 선택해주세요.' },
                { status: 400 }
            );
        }

        if (!wordbookId) {
            return NextResponse.json(
                { error: '단어장을 선택해주세요.' },
                { status: 400 }
            );
        }

        // 단어장 권한 확인
        const { data: wordbook } = await supabaseAdmin
            .from('wordbooks')
            .select('academy_id')
            .eq('id', wordbookId)
            .single();

        if (wordbook?.academy_id !== session.user.academy_id) {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            );
        }

        // Excel 파일 읽기
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        // 데이터 검증 및 변환
        const words = data.map((row: any, index: number) => {
            if (!row['영어'] || !row['한글']) {
                throw new Error(`${index + 2}번째 행: 영어와 한글은 필수입니다.`);
            }

            return {
                wordbook_id: wordbookId,
                no: row['No.'] || index + 1,
                textbook_name: row['교재명'] || '',
                major_unit: row['대단원'] || '',
                minor_unit: row['소단원'] || '',
                unit_name: row['단원명'] || '',
                number: row['번호'] || index + 1,
                english: row['영어'],
                korean: row['한글'],
            };
        });

        // 기존 단어 삭제 (선택사항)
        const clearExisting = formData.get('clear_existing') === 'true';
        if (clearExisting) {
            await supabaseAdmin.from('words').delete().eq('wordbook_id', wordbookId);
        }

        // 단어 일괄 추가
        const { error } = await supabaseAdmin.from('words').insert(words);

        if (error) throw error;

        // 단어장 word_count 업데이트
        const { count } = await supabaseAdmin
            .from('words')
            .select('*', { count: 'exact', head: true })
            .eq('wordbook_id', wordbookId);

        await supabaseAdmin
            .from('wordbooks')
            .update({ word_count: count || 0 })
            .eq('id', wordbookId);

        return NextResponse.json({
            success: true,
            imported: words.length,
        });
    } catch (error: any) {
        console.error('Import words error:', error);
        return NextResponse.json(
            { error: error.message || 'Excel 업로드에 실패했습니다.' },
            { status: 500 }
        );
    }
}
