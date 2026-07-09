import * as React from 'react';

/**
 * @startingPoint section="Components" subtitle="Text input with label, helper text, and error state" viewport="700x120"
 */
export interface InputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  type?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function Input(props: InputProps): JSX.Element;
