import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PortfolioChart from "@/components/charts/PortfolioChart";
import MonthlyChart from "@/components/charts/MonthlyChart";
import Link from "next/link";
import { getStockPrice } from "@/services/investment-api";
import { formatCurrency } from "@/utils/formatters";
import { deleteTransaction } from "./actions";
import MonthSelector from "@/components/dashboard/MonthSelector"; // Ajustei para @/ para garantir

// Mapa de Ícones
const CATEGORY_ICONS: Record<string, string> = {
  "Alimentação": "🍔",
  "Transporte": "🚗",
  "Lazer": "🎉",
  "Casa": "🏠",
  "Saúde": "💊",
  "Salário": "💰",
  "Investimento": "📈",
  "Outros": "📦",
  "Geral": "📝",
  "Ajuste": "🔧"
};

// Recebendo os parametros de busca (URL)
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  // 1. VERIFICAÇÃO DE SEGURANÇA
  const userId = await verifySession();
  
  if (!userId) {
    redirect("/login");
  }

  // 2. LÓGICA DE DATA (FILTRO)
  const now = new Date();
  // Se tiver na URL usa, senão usa o atual
  const month = searchParams.month ? Number(searchParams.month) : now.getMonth();
  const year = searchParams.year ? Number(searchParams.year) : now.getFullYear();

  // Define inicio e fim do mês para o banco de dados
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  // 3. BUSCA DADOS COM O FILTRO DE DATA APLICADO
  const account = await prisma.account.findFirst({
    where: { userId: userId },
    include: { 
      transactions: { 
        where: {
          date: {
            gte: startDate, // Maior ou igual dia 1
            lte: endDate    // Menor ou igual ultimo dia
          }
        },
        orderBy: { date: 'desc' } 
      } 
    }
  });

  const asset = await prisma.asset.findFirst({
    where: { userId: userId },
    include: { orders: true }
  });

  // 4. Cálculos de Totais (Baseado apenas no mês filtrado)
  const transactions = account?.transactions || [];
  
  const totalIncome = transactions
    .filter(t => t.type === "INCOME")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === "EXPENSE")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  // 5. Preparando dados para o Gráfico Mensal
  const monthlyDataMap = new Map();

  transactions.forEach((t) => {
    // Usamos o dia para agrupar no gráfico mensal se quiser detalhar, 
    // ou mantemos o agrupamento atual. Como estamos filtrando um mês só,
    // o gráfico atual mostraria apenas uma barra. 
    // O ideal seria mostrar "Dia a dia" ou manter a visão geral.
    // Mantive a lógica original para não quebrar, ele vai mostrar apenas o mês atual no gráfico.
    const monthLabel = new Date(t.date).toLocaleString('pt-BR', { month: 'short' });
    if (!monthlyDataMap.has(monthLabel)) {
      monthlyDataMap.set(monthLabel, { name: monthLabel.toUpperCase(), receitas: 0, despesas: 0 });
    }
    const current = monthlyDataMap.get(monthLabel);
    if (t.type === "INCOME") current.receitas += Number(t.amount);
    else current.despesas += Number(t.amount);
  });

  const monthlyChartData = Array.from(monthlyDataMap.values()).reverse();

  // 6. Lógica de Investimentos
  let currentPrice = 0;
  let stockLogo = "";
  if (asset) {
    const stockData = await getStockPrice(asset.ticker);
    if (stockData) {
      currentPrice = stockData.regularMarketPrice;
      stockLogo = stockData.logourl;
    }
  }

  const chartData = asset ? [{
      name: asset.ticker,
      value: asset.orders.reduce((acc, order) => {
        const priceToUse = currentPrice > 0 ? currentPrice : Number(order.price);
        return acc + (priceToUse * Number(order.quantity));
      }, 0)
  }] : [];

  const totalInvested = asset ? asset.orders.reduce((acc, order) => acc + (Number(order.price) * Number(order.quantity)), 0) : 0;
  const currentTotalValue = chartData.length > 0 ? chartData[0].value : 0;
  const profit = currentTotalValue - totalInvested;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Meu Painel Financeiro</h1>
            <div className="flex gap-4 mt-2 text-sm">
                <Link href="/dashboard/cards" className="text-gray-500 hover:text-purple-600 flex items-center gap-1">
                    💳 Meus Cartões
                </Link>
                <Link href="/dashboard/goals" className="text-gray-500 hover:text-blue-600 flex items-center gap-1">
                    🎯 Meus Objetivos
                </Link>
            </div>
          </div>
          
          {/* Seletor de Mês e Botão de Transação */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <MonthSelector />
            
            <Link href="/dashboard/transaction" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition flex items-center gap-2">
              + Nova Transação
            </Link>
          </div>
        </div>
        
        {/* --- BLOCO 1: RESUMO FINANCEIRO --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm font-semibold uppercase">Saldo Atual</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">
              {/* O saldo total da conta não muda com o filtro, é o acumulado histórico */}
              {account ? formatCurrency(Number(account.balance)) : formatCurrency(0)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 text-sm font-semibold uppercase">Entradas ({month + 1}/{year})</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
            <p className="text-gray-500 text-sm font-semibold uppercase">Saídas ({month + 1}/{year})</p>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {formatCurrency(totalExpense)}
            </p>
          </div>
        </div>

        {/* --- BLOCO 2: GRÁFICOS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
             {monthlyChartData.length > 0 ? (
                <MonthlyChart data={monthlyChartData} />
             ) : (
                <div className="h-[300px] w-full bg-white p-4 rounded-xl shadow-sm flex items-center justify-center text-gray-400">
                    Sem movimentações neste mês.
                </div>
             )}
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
            <h2 className="text-gray-700 font-bold mb-4 border-b pb-2">Investimentos</h2>
            {asset ? (
               <div className="mt-2">
                 <div className="flex items-center gap-3 mb-4">
                    {stockLogo && <img src={stockLogo} alt="Logo" className="w-12 h-12 rounded-full shadow-sm" />}
                    <div>
                        <p className="text-xl font-bold text-gray-900">{asset.ticker}</p>
                        <p className="text-sm text-gray-500">Cotação: {formatCurrency(currentPrice)}</p>
                    </div>
                 </div>
                 
                 <div className="space-y-3">
                    <div className="flex justify-between">
                        <span className="text-gray-500">Total Investido</span>
                        <span className="font-medium">{formatCurrency(totalInvested)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500">Valor Atual</span>
                        <span className="font-bold text-gray-800">{formatCurrency(currentTotalValue)}</span>
                    </div>
                    <div className="pt-3 border-t flex justify-between items-center">
                        <span className="text-gray-500">Lucro/Prejuízo</span>
                        <span className={`font-bold text-sm px-2 py-1 rounded ${profit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {profit >= 0 ? '+' : ''} {formatCurrency(profit)}
                        </span>
                    </div>
                 </div>
                 <div className="mt-6 h-32">
                    <PortfolioChart data={chartData} />
                 </div>
               </div>
            ) : (
              <p className="text-gray-400 mt-2 text-center py-10">Nenhum ativo cadastrado.</p>
            )}
          </div>
        </div>

        {/* --- BLOCO 3: LISTA DE TRANSAÇÕES --- */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-gray-800 mb-6">Movimentações de {new Date(year, month).toLocaleString('pt-BR', { month: 'long' })}</h3>
            <div className="space-y-4">
            {account?.transactions.length ? (
              account.transactions.map((t) => (
                  <div key={t.id} className="flex justify-between items-center group hover:bg-gray-50 p-3 rounded-lg transition border border-transparent hover:border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-2xl rounded-full flex items-center justify-center">
                          {CATEGORY_ICONS[t.category] || "📝"}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{t.description}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                             <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{t.category}</span>
                             <span>•</span>
                             <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                          <span className={`font-bold text-lg ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                            {t.type === 'INCOME' ? '+' : '-'} {formatCurrency(Number(t.amount))}
                          </span>
                          
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Link 
                                href={`/dashboard/transaction/${t.id}`}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600 transition"
                                title="Editar"
                              >
                                ✏️
                              </Link>

                              <form action={deleteTransaction}>
                                  <input type="hidden" name="id" value={t.id} />
                                  <button type="submit" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition" title="Excluir">
                                      🗑️
                                  </button>
                              </form>
                          </div>
                      </div>
                  </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">
                Nenhuma movimentação em {new Date(year, month).toLocaleString('pt-BR', { month: 'long' })}.
              </p>
            )}
            </div>
        </div>

      </div>
    </div>
  );
}