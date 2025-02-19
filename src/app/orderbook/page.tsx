import { useState } from "react";

interface MarketOrderResult {
  status: string;
  message?: string;
}

interface MatchingResult {
  executed: boolean;
  details?: string;
}

const OrderBook = () => {
  const [marketResult, setMarketResult] = useState<MarketOrderResult | null>(null);
  const [executionResult, setExecutionResult] = useState<MatchingResult | null>(null);

  const executeOrder = (asset: string, price: number) => {
    if (!asset || isNaN(price)) {
      console.error("Invalid asset or price");
      return;
    }

    const numericPrice = Number(price);

    const payload: Record<string, unknown> = {
      asset: asset.toUpperCase(),
      price: numericPrice,
    };

    console.log("Executing order with payload:", payload);

    setMarketResult({ status: "success" });
    setExecutionResult({ executed: true });
  };

  return (
    <div>
      <h2>Order Book</h2>
      <button onClick={() => executeOrder("HYPE", 100)}>Buy HYPE</button>
      <button onClick={() => executeOrder("FLOP", 200)}>Buy FLOP</button>
      {marketResult && <p>Market Status: {marketResult.status}</p>}
      {executionResult && <p>Execution Status: {executionResult.executed ? "Success" : "Failure"}</p>}
    </div>
  );
};

export default OrderBook;
