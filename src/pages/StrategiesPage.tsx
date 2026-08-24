import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTrade } from '../contexts/TradeContext';
import { strategyService } from '../services/strategyService';
import type { Strategy, StrategyFormData } from '../types';
import { Button } from '../components/ui/Button';
import { Card, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { ProtectedRoute, VerifiedRoute } from '../components/layout/ProtectedRoute';

const emptyForm: StrategyFormData = {
  strategy_name: '',
  account_balance: 1000,
  currency: 'USD',
  risk_percent: 1,
  entry_method: 'MIDDLE',
  default_tp: 'TP1',
};

function StrategiesContent() {
  const { user } = useAuth();
  const { strategies, refreshStrategies, selectStrategy, activeStrategyId } = useTrade();
  const [form, setForm] = useState<StrategyFormData>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Strategies</h1>
          <p className="text-gray-400">Manage your trading accounts and risk settings</p>
        </div>
        <Button onClick={openCreate}>Create Strategy</Button>
      </div>

      {strategies.length === 0 && !showForm && (
        <Card className="text-center">
          <p className="text-gray-300">Create your first trading account</p>
          <Button className="mt-4" onClick={openCreate}>
            Create Strategy
          </Button>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardTitle>{editingId ? 'Edit Strategy' : 'New Strategy'}</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Strategy Name" value={form.strategy_name} onChange={(e) => setForm((f) => ({ ...f, strategy_name: e.target.value }))} />
            <Input label="Account Balance" type="number" min={1} value={form.account_balance} onChange={(e) => setForm((f) => ({ ...f, account_balance: Number(e.target.value) }))} />
            <Select label="Currency" value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value as 'USD' | 'EUR' }))}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </Select>
            <Input label="Risk %" type="number" min={0.01} step={0.1} value={form.risk_percent} onChange={(e) => setForm((f) => ({ ...f, risk_percent: Number(e.target.value) }))} />
            <Select label="Entry Method" value={form.entry_method} onChange={(e) => setForm((f) => ({ ...f, entry_method: e.target.value as 'BEST' | 'MIDDLE' | 'WORST' }))}>
              <option value="BEST">Best</option>
              <option value="MIDDLE">Middle</option>
              <option value="WORST">Worst</option>
            </Select>
            <Input label="Default TP" value={form.default_tp} onChange={(e) => setForm((f) => ({ ...f, default_tp: e.target.value }))} />
          </div>
          {error && <p className="mt-2 text-sm text-loss">{error}</p>}
          <div className="mt-4 flex gap-2">
            <Button onClick={saveStrategy}>Save</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4">
        {strategies.map((strategy) => (
          <Card key={strategy.id} className={strategy.id === activeStrategyId ? 'border-accent-gold/40' : ''}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{strategy.strategy_name}</h3>
                <p className="mt-1 text-sm text-gray-400">
                  {strategy.currency === 'EUR' ? '€' : '$'}
                  {strategy.account_balance.toLocaleString()} · {strategy.risk_percent}% ·{' '}
                  {strategy.entry_method} · {strategy.default_tp}
                </p>
                {strategy.id === activeStrategyId && (
                  <span className="mt-2 inline-block rounded-lg bg-accent-gold/15 px-2 py-1 text-xs text-accent-gold">
                    Active
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {strategy.id !== activeStrategyId && (
                  <Button variant="secondary" onClick={() => selectStrategy(strategy.id)}>
                    Activate
                  </Button>
                )}
                <Button variant="ghost" onClick={() => openEdit(strategy)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="danger" onClick={() => setDeleteId(strategy.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <Card className="max-w-md">
            <h3 className="text-lg font-semibold text-white">Delete this strategy?</h3>
            <p className="mt-2 text-gray-400">This action cannot be undone.</p>
            <div className="mt-4 flex gap-2">
              <Button variant="danger" onClick={confirmDelete}>
                Delete
              </Button>
              <Button variant="ghost" onClick={() => setDeleteId(null)}>
                Cancel
              </Button>
            </div>
          </Card>
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
