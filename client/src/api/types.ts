export interface Category {
  _id: string;
  name: string;
}

export interface Plan {
  _id: string;
  categoryId: string | Category;
  month: string;
  targetAmount: number;
}

export interface Actual {
  _id: string;
  categoryId: string | Category;
  month: string;
  amount: number;
  note?: string;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

export interface ReportRow {
  categoryId: string;
  category: string;
  month: string;
  plan: number;
  actual: number | '-';
  variance: number | '-';
  variancePercent: number | '-';
}

export interface ReportResponse {
  rows: ReportRow[];
  chart: {
    type: string;
    labels: string[];
    data: number[];
  };
  pagination: {
    page: number;
    pageSize: number;
    totalRows: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
}

export function categoryName(c: string | Category): string {
  return typeof c === 'string' ? c : c.name;
}

export function categoryIdOf(c: string | Category): string {
  return typeof c === 'string' ? c : c._id;
}
