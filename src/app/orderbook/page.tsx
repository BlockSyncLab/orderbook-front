"use client";

import { useState, useEffect } from 'react';

// Define o endereço base da API a partir de uma variável de ambiente.
// Caso a variável não esteja definida, usa como padrão o localhost.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface BackendOrder {
  id: number;
  type: 'buy' | 'sell';
  asset: 'HYPE' | 'FLOP';
  price: number;
  amount: number; // Para compras: valor investido; para vendas: ganho potencial
  shares: number; // Quantidade de shares
  potentialGain?: number;
}

interface MarketOrderResult {
  totalShares?: number;
  priceFinal?: number;
  priceImpact?: number;
  error?: string;
}

interface Trade {
  buyOrderId?: number;
  sellOrderId?: number;
  executedShares: number;
  price: number;
}

interface MatchingResult {
  newOrderId: number;
  executedShares: number;
  averagePrice: number;
  trades: Trade[];
  remainingOrder: BackendOrder | null;
}

export default function OrderbookPage() {
  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [price, setPrice] = useState(''); 
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [asset, setAsset] = useState<'hype' | 'flop'>('flop');
  const [execution, setExecution] = useState<'limit' | 'market'>('limit');
  const [error, setError] = useState<string | null>(null);
  const [marketResult, setMarketResult] = useState<MarketOrderResult | null>(null);
  const [executionResult, setExecutionResult] = useState<MatchingResult | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const fetchOrders = async () => {
    try {
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
    setMarketResult(null);
    setExecutionResult(null);

    if (execution === 'limit') {
      const numericPrice = parseFloat(price);
      const numericQuantity = parseFloat(quantity);
      if (isNaN(numericPrice) || isNaN(numericQuantity)) {
        setError('Preço e quantidade devem ser números válidos.');
        return;
      }

      const endpoint = type === 'buy' ? 'buy' : 'sell';
      const payload: { asset: string; price: number; amount?: number; shares?: number } = {
        asset: asset.toUpperCase(), // "FLOP" ou "HYPE"
        price: numericPrice,
      };

      if (type === 'buy') {
        payload.amount = numericQuantity;
      } else {
        payload.shares = numericQuantity;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok) {
          setError(result.error || 'Erro ao adicionar ordem.');
          return;
        }
        fetchOrders();

        if (result.trades) {
          setExecutionResult(result);
          let msg = `Matching: Ordem ${result.newOrderId} executada, ${result.executedShares} shares a preço médio R$ ${result.averagePrice}.`;
          if (result.trades.length > 0) {
            msg += " Trades: " + result.trades
              .map((trade) =>
                trade.sellOrderId
                  ? `Venda ${trade.sellOrderId}: ${trade.executedShares} @ ${trade.price}`
                  : `Compra ${trade.buyOrderId}: ${trade.executedShares} @ ${trade.price}`
              )
              .join(" | ");
          }
          setHistory(prev => [...prev, msg]);

          if (result.remainingOrder) {
            const remMsg = `Ordem remanescente inserida: ID ${result.remainingOrder.id}, ${result.remainingOrder.shares} shares a R$ ${result.remainingOrder.price}.`;
            setHistory(prev => [...prev, remMsg]);
          }
        } else {
          setHistory(prev => [
            ...prev,
            `Ordem de ${type} inserida: ID ${result.id}, ${result.shares} shares a R$ ${result.price}.`
          ]);
        }
        setPrice('');
        setQuantity('');
      } catch (err) {
        console.error('Erro ao adicionar ordem:', err);
        setError('Erro ao adicionar ordem.');
      }
    } else if (execution === 'market') {
      const numericValue = parseFloat(quantity);
      if (isNaN(numericValue)) {
        setError(type === 'buy'
          ? 'Montante deve ser um número válido.'
          : 'Quantidade de shares deve ser um número válido.');
        return;
      }
      let endpoint = '';
      let payload: { amount?: number; shares?: number } = {};

      if (type === 'buy') {
        endpoint = asset === 'hype' ? 'market-buy-hype' : 'market-buy-flop';
        payload = { amount: numericValue };
      } else if (type === 'sell') {
        endpoint = asset === 'hype' ? 'market-sell-hype' : 'market-sell-flop';
        payload = { shares: numericValue };
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
        setMarketResult(result);
        let msg = '';
        if (type === 'buy') {
          msg = `Ordem a mercado executada: ${result.totalShares} shares a preço final R$ ${result.priceFinal}`;
          if (result.priceImpact !== undefined) {
            msg += `, Impacto: ${result.priceImpact}`;
          }
        } else {
          msg = `Ordem a mercado de venda executada: ${result.executedShares} shares vendidas por um total de R$ ${result.totalRevenue} (preço médio R$ ${result.averagePrice})`;
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
    <div className="min-h-screen flex bg-gray-100">
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-6">Orderbook Completo</h1>
        <div className="mb-6 w-full max-w-md flex flex-col gap-4">
          <div className="flex gap-4">
            <select
              value={execution}
              onChange={(e) => setExecution(e.target.value as 'limit' | 'market')}
              className="border p-2 rounded-lg"
            >
              <option value="limit">Ordem Limite</option>
              <option value="market">Ordem a Mercado</option>
            </select>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'buy' | 'sell')}
              className="border p-2 rounded-lg"
            >
              <option value="buy">Comprar</option>
              <option value="sell">Vender</option>
            </select>
            <select
              value={asset}
              onChange={(e) => setAsset(e.target.value as 'hype' | 'flop')}
              className="border p-2 rounded-lg"
            >
              <option value="hype">HYPE</option>
              <option value="flop">FLOP</option>
            </select>
          </div>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Preço"
            className="border p-2 rounded-lg"
          />
          <input
            type="text"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="Quantidade"
            className="border p-2 rounded-lg"
          />
          <button
            onClick={handleAddOrder}
            className="bg-blue-500 text-white py-2 px-4 rounded-lg"
          >
            Adicionar Ordem
          </button>
          {error && <div className="text-red-500">{error}</div>}
        </div>
        <div className="flex gap-8">
          {renderOrderbook('flop')}
          {renderOrderbook('hype')}
        </div>
        {marketResult && (
          <div className="p-4 mt-4 border bg-white">
            <h3 className="text-xl font-semibold">Resultado da Ordem</h3>
            <div>Shares: {marketResult.totalShares}</div>
            <div>Preço Final: {marketResult.priceFinal}</div>
            <div>Impacto: {marketResult.priceImpact}</div>
          </div>
        )}
        {executionResult && (
          <div className="p-4 mt-4 border bg-white">
            <h3 className="text-xl font-semibold">Resultado da Execução</h3>
            <div>ID Ordem: {executionResult.newOrderId}</div>
            <div>Shares Executados: {executionResult.executedShares}</div>
            <div>Preço Médio: {executionResult.averagePrice}</div>
          </div>
        )}
        <div className="mt-4">
          <h3 className="font-bold">Histórico de Execuções</h3>
          <ul>
            {history.map((msg, idx) => (
              <li key={idx} className="text-sm">{msg}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
