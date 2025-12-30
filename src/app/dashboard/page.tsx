import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { redirect } from "next/navigation";
import PortfolioChart from "@/components/charts/PortfolioChart";
import MonthlyChart from "@/components/charts/MonthlyChart";
import Link from "next/link";
import { getStockPrice } from "@/services/investment-api";
import { formatCurrency } from "@/utils/formatters";
import { deleteTransaction } from "./actions";
import MonthSelector from "@/components/dashboard/MonthSelector";

const CATEGORY_ICONS: Record<string, string> = {
  "Alimentação": "🍔", "Transporte": "🚗", "Lazer": "🎉", "Casa": "🏠",
  "Saúde": "💊", "Salário": "💰", "Investimento": "📈", "Outros": "📦",
  "Geral": "📝", "Ajuste": "🔧"
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const userId = await verifySession();
  if (!userId) redirect("/login");

  // 1. DATA SELECIONADA
  const now = new Date();
  const selectedMonth = searchParams.month ? Number(searchParams.month) : now.getMonth();
  const selectedYear = searchParams.year ? Number(searchParams.year) : now.getFullYear();

  // 2. BUSCA TUDO (Removemos o filtro de data do banco para garantir que nada se perca)
  const userWithData = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: {
        include: {
          transactions: { orderBy: { date: 'desc' } } // Traz todas as transações
        }
      }
    }
  });

  const asset = await prisma.asset.findFirst({
    where: { userId: userId },
    include: { orders: true }
  });

  // 3. PROCESSAMENTO E FILTRO NO JAVASCRIPT (Mais seguro contra Fuso Horário)
  const allAccounts = userWithData?.accounts || [];
  const totalBalance = allAccounts.reduce((acc, account) => acc + Number(account.balance), 0);

  // Filtra as transações aqui no código
  const allTransactions = allAccounts.flatMap(account => account.transactions);
  
  const transactions = allTransactions.filter(t => {
    const tDate = new Date(t.date);
    // Ajuste simples para garantir mês/ano correto independente do dia/hora
    return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Totais
  const totalIncome = transactions
    .filter(t => t.type === "INCOME")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalExpense = transactions
    .filter(t => t.type === "EXPENSE")
    .reduce((acc, t) => acc + Number(t.amount), 0);

  // Gráfico Diário
  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dailyChartData = Array.from({ length: daysInMonth }, (_, i) => ({
    name: (i + 1).toString(),
    receitas: 0,
    despesas: 0
  }));

  transactions.forEach((t) => {
    const day = new Date(t.date).getUTCDate(); // Use UTC Date para alinhar
    if (dailyChartData[day - 1]) {
      if (t.type === "INCOME") dailyChartData[day - 1].receitas += Number(t.amount);
      else dailyChartData[day - 1].despesas += Number(t.amount);
    }
  });

  const hasDataForChart = dailyChartData.some(d => d.receitas > 0 || d.despesas > 0);

  // Investimentos
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
        const price = currentPrice > 0 ? currentPrice : Number(order.price);
        return acc + (price * Number(order.quantity));
      }, 0)
  }] : [];
  
  const totalInvested = asset ? asset.orders.reduce((acc, o) => acc + (Number(o.price) * Number(o.quantity)), 0) : 0;
  const currentTotalValue = chartData.length > 0 ? chartData[0].value : 0;
  const profit = currentTotalValue - totalInvested;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Meu Painel Financeiro</h1>
            <div className="flex gap-4 mt-2 text-sm">
                <Link href="/dashboard/cards" className="text-gray-500 hover:text-purple-600 flex items-center gap-1">💳 Meus Cartões</Link>
                <Link href="/dashboard/goals" className="text-gray-500 hover:text-blue-600 flex items-center gap-1">🎯 Meus Objetivos</Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <MonthSelector />
            <Link href="/dashboard/transaction" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-md transition flex items-center gap-2">
              + Nova Transação
            </Link>
          </div>
        </div>

        {/* ALERTA DE DEBUG: Se não tiver contas, avisa o usuário */}
        {allAccounts.length === 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <span className="font-bold">Atenção:</span> Você não tem nenhuma conta bancária cadastrada. 
                  As transações precisam de uma conta para aparecer aqui.
                  <Link href="/dashboard/cards" className="font-bold underline ml-1">Cadastre um cartão ou conta.</Link>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <p className="text-gray-500 text-sm font-semibold uppercase">Saldo Global</p>
            <p className="text-3xl font-bold text-gray-800 mt-2">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <p className="text-gray-500 text-sm font-semibold uppercase">Entradas ({selectedMonth + 1}/{selectedYear})</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
            <p className="text-gray-500 text-sm font-semibold uppercase">Saídas ({selectedMonth + 1}/{selectedYear})</p>
            <p className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(totalExpense)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
             {hasDataForChart ? (
                <MonthlyChart data={dailyChartData} />
             ) : (
                <div className="h-[300px] w-full bg-white p-4 rounded-xl shadow-sm flex items-center justify-center text-gray-400">
                    Nenhuma movimentação neste mês para o gráfico.
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
                    <div className="flex justify-between"><span className="text-gray-500">Total Investido</span><span className="font-medium">{formatCurrency(totalInvested)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Valor Atual</span><span className="font-bold text-gray-800">{formatCurrency(currentTotalValue)}</span></div>
                    <div className="pt-3 border-t flex justify-between items-center">
                        <span className="text-gray-500">Lucro/Prejuízo</span>
                        <span className={`font-bold text-sm px-2 py-1 rounded ${profit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{profit >= 0 ? '+' : ''} {formatCurrency(profit)}</span>
                    </div>
                 </div>
                 <div className="mt-6 h-32"><PortfolioChart data={chartData} /></div>
               </div>
            ) : (<p className="text-gray-400 mt-2 text-center py-10">Nenhum ativo cadastrado.</p>)}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="font-bold text-gray-800 mb-6">Movimentações de {new Date(selectedYear, selectedMonth).toLocaleString('pt-BR', { month: 'long' })}</h3>
            <div className="space-y-4">
            {transactions.length ? (
              transactions.map((t) => (
                  <div key={t.id} className="flex justify-between items-center group hover:bg-gray-50 p-3 rounded-lg transition border border-transparent hover:border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-2xl rounded-full flex items-center justify-center">{CATEGORY_ICONS[t.category] || "📝"}</div>
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
                          <span className={`font-bold text-lg ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'INCOME' ? '+' : '-'} {formatCurrency(Number(t.amount))}</span>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <form action={deleteTransaction}>
                                  <input type="hidden" name="id" value={t.id} />
                                  <button type="submit" className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition">🗑️</button>
                              </form>
                          </div>
                      </div>
                  </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">Nenhuma movimentação encontrada em {new Date(selectedYear, selectedMonth).toLocaleString('pt-BR', { month: 'long' })}.</p>
            )}
            </div>
        </div>
      </div>
    </div>
  );
}