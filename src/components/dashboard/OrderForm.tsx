import React, { useState, useMemo } from 'react';
import type { Market } from '../../types';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Tabs } from '../ui/Tabs';
import { addOrder } from '../orders/OpenOrders';

type OrderSide = 'buy' | 'sell';
type OrderType = 'market' | 'limit' | 'stop' | 'stop-limit';

interface OrderFormProps {
    market: Market;
    price: string;
    setPrice: (price: string) => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ market, price, setPrice }) => {
  const [side, setSide] = useState<OrderSide>('buy');
  const [type, setType] = useState<OrderType>('limit');
  const [amount, setAmount] = useState('');
  const [stopPrice, setStopPrice] = useState('');

  const MOCK_BALANCES = useMemo(() => ({
    'BTC': 1.5, 'ETH': 30, 'SOL': 500, 'DOGE': 1000000, 'XRP': 50000, 'USDT': 100000,
  }), []);

  const baseBalance = MOCK_BALANCES[market.base as keyof typeof MOCK_BALANCES] || 0;
  const quoteBalance = MOCK_BALANCES[market.quote as keyof typeof MOCK_BALANCES] || 0;

  const total = (parseFloat(price) || 0) * (parseFloat(amount) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type !== 'market') {
      // Add to open orders for limit/stop orders
      const orderPrice = parseFloat(price) || 0;
      const orderAmount = parseFloat(amount) || 0;
      const orderStopPrice = parseFloat(stopPrice) || undefined;
      
      if (orderPrice > 0 && orderAmount > 0) {
        addOrder({
          market: market.id,
          side,
          type: type as 'limit' | 'stop' | 'stop-limit',
          price: orderPrice,
          stopPrice: (type === 'stop' || type === 'stop-limit') ? orderStopPrice : undefined,
          amount: orderAmount,
          total: orderPrice * orderAmount,
        });
      }
    }
    
    console.log({
      side, type, price, amount, stopPrice, market: market.id,
    });
    setAmount('');
    setStopPrice('');
  };

  const handlePercentClick = (percent: number) => {
    const percentage = percent / 100;
    if (side === 'buy') {
      const currentPrice = parseFloat(price);
      if (!currentPrice || currentPrice <= 0) return;
      const totalToSpend = quoteBalance * percentage;
      setAmount((totalToSpend / currentPrice).toFixed(6));
    } else { // sell
      const amountToSell = baseBalance * percentage;
      setAmount(amountToSell.toFixed(6));
    }
  };

  const InputGroup: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; unit: string, disabled?: boolean }> = 
    ({ label, value, onChange, placeholder, unit, disabled }) => (
    <div>
      <label className="text-xs text-slate-500 block mb-1.5">{label}</label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-slate-50 border border-slate-300 rounded-md py-2 pl-3 pr-12 text-sm placeholder:text-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 disabled:bg-slate-100/50"
        />
        <span className="absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">{unit}</span>
      </div>
    </div>
  );
  
  const PercentageButtons = () => (
    <div className="grid grid-cols-4 gap-2">
        {[25, 50, 75, 100].map(p => (
            <button key={p} type="button" onClick={() => handlePercentClick(p)} className="bg-sky-100/70 hover:bg-sky-200/70 text-slate-600 text-xs rounded-md py-1 transition-colors">
                {p}%
            </button>
        ))}
    </div>
  );

  return (
    <Card className="h-full">
      <Tabs
        tabs={[{ id: 'buy', label: `Buy ${market.base}` }, { id: 'sell', label: `Sell ${market.base}` }]}
        activeTab={side}
        onTabClick={(tab) => setSide(tab as OrderSide)}
      />
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <Tabs
          tabs={[
            { id: 'limit', label: 'Limit' }, 
            { id: 'market', label: 'Market' },
            { id: 'stop', label: 'Stop' },
            { id: 'stop-limit', label: 'Stop-Limit' },
          ]}
          activeTab={type}
          onTabClick={(tab) => setType(tab as OrderType)}
          size="sm"
        />
        
        <div className="text-xs text-slate-500 flex justify-between">
            <span>Available</span>
            <span className="font-mono">{side === 'buy' ? `${quoteBalance.toFixed(2)} ${market.quote}` : `${baseBalance.toFixed(4)} ${market.base}`}</span>
        </div>

        {(type === 'stop' || type === 'stop-limit') && (
          <InputGroup
            label="Stop Price"
            value={stopPrice}
            onChange={(e) => setStopPrice(e.target.value)}
            placeholder="Trigger when price reaches..."
            unit={market.quote}
          />
        )}
        <InputGroup
          label={type === 'stop' ? 'Execution Price' : 'Price'}
          value={type === 'market' ? 'Market' : price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          unit={market.quote}
          disabled={type === 'market' || type === 'stop'}
        />
        <InputGroup
          label="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          unit={market.base}
        />

        <PercentageButtons />

        {type === 'limit' && (
          <div className="text-sm text-slate-600 flex justify-between">
            <span>Total:</span> 
            <span className="font-mono text-slate-800">{total.toFixed(4)} {market.quote}</span>
          </div>
        )}
        <Button type="submit" variant={side === 'buy' ? 'buy' : 'sell'} className="w-full !mt-5">
          {side === 'buy' ? `Buy ${market.base}` : `Sell ${market.base}`}
        </Button>
      </form>
    </Card>
  );
};

export default OrderForm;