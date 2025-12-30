import { prisma } from "@/lib/prisma";
import { createCreditCard } from "../actions";
import Link from "next/link";
import { formatCurrency } from "@/utils/formatters";
import { verifySession } from "@/lib/auth"; // <--- NOVO
import { redirect } from "next/navigation"; // <--- NOVO

export default async function CardsPage() {
  const userId = await verifySession(); // <--- Verificação de Segurança
  
  if (!userId) {
    redirect("/login");
  }

  // Busca apenas cartões do usuário logado
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { creditCards: true }
  });

  const cards = user?.creditCards || [];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Cabeçalho */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-800 transition">
            ← Voltar para o Painel
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Meus Cartões</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* --- COLUNA 1: FORMULÁRIO --- */}
          <div className="bg-white p-6 rounded-xl shadow-md h-fit">
            <h2 className="text-xl font-bold text-gray-700 mb-4">Adicionar Novo Cartão</h2>
            <form action={createCreditCard} className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nome do Cartão</label>
                <input name="name" placeholder="Ex: Nubank Roxinho" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Limite Total (R$)</label>
                <input name="limit" type="number" step="0.01" placeholder="5000.00" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Dia Fechamento</label>
                  <input name="closingDay" type="number" min="1" max="31" placeholder="Ex: 5" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Dia Vencimento</label>
                  <input name="dueDay" type="number" min="1" max="31" placeholder="Ex: 12" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" required />
                </div>
              </div>

              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition mt-2">
                Cadastrar Cartão
              </button>
            </form>
          </div>

          {/* --- COLUNA 2: LISTA --- */}
          <div className="space-y-4">
            {cards.length > 0 ? (
              cards.map((card) => (
                <div key={card.id} className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-xl shadow-lg text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-xl">{card.name}</h3>
                      <p className="text-gray-400 text-sm mt-1">Limite: {formatCurrency(Number(card.limit))}</p>
                    </div>
                    <div className="text-2xl">💳</div>
                  </div>

                  <div className="mt-8 flex justify-between items-end text-sm text-gray-300">
                    <div>
                      <p>Fecha dia: <span className="text-white font-bold">{card.closingDay}</span></p>
                      <p>Vence dia: <span className="text-white font-bold">{card.dueDay}</span></p>
                    </div>
                    <p className="text-xs text-purple-300 border border-purple-500/30 px-2 py-1 rounded">
                      Fatura Atual: R$ 0,00
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border-2 border-dashed border-gray-300 text-gray-400">
                <p className="text-4xl mb-2">💳</p>
                <p>Nenhum cartão cadastrado</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}