"use client";

import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface BackendOrder {
  id: number;
  type: 'buy' | 'sell';
  asset: 'HYPE' | 'FLOP';
  price: number;
  amount: number;
  shares: number;
  potentialGain?: number;
}

interface MarketOrderResult {
  totalShares?: number;
  priceFinal?: number;
  priceImpact?: number;
  totalRevenue?: number;
  error?: string;
}

interface MatchingResult {
  newOrderId: number;
  executedShares: number;
  averagePrice: number;
  trades: Array<{ buyOrderId: number; sellOrderId: number; price: number; executedShares: number }>;
  remainingOrder: BackendOrder | null;
}

interface ErrorResponse {
  error: string;
}

export default function OrderbookPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState<'buy' | 'sell'>('buy'); // Agora permite atualização
  const [asset, setAsset] = useState<'flop' | 'hype'>('flop');
  const [execution, setExecution] = useState<'limit' | 'market'>('limit');
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const fetchOrders = async () => {
    try {
      console.log(API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/orders`);
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error('Erro ao buscar ordens:', err);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleAddOrder = async () => {
    setError(null);

    if (execution === 'limit') {
      const numericPrice = parseFloat(price);
      const numericQuantity = parseFloat(quantity);
      if (isNaN(numericPrice) || isNaN(numericQuantity)) {
        setError('Preço e quantidade devem ser números válidos.');
        return;
      }

      // Define o endpoint baseado no tipo da ordem (buy ou sell)
      const endpoint = type === 'buy' ? 'buy' : 'sell';
      const payload: Record<string, unknown> = {
        asset: asset.toUpperCase(),
        price: numericPrice,
      };

      if (type === 'buy') {
        payload['amount'] = numericQuantity;
      } else {
        payload['shares'] = numericQuantity;
      }

      try {
        console.log(API_BASE_URL);
        console.log(`${API_BASE_URL}/${endpoint}`);
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result: MatchingResult | ErrorResponse = await response.json();
        if (!response.ok) {
          if ('error' in result) {
            setError(result.error);
          } else {
            setError('Erro ao adicionar ordem.');
          }
          return;
        }
        fetchOrders();
        setPrice('');
        setQuantity('');
      } catch (err) {
        console.error('Erro ao adicionar ordem:', err);
        setError('Erro ao adicionar ordem.');
      }
    } else if (execution === 'market') {
      const numericValue = parseFloat(quantity);
      if (isNaN(numericValue)) {
        setError(
          type === 'buy'
            ? 'Montante deve ser um número válido.'
            : 'Quantidade de shares deve ser um número válido.'
        );
        return;
      }
      let endpoint = '';
      const payload: Record<string, unknown> = {};

      if (type === 'buy') {
        endpoint = asset === 'hype' ? 'market-buy-hype' : 'market-buy-flop';
        payload['amount'] = numericValue;
      } else if (type === 'sell') {
        endpoint = asset === 'hype' ? 'market-sell-hype' : 'market-sell-flop';
        payload['shares'] = numericValue;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result: MarketOrderResult = await response.json();
        if (!response.ok) {
          setError(result.error || 'Erro ao executar ordem a mercado.');
          return;
        }
        console.log('Resultado da ordem a mercado:', result);
        let msg = '';
        if (type === 'buy') {
          msg = `Ordem a mercado executada: ${result.totalShares} shares a preço final R$ ${result.priceFinal}`;
          if (result.priceImpact !== undefined) {
            msg += `, Impacto: ${result.priceImpact}`;
          }
        } else {
          msg = `Ordem a mercado de venda executada: ${result.totalShares} shares vendidas por um total de R$ ${result.totalRevenue} (preço médio R$ ${result.priceFinal})`;
        }
        setHistory(prev => [...prev, msg]);
        setQuantity('');
        fetchOrders();
      } catch (err) {
        console.error('Erro ao executar ordem a mercado:', err);
        setError('Erro ao executar ordem a mercado.');
      }
    }
  };

  const renderOrderbook = (assetType: 'flop' | 'hype') => (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-center capitalize">{assetType}</h2>
      <div className="border p-4 rounded-lg bg-red-100">
        <h3 className="text-lg font-bold mb-2">Vendas</h3>
        <ul>
          {orders
            .filter(
              (order) =>
                order.asset &&
                order.asset.toLowerCase() === assetType &&
                order.type === 'sell'
            )
            .map((order) => (
              <li key={order.id} className="flex justify-between">
                <span>Preço: {order.price}</span>
                <span>Shares: {order.shares}</span>
                <span>Ganho Potencial: {order.potentialGain}</span>
              </li>
            ))}
        </ul>
      </div>
      <div className="border p-4 rounded-lg bg-green-100">
        <h3 className="text-lg font-bold mb-2">Compras</h3>
        <ul>
          {orders
            .filter(
              (order) =>
                order.asset &&
                order.asset.toLowerCase() === assetType &&
                order.type === 'buy'
            )
            .map((order) => (
              <li key={order.id} className="flex justify-between">
                <span>Preço: {order.price}</span>
                <span>Valor: {order.amount}</span>
                <span>Shares: {order.shares}</span>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex bg-gray-100"
      style={{ fontFamily: 'Arial, sans-serif', color: 'black' }}
    >
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-6">Orderbook Completo</h1>
        <div className="mb-6 w-full max-w-md flex flex-col gap-4">
          {/* Nova caixa de seleção para escolher o tipo de ordem */}
          <div className="flex gap-4">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'buy' | 'sell')}
              className="flex-1 px-3 py-2 border rounded"
            >
              <option value="buy">Compra</option>
              <option value="sell">Venda</option>
            </select>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value as 'flop' | 'hype')}
              className="flex-1 px-3 py-2 border rounded"
            >
              <option value="flop">Flop</option>
              <option value="hype">Hype</option>
            </select>
            <select
              value={execution}
              onChange={(e) => setExecution(e.target.value as 'limit' | 'market')}
              className="flex-1 px-3 py-2 border rounded"
            >
              <option value="limit">Limite</option>
              <option value="market">Mercado</option>
            </select>
          </div>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Preço"
            className="w-full px-3 py-2 border rounded"
            disabled={execution === 'market'}
          />
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantidade"
            className="w-full px-3 py-2 border rounded"
          />
          {error && <div className="text-sm">{error}</div>}
          <button
            onClick={handleAddOrder}
            className="px-4 py-2 bg-blue-500 text-black rounded mt-4"
          >
            Adicionar Ordem
          </button>
        </div>
        <h3 className="font-semibold">Histórico de Ordens:</h3>
        <ul>
          {history.map((msg, idx) => (
            <li key={idx} className="text-sm">{msg}</li>
          ))}
        </ul>
      </div>
      <div className="w-80 p-4 bg-white rounded-lg shadow-md mx-auto">
        {renderOrderbook('flop')}
        {renderOrderbook('hype')}
      </div>
    </div>
  );
}
