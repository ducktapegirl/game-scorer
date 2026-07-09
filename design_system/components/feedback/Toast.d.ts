import * as React from 'react';

export interface ToastProps {
  message: string;
  tone?: 'success' | 'error' | 'info';
  visible?: boolean;
}

export function Toast(props: ToastProps): JSX.Element;
