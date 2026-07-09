import * as React from 'react';

export interface IconButtonProps {
  /** Lucide icon name, e.g. "trash-2" */
  name: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'filled';
  disabled?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function IconButton(props: IconButtonProps): JSX.Element;
