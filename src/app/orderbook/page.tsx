"use client";

import { useState } from 'react';

interface Order {
  price: number;
  quantity: number;
  type: 'buy' | 'sell';
  asset: 'flop' | 'hype';
}

export default function OrderbookPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [type, setType] = useState<'buy' | 'sell'>('buy');
  const [asset, setAsset] = useState<'flop' | 'hype'>('flop');

  const handleAddOrder = () => {
    const newOrder: Order = {
      price: parseFloat(price),
      quantity: parseFloat(quantity),
      type,
      asset,
    };
    if (!isNaN(newOrder.price) && !isNaN(newOrder.quantity)) {
      setOrders((prev) => [...prev, newOrder]);
      setPrice('');
      setQuantity('');
    }
  };

  const renderOrderbook = (assetType: 'flop' | 'hype') => (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-center capitalize">{assetType}</h2>
      <div className="border p-4 rounded-lg bg-green-100">
        <h3 className="text-lg font-bold mb-2">Compras</h3>
        <ul>
          {orders.filter(o => o.asset === assetType && o.type === 'buy').map((order, index) => (
            <li key={index} className="flex justify-between">
              <span>Preço: {order.price}</span>
              <span>Quantidade: {order.quantity}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="border p-4 rounded-lg bg-red-100">
        <h3 className="text-lg font-bold mb-2">Vendas</h3>
        <ul>
          {orders.filter(o => o.asset === assetType && o.type === 'sell').map((order, index) => (
            <li key={index} className="flex justify-between">
              <span>Preço: {order.price}</span>
              <span>Quantidade: {order.quantity}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-6">Orderbook Completo</h1>
      <div className="mb-6 w-full max-w-md flex flex-col gap-4">
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Preço"
          className="border p-2 rounded-lg"
        />
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Quantidade"
          className="border p-2 rounded-lg"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as 'buy' | 'sell')}
          className="border p-2 rounded-lg"
        >
          <option value="buy">Compra</option>
          <option value="sell">Venda</option>
        </select>
        <select
          value={asset}
          onChange={(e) => setAsset(e.target.value as 'flop' | 'hype')}
          className="border p-2 rounded-lg"
        >
          <option value="flop">Flop</option>
          <option value="hype">Hype</option>
        </select>
        <button
          onClick={handleAddOrder}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
        >
          Adicionar Ordem
        </button>
      </div>
      <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
        {renderOrderbook('flop')}
        {renderOrderbook('hype')}
      </div>
    </div>
  );
}
