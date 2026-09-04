export interface CsvRow {
  month: string;
  category: string;
  amount: string;
}

export interface ReportRow {
  categoryId: string;
  category: string;
  month: string;
  plan: number;
  actual: number | string;
  variance: number | string;
  variancePercent: number | string;
}