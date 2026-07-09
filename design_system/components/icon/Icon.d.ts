import * as React from 'react';

/** Lucide icon name (unpkg.com/lucide-static), e.g. "dice-5", "plus", "trophy". */
export interface IconProps {
  name: string;
  /** Pixel size (square). Default 20. */
  size?: number;
  /** CSS color; defaults to currentColor so it inherits text color. */
  color?: string;
  style?: React.CSSProperties;
}

export function Icon(props: IconProps): JSX.Element;
