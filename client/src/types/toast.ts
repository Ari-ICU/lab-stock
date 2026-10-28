export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastData {
  id: number;
  message: string;
  title?: string;
  type: ToastType;
}

