export interface BaseResponse<T> {
  data: T | null;
  succeeded: boolean;
  message: string;
  statusCode: number;
  errors: Record<string, string[]> | null;
}
