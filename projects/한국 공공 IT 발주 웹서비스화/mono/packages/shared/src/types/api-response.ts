export interface APIResponse<T = { [key: string]: any }> {
  code: number;
  message?: string;
  result: T;
}
