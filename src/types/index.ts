export type Direction = 'BUY' | 'SELL';
export type EntryType = 'ZONE' | 'SINGLE';
export type EntryMethod = 'BEST' | 'MIDDLE' | 'WORST';
export type Currency = 'USD' | 'EUR';
export type SignalSource = 'SCREENSHOT' | 'TEXT' | 'MANUAL';

export type TakeProfit = {
  label: string;
  price: number;
};

export type TradeSignal = {
  symbol: 'XAUUSD';
  direction: Direction;
  entryType: EntryType;
  bestEntry?: number;
  worstEntry?: number;
  singleEntry?: number;
  stopLoss: number;
  takeProfits: TakeProfit[];
  source: SignalSource;
  originalText?: string;
  screenshotUrl?: string;
  screenshotFile?: File;
};

export type Strategy = {
  id: string;
  user_id: string;
  strategy_name: string;
  account_balance: number;
  currency: Currency;
  risk_percent: number;
  entry_method: EntryMethod;
  default_tp: string;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  account_status: string;
  active_strategy_id: string | null;
};

export type GuestSettings = {
  accountBalance: number;
  currency: Currency;
  riskPercent: number;
  entryMethod: EntryMethod;
  defaultTp: string;
};

export type TradeSettings = {
  accountBalance: number;
  currency: Currency;
  riskPercent: number;
  entryMethod: EntryMethod;
  defaultTp: string;
  strategyId?: string;
  strategyName?: string;
};

export type TradeOverrides = {
  selectedEntry: EntryMethod;
  selectedTpLabel: string;
};

export type TradeCalculation = {
  entry: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  targetRisk: number;
  actualRisk: number;
  actualRiskPercent: number;
  potentialLoss: number;
  potentialProfit: number;
  crv: number;
  riskExceeded: boolean;
};

export type TpCalculation = {
  label: string;
  price: number;
  profit: number;
  crv: number;
};

export type CalculatedTrade = TradeCalculation & {
  allTakeProfits: TpCalculation[];
  selectedTpLabel: string;
  selectedEntry: EntryMethod;
};

export type FutureTradePayload = {
  tradeId: string;
  symbol: 'XAUUSD';
  direction: Direction;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  volume: number;
  strategyId?: string;
};

export type StrategyFormData = {
  strategy_name: string;
  account_balance: number;
  currency: Currency;
  risk_percent: number;
  entry_method: EntryMethod;
  default_tp: string;
};
