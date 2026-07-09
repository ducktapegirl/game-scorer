import * as React from 'react';

export interface RadioProps {
  label?: string;
  checked?: boolean;
  onChange?: () => void;
  disabled?: boolean;
  name?: string;
}

export function Radio(props: RadioProps): JSX.Element;
