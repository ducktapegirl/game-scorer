import * as React from 'react';

export interface BadgeProps {
  children?: React.ReactNode;
  tone?: 'neutral' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export function Badge(props: BadgeProps): JSX.Element;
