import { useMemo } from 'react';
import { calculateTrade } from '../calculations/calculateTrade';
import { useTrade } from '../contexts/TradeContext';

export function useCalculatedTrade() {
  const { signal, currentSettings, tradeOverrides } = useTrade();

  return useMemo(() => {
    if (!signal || !currentSettings || !tradeOverrides) return null;

    try {
      return calculateTrade({
        signal,
        settings: currentSettings,
        selectedEntry: tradeOverrides.selectedEntry,
        selectedTpLabel: tradeOverrides.selectedTpLabel,
      });
    } catch {
      return null;
    }
  }, [signal, currentSettings, tradeOverrides]);
}
