export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
  errors: string[] | null;
  type: string;
}
