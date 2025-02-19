"use client";

import { useState } from "react";

interface Trade {
  buyOrderId?: number;
  sellOrderId?: number;
  executedShares: number;
  price: number;
}

interface BackendOrder {
  id: number;
  type: "buy" | "sell";
  asset: string;
  price: number;
  amount?: number;
  shares?: number;
}

interface MatchingResult {
  newOrderId: number;
  executedShares: number;
  averagePrice: number;
  trades: Trade[];
  remainingOrder: BackendOrder | null;
}

export default function Home() {
  const [type, setType] = useState("buy");
  const [asset, setAsset] = useState("HYPE");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [orderBook, setOrderBook] = useState<MatchingResult | null>(null);

  const handleSubmit = async () => {
    const numericPrice = parseFloat(price);
    const numericQuantity = parseFloat(quantity);
    if (isNaN(numericPrice) || isNaN(numericQuantity)) {
      alert("Preço e quantidade devem ser números válidos");
      return;
    }

    const payload: {
      asset: string;
      price: number;
      amount?: number;
      shares?: number;
    } = {
      asset: asset.toUpperCase(), // "FLOP" ou "HYPE"
      price: numericPrice,
    };

    if (type === "buy") {
      payload.amount = numericQuantity;
    } else {
      payload.shares = numericQuantity;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/match-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        throw new Error("Erro ao enviar ordem");
      }
      const data: MatchingResult = await response.json();
      setOrderBook(data);
    } catch (error) {
      console.error("Erro ao processar ordem:", error);
      alert("Erro ao processar ordem. Verifique o console para mais detalhes.");
    }
  };

  return (
    <div>
      <h1>Order Book</h1>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="buy">Comprar</option>
        <option value="sell">Vender</option>
      </select>
      <select value={asset} onChange={(e) => setAsset(e.target.value)}>
        <option value="HYPE">HYPE</option>
        <option value="FLOP">FLOP</option>
      </select>
      <input
        type="text"
        placeholder="Preço"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <input
        type="text"
        placeholder="Quantidade"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      <button onClick={handleSubmit}>Enviar Ordem</button>
      {orderBook && (
        <div>
          <h2>Resultado da Ordem</h2>
          <p>Novo ID da Ordem: {orderBook.newOrderId}</p>
          <p>Shares Executadas: {orderBook.executedShares}</p>
          <p>Preço Médio: {orderBook.averagePrice}</p>
          <h3>Trades:</h3>
          <ul>
            {orderBook.trades.map((trade, index) => (
              <li key={index}>
                {trade.buyOrderId && `Buy Order ID: ${trade.buyOrderId}, `}
                {trade.sellOrderId && `Sell Order ID: ${trade.sellOrderId}, `}
                Executed Shares: {trade.executedShares}, Price: {trade.price}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
