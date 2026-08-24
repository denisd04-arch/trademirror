import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  GuestSettings,
  Strategy,
  TradeOverrides,
  TradeSettings,
  TradeSignal,
} from '../types';
import { getInitialTradeOverrides } from '../calculations/calculateTrade';
import { useAuth } from './AuthContext';
import { strategyService } from '../services/strategyService';

const DEFAULT_GUEST: GuestSettings = {
  accountBalance: 1000,
  currency: 'USD',
  riskPercent: 1,
  entryMethod: 'MIDDLE',
  defaultTp: 'TP1',
};

type TradeContextValue = {
  signal: TradeSignal | null;
  guestSettings: GuestSettings;
  strategies: Strategy[];
  activeStrategy: Strategy | null;
  activeStrategyId: string | null;
  tradeOverrides: TradeOverrides | null;
  currentSettings: TradeSettings | null;
  loadingStrategies: boolean;
  setSignal: (signal: TradeSignal | null) => void;
  setGuestSettings: (settings: Partial<GuestSettings>) => void;
  setTradeOverrides: (overrides: Partial<TradeOverrides>) => void;
  selectStrategy: (strategyId: string) => Promise<void>;
  refreshStrategies: () => Promise<void>;
  resetTrade: () => void;
  applySignalWithDefaults: (signal: TradeSignal) => void;
};

const TradeContext = createContext<TradeContextValue | undefined>(undefined);

function strategyToSettings(strategy: Strategy): TradeSettings {
  return {
    accountBalance: strategy.account_balance,
    currency: strategy.currency,
    riskPercent: strategy.risk_percent,
    entryMethod: strategy.entry_method,
    defaultTp: strategy.default_tp ?? 'TP1',
    strategyId: strategy.id,
    strategyName: strategy.strategy_name,
  };
}

export function TradeProvider({ children }: { children: ReactNode }) {
  const { user, profile, refreshProfile } = useAuth();
  const [signal, setSignal] = useState<TradeSignal | null>(null);
  const [guestSettings, setGuestSettingsState] = useState<GuestSettings>(DEFAULT_GUEST);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [activeStrategyId, setActiveStrategyId] = useState<string | null>(null);
  const [tradeOverrides, setTradeOverridesState] = useState<TradeOverrides | null>(null);
  const [loadingStrategies, setLoadingStrategies] = useState(false);

  const refreshStrategies = useCallback(async () => {
    if (!user) {
      setStrategies([]);
      setActiveStrategyId(null);
      return;
    }

    setLoadingStrategies(true);
    try {
      const list = await strategyService.list(user.id);
      setStrategies(list);
      const activeId =
        list.find((strategy) => strategy.is_active)?.id ??
        profile?.active_strategy_id ??
        list[0]?.id ??
        null;
      setActiveStrategyId(activeId);
    } finally {
      setLoadingStrategies(false);
    }
  }, [user, profile?.active_strategy_id]);

  useEffect(() => {
    refreshStrategies();
  }, [refreshStrategies]);

  const activeStrategy = useMemo(
    () => strategies.find((s) => s.id === activeStrategyId) ?? null,
    [strategies, activeStrategyId],
  );

  const currentSettings = useMemo<TradeSettings | null>(() => {
    if (user && activeStrategy) return strategyToSettings(activeStrategy);
    if (!user) {
      return {
        accountBalance: guestSettings.accountBalance,
        currency: guestSettings.currency,
        riskPercent: guestSettings.riskPercent,
        entryMethod: guestSettings.entryMethod,
        defaultTp: guestSettings.defaultTp,
      };
    }
    return null;
  }, [user, activeStrategy, guestSettings]);

  const setGuestSettings = useCallback((partial: Partial<GuestSettings>) => {
    setGuestSettingsState((prev) => ({ ...prev, ...partial }));
  }, []);

  const setTradeOverrides = useCallback((partial: Partial<TradeOverrides>) => {
    setTradeOverridesState((prev) => ({
      selectedEntry: partial.selectedEntry ?? prev?.selectedEntry ?? 'MIDDLE',
      selectedTpLabel: partial.selectedTpLabel ?? prev?.selectedTpLabel ?? 'TP1',
    }));
  }, []);

  const applySignalWithDefaults = useCallback(
    (nextSignal: TradeSignal) => {
      setSignal(nextSignal);
      if (currentSettings) {
        setTradeOverridesState(getInitialTradeOverrides(nextSignal, currentSettings));
      }
    },
    [currentSettings],
  );

  const selectStrategy = useCallback(
    async (strategyId: string) => {
      setActiveStrategyId(strategyId);
      if (user) {
        await strategyService.setActive(strategyId);
        await refreshProfile();
        setStrategies((prev) =>
          prev.map((strategy) => ({
            ...strategy,
            is_active: strategy.id === strategyId,
          })),
        );
      }
      const strategy = strategies.find((s) => s.id === strategyId);
      if (strategy && signal) {
        setTradeOverridesState(
          getInitialTradeOverrides(signal, strategyToSettings(strategy)),
        );
      }
    },
    [user, strategies, signal, refreshProfile],
  );

  const resetTrade = useCallback(() => {
    setSignal(null);
    setTradeOverridesState(null);
    if (currentSettings && activeStrategy) {
      // keep strategy defaults for next trade
    }
  }, [currentSettings, activeStrategy]);

  const value = useMemo(
    () => ({
      signal,
      guestSettings,
      strategies,
      activeStrategy,
      activeStrategyId,
      tradeOverrides,
      currentSettings,
      loadingStrategies,
      setSignal,
      setGuestSettings,
      setTradeOverrides,
      selectStrategy,
      refreshStrategies,
      resetTrade,
      applySignalWithDefaults,
    }),
    [
      signal,
      guestSettings,
      strategies,
      activeStrategy,
      activeStrategyId,
      tradeOverrides,
      currentSettings,
      loadingStrategies,
      setGuestSettings,
      setTradeOverrides,
      selectStrategy,
      refreshStrategies,
      resetTrade,
      applySignalWithDefaults,
    ],
  );

  return <TradeContext.Provider value={value}>{children}</TradeContext.Provider>;
}

export function useTrade() {
  const context = useContext(TradeContext);
  if (!context) throw new Error('useTrade must be used within TradeProvider');
  return context;
}
