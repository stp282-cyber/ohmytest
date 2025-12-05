import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// GET /api/wordbooks/template - Excel 템플릿 다운로드
export async function GET() {
    try {
        // 템플릿 데이터
        const templateData = [
            {
                'No.': 1,
                '교재명': '중학 영단어',
                '대단원': 'Unit 1',
                '소단원': 'Lesson 1',
                '단원명': 'Greetings',
                '번호': 1,
                '영어': 'hello',
                '한글': '안녕',
            },
            {
                'No.': 2,
                '교재명': '중학 영단어',
                '대단원': 'Unit 1',
                '소단원': 'Lesson 1',
                '단원명': 'Greetings',
                '번호': 2,
                '영어': 'goodbye',
                '한글': '안녕히 가세요',
            },
        ];

        // Workbook 생성
        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

        // Buffer로 변환
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // Response 생성
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="wordbook_template.xlsx"',
            },
        });
    } catch (error: any) {
        console.error('Template download error:', error);
        return NextResponse.json(
            { error: error.message || '템플릿 다운로드에 실패했습니다.' },
            { status: 500 }
        );
    }
}
