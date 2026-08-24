import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTrade } from '../contexts/TradeContext';
import { strategyService } from '../services/strategyService';
import type { Strategy, StrategyFormData } from '../types';
import { StrategyForm } from '../components/trade/StrategyForm';
import { ProtectedRoute, VerifiedRoute } from '../components/layout/ProtectedRoute';
import { cn, formatRiskPercent } from '../utils';

const emptyForm: StrategyFormData = {
  strategy_name: '',
  account_balance: 1000,
  currency: 'USD',
  risk_percent: 1,
  entry_method: 'MIDDLE',
  default_tp: 'TP1',
};

function StrategiesContent() {
  const { user, profile } = useAuth();
  const { strategies, refreshStrategies, selectStrategy, activeStrategyId } = useTrade();
  const [form, setForm] = useState<StrategyFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setSaved(false);
  };

  const openEdit = (strategy: Strategy) => {
    setEditingId(strategy.id);
    setForm({
      strategy_name: strategy.strategy_name,
      account_balance: strategy.account_balance,
      currency: strategy.currency,
      risk_percent: strategy.risk_percent,
      entry_method: strategy.entry_method,
      default_tp: strategy.default_tp,
    });
    setShowForm(true);
    setSaved(false);
  };

  const saveStrategy = async () => {
    if (!user) return;
    setError('');
    try {
      if (editingId) {
        await strategyService.update(editingId, form);
      } else {
        const created = await strategyService.create(user.id, form);
        if (strategies.length === 0) {
          await strategyService.setActive(user.id, created.id);
        }
      }
      await refreshStrategies();
      setShowForm(false);
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save strategy');
    }
  };

  const confirmDelete = async () => {
    if (!deleteId || !user) return;
    await strategyService.remove(deleteId);
    if (activeStrategyId === deleteId) {
      const remaining = strategies.filter((s) => s.id !== deleteId);
      if (remaining[0]) await strategyService.setActive(user.id, remaining[0].id);
    }
    setDeleteId(null);
    await refreshStrategies();
  };

  if (showForm) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowForm(false)}
          className="inline-flex items-center gap-1.5 text-sm text-tm-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="tm-card p-3.5">
          <StrategyForm
            form={form}
            onChange={setForm}
            title={editingId ? `Edit ${form.strategy_name}` : 'New Strategy'}
            onClose={() => setShowForm(false)}
          />
          {error && <p className="mt-3 text-sm text-tm-red">{error}</p>}
          <button type="button" onClick={saveStrategy} className="tm-btn-primary mt-4 justify-center">
            Save Strategy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold text-tm-text">My Strategies</h1>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1 rounded-[10px] bg-tm-gold px-3 py-1.5 text-xs font-semibold text-tm-bg"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Strategy
        </button>
      </div>

      <div className="tm-card p-3.5">
        <p className="tm-section-title">Account</p>
        <p className="mt-2 text-sm font-semibold text-tm-text">
          {profile?.first_name} {profile?.last_name}
        </p>
        <p className="text-xs text-tm-muted">{profile?.email ?? user?.email}</p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-tm-muted">Status</span>
          <span className="text-tm-green">Logged in</span>
        </div>
      </div>

      {saved && <p className="text-center text-xs text-tm-gold">Strategy saved successfully</p>}

      {strategies.length === 0 ? (
        <div className="tm-card p-6 text-center">
          <p className="text-sm text-tm-muted">Create your first trading account</p>
          <button type="button" onClick={openCreate} className="tm-btn-primary mt-4 justify-center">
            Create Strategy
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {strategies.map((strategy) => {
            const isActive = strategy.id === activeStrategyId;
            const symbol = strategy.currency === 'EUR' ? '€' : '$';
            return (
              <div
                key={strategy.id}
                className={cn(
                  'tm-card p-3.5',
                  isActive && 'border-tm-gold/50 bg-tm-gold/5',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-tm-text">{strategy.strategy_name}</h3>
                      {isActive && (
                        <span className="rounded-md bg-tm-gold/15 px-1.5 py-0.5 text-[10px] font-bold text-tm-gold">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-tm-muted">
                      {symbol}
                      {strategy.account_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      {' · Risk '}
                      {formatRiskPercent(strategy.risk_percent)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-tm-muted">Entry</p>
                    <p className="mt-0.5 font-medium text-tm-text">{strategy.entry_method}</p>
                  </div>
                  <div>
                    <p className="text-tm-muted">Default TP</p>
                    <p className="mt-0.5 font-medium text-tm-text">{strategy.default_tp}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(strategy)}
                    className="rounded-[10px] border border-tm-border px-3 py-1.5 text-xs text-tm-text"
                  >
                    Edit
                  </button>
                  {!isActive && (
                    <button
                      type="button"
                      onClick={() => selectStrategy(strategy.id)}
                      className="rounded-[10px] border border-tm-gold/40 px-3 py-1.5 text-xs text-tm-gold"
                    >
                      Set Active
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteId(strategy.id)}
                    className="rounded-[10px] border border-tm-red/30 px-3 py-1.5 text-xs text-tm-red"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Link to="/account" className="block text-center text-xs text-tm-muted hover:text-tm-text">
        Back to Account
      </Link>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="tm-card max-w-sm p-4">
            <h3 className="text-sm font-semibold text-tm-text">Delete this strategy?</h3>
            <p className="mt-1.5 text-xs text-tm-muted">This action cannot be undone.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={confirmDelete} className="flex-1 rounded-[10px] bg-tm-red py-2 text-sm font-semibold text-white">
                Delete
              </button>
              <button type="button" onClick={() => setDeleteId(null)} className="tm-btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function StrategiesPage() {
  return (
    <ProtectedRoute>
      <VerifiedRoute>
        <StrategiesContent />
      </VerifiedRoute>
    </ProtectedRoute>
  );
}
