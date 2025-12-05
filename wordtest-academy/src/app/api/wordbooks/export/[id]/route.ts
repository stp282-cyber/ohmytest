import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import * as XLSX from 'xlsx';

// GET /api/wordbooks/export/[id] - Excel 파일 다운로드
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await requireAuth(['academy_admin']);
        const { id } = params;

        // 단어장 권한 확인
        const { data: wordbook } = await supabaseAdmin
            .from('wordbooks')
            .select('name, academy_id, is_shared')
            .eq('id', id)
            .single();

        if (
            !wordbook ||
            (wordbook.academy_id !== session.user.academy_id && !wordbook.is_shared)
        ) {
            return NextResponse.json(
                { error: '권한이 없습니다.' },
                { status: 403 }
            );
        }

        // 모든 단어 조회
        const { data: words, error } = await supabaseAdmin
            .from('words')
            .select('*')
            .eq('wordbook_id', id)
            .order('no', { ascending: true });

        if (error) throw error;

        // Excel 데이터 생성
        const excelData = words.map((word) => ({
            'No.': word.no,
            '교재명': word.textbook_name,
            '대단원': word.major_unit,
            '소단원': word.minor_unit,
            '단원명': word.unit_name,
            '번호': word.number,
            '영어': word.english,
            '한글': word.korean,
        }));

        // Workbook 생성
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Words');

        // Buffer로 변환
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Response 생성
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(
                    wordbook.name
                )}.xlsx"`,
            },
        });
    } catch (error: any) {
        console.error('Export words error:', error);
        return NextResponse.json(
            { error: error.message || 'Excel 다운로드에 실패했습니다.' },
            { status: 500 }
        );
    }
}
