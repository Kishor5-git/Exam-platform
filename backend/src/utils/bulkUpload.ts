import * as xlsx from 'xlsx';
import { z } from 'zod';

const QuestionSchema = z.object({
    type: z.enum(['MCQ', 'SHORT_ANSWER', 'CODING']),
    question_text: z.string().min(5),
    marks: z.number().min(1),
    options: z.string().optional().nullable(),
    correct_answer: z.string().min(1).optional().nullable(),
    explanation: z.string().optional().nullable(),
    coding_language: z.string().optional().nullable(),
    test_cases: z.string().optional().nullable(),
});

export type BulkQuestion = z.infer<typeof QuestionSchema>;

export function parseExcel(buffer: Buffer): BulkQuestion[] {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);

    return data.map((row: any) => {
        // Basic normalization
        return {
            type: row.type || row.Type,
            question_text: row.question_text || row.Question || row['Question Text'],
            marks: Number(row.marks || row.Marks || 1),
            options: row.options || row.Options,
            correct_answer: row.correct_answer || row.Answer || row['Correct Answer'],
            explanation: row.explanation || row.Explanation,
            coding_language: row.coding_language || row.Language,
            test_cases: row.test_cases || row['Test Cases'],
        };
    }) as any;
}

export function validateQuestions(questions: any[]): { valid: BulkQuestion[], errors: string[] } {
    const valid: BulkQuestion[] = [];
    const errors: string[] = [];

    questions.forEach((q, index) => {
        try {
            const parsed = QuestionSchema.parse(q);
            valid.push(parsed);
        } catch (err: any) {
            errors.push(`Row ${index + 1}: ${err.message}`);
        }
    });

    return { valid, errors };
}
