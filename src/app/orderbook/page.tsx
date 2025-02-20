"use client";

import { useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

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
}

export default function OrderbookPage() {
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [type] = useState<"buy" | "sell">("buy"); // Removido setType
  const [asset] = useState<"hype" | "flop">("flop"); // Removido setAsset
  const [error, setError] = useState<string | null>(null);
  const [executionResult, setExecutionResult] = useState<MatchingResult | null>(
    null
  );

  const handleAddOrder = async () => {
    setError(null);
    setExecutionResult(null);

    const numericPrice = parseFloat(price);
    const numericQuantity = parseFloat(quantity);
    if (isNaN(numericPrice) || isNaN(numericQuantity)) {
      setError("Preço e quantidade devem ser números válidos.");
      return;
    }

    const endpoint = type === "buy" ? "buy" : "sell";
    const payload = {
      asset: asset.toUpperCase(),
      price: numericPrice,
      amount: type === "buy" ? numericQuantity : undefined,
      shares: type === "sell" ? numericQuantity : undefined,
    };

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
                  {executionResult.trades.map((trade) => (
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
