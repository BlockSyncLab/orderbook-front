"use client";

import { useState, useEffect } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface BackendOrder {
  id: number;
  type: "buy" | "sell";
  asset: "HYPE" | "FLOP";
  price: number;
  amount: number;
  shares: number;
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
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState<"buy" | "sell">("buy");
  const [asset, setAsset] = useState<"hype" | "flop">("flop");
  const [execution, setExecution] = useState<"limit" | "market">("limit");
  const [error, setError] = useState<string | null>(null);
  const [marketResult, setMarketResult] = useState<MarketOrderResult | null>(
    null
  );
  const [executionResult, setExecutionResult] = useState<MatchingResult | null>(
    null
  );
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`);
      const data = await response.json();
      setOrders(data);
    } catch (err) {
      console.error("Erro ao buscar ordens:", err);
    }
  };

  const handleAddOrder = async () => {
    setError(null);
    setMarketResult(null);
    setExecutionResult(null);

    const numericPrice = parseFloat(price);
    const numericQuantity = parseFloat(quantity);
    if (isNaN(numericPrice) || isNaN(numericQuantity)) {
      setError("Preço e quantidade devem ser números válidos.");
      return;
    }

    const endpoint = type === "buy" ? "buy" : "sell";
    const payload: {
      asset: string;
      price: number;
      amount?: number;
      shares?: number;
    } = {
      asset: asset.toUpperCase(),
      price: numericPrice,
    };

    if (type === "buy") {
      payload.amount = numericQuantity;
    } else {
      payload.shares = numericQuantity;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Erro ao adicionar ordem.");
        return;
      }
      fetchOrders();
      setExecutionResult(result);
    } catch (err) {
      console.error("Erro ao adicionar ordem:", err);
      setError("Erro ao adicionar ordem.");
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-6">Orderbook</h1>
        <div className="mb-6 w-full max-w-md flex flex-col gap-4">
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

        {/* Exibir resultado da execução */}
        {executionResult && (
          <div className="mt-4 p-4 border rounded bg-white">
            <h2 className="text-lg font-semibold">Resultado da Execução</h2>
            <p>Nova Ordem ID: {executionResult.newOrderId}</p>
            <p>Execução: {executionResult.executedShares} shares</p>
            <p>Preço Médio: {executionResult.averagePrice}</p>
            {executionResult.trades.length > 0 && (
              <div className="mt-2">
                <h3 className="font-semibold">Trades:</h3>
                <ul className="list-disc pl-4">
                  {executionResult.trades.map((trade: Trade) => (
                    <li key={trade.buyOrderId || trade.sellOrderId}>
                      {trade.sellOrderId
                        ? `Venda ${trade.sellOrderId}: ${trade.executedShares} @ ${trade.price}`
                        : `Compra ${trade.buyOrderId}: ${trade.executedShares} @ ${trade.price}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
