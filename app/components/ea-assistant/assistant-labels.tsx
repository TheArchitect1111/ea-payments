'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { ASSISTANT_LABELS, type AssistantLabels } from '@/lib/assistant/constants';

const AssistantLabelsContext = createContext<AssistantLabels>(ASSISTANT_LABELS);

export function AssistantLabelsProvider({
  labels,
  children,
}: {
  labels: AssistantLabels;
  children: ReactNode;
}) {
  return (
    <AssistantLabelsContext.Provider value={labels}>{children}</AssistantLabelsContext.Provider>
  );
}

export function useAssistantLabels(): AssistantLabels {
  return useContext(AssistantLabelsContext);
}
