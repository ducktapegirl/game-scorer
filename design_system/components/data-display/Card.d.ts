import * as React from 'react';

/**
 * @startingPoint section="Components" subtitle="Flat surface with soft shadow, optional hover lift" viewport="700x160"
 */
export interface CardProps {
  children?: React.ReactNode;
  padding?: string;
  /** If true, lifts + deepens shadow on hover and shows a pointer cursor. */
  interactive?: boolean;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Card(props: CardProps): JSX.Element;
