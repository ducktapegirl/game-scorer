import * as React from 'react';

export interface TabItem {
  value: string;
  label: string;
}

/**
 * @startingPoint section="Components" subtitle="Segmented pill tab bar" viewport="700x100"
 */
export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onChange?: (value: string) => void;
}

export function Tabs(props: TabsProps): JSX.Element;
