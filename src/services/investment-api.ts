// src/services/investment-api.ts

interface StockData {
  symbol: string;
  regularMarketPrice: number;
  logourl: string;
}

export async function getStockPrice(ticker: string): Promise<StockData | null> {
  // TOKEN PÚBLICO DE TESTE (Pode ter limite de requisições)
  // Se parar de funcionar, crie uma conta grátis em https://brapi.dev/
  const token = "d7WkQoE6jN8zC9f8x7yZ5A"; 
  
  try {
    const response = await fetch(
      `https://brapi.dev/api/quote/${ticker}?token=${token}`,
      { next: { revalidate: 60 } } // Cache: Só busca dados novos a cada 60 segundos
    );

    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return null;
    }

    return {
      symbol: data.results[0].symbol,
      regularMarketPrice: data.results[0].regularMarketPrice,
      logourl: data.results[0].logourl
    };
  } catch (error) {
    console.error("Erro ao buscar cotação:", error);
    return null;
  }
}