import * as React from 'react';

/**
 * @startingPoint section="Components" subtitle="Primary/secondary/ghost/outline button, all sizes" viewport="700x260"
 */
export interface ButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  /** Lucide icon name, e.g. "plus" */
  icon?: string;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  fullWidth?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Button(props: ButtonProps): JSX.Element;
