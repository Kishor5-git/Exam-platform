import * as XLSX from "xlsx";

export interface ExcelQuestion {
  Question: string;
  Type: "MCQ" | "SHORT_ANSWER" | "CODING";
  Options?: string;
  Correct?: string;
  Marks: number;
  Language?: string;
}

export const parseQuestionsExcel = (buffer: Buffer): ExcelQuestion[] => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
};
