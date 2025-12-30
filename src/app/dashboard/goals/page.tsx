import { prisma } from "@/lib/prisma";
import { createGoal, addMoneyToGoal } from "../actions";
import Link from "next/link";
import { formatCurrency } from "@/utils/formatters";

export default async function GoalsPage() {
  const user = await prisma.user.findFirst({
    include: { goals: { orderBy: { deadline: 'asc' } } }
  });

  const goals = user?.goals || [];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-800 transition">
            ← Voltar para o Painel
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Meus Objetivos 🎯</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- COLUNA 1: CRIAR NOVA META --- */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md h-fit">
            <h2 className="text-xl font-bold text-gray-700 mb-4">Nova Meta</h2>
            <form action={createGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nome do Objetivo</label>
                <input name="name" placeholder="Ex: Viagem, Carro..." className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Quanto preciso? (Meta)</label>
                <input name="targetAmount" type="number" step="0.01" placeholder="10000.00" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Já tenho guardado (Opcional)</label>
                <input name="currentAmount" type="number" step="0.01" placeholder="0.00" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Prazo (Data Alvo)</label>
                <input name="deadline" type="date" className="w-full border p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-md">
                Criar Objetivo
              </button>
            </form>
          </div>

          {/* --- COLUNA 2: LISTA DE METAS --- */}
          <div className="lg:col-span-2 space-y-6">
            {goals.length > 0 ? (
              goals.map((goal) => {
                const current = Number(goal.currentAmount);
                const target = Number(goal.targetAmount);
                const percentage = Math.min(100, Math.round((current / target) * 100));
                
                return (
                  <div key={goal.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="font-bold text-xl text-gray-800">{goal.name}</h3>
                            {goal.deadline && (
                                <p className="text-xs text-gray-400">Meta para: {new Date(goal.deadline).toLocaleDateString('pt-BR')}</p>
                            )}
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Falta: {formatCurrency(target - current)}</p>
                            <p className="font-bold text-blue-600">{percentage}%</p>
                        </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="w-full bg-gray-200 rounded-full h-4 mb-4 overflow-hidden">
                        <div 
                            className={`h-4 rounded-full transition-all duration-1000 ${percentage >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>

                    <div className="flex justify-between items-center text-sm mb-4">
                        <span className="font-bold text-gray-700">{formatCurrency(current)}</span>
                        <span className="text-gray-400">de {formatCurrency(target)}</span>
                    </div>

                    {/* Formulário rápido para adicionar dinheiro */}
                    <form action={addMoneyToGoal} className="flex gap-2 bg-gray-50 p-2 rounded-lg">
                        <input type="hidden" name="goalId" value={goal.id} />
                        <input name="amount" type="number" placeholder="Valor a guardar..." className="flex-1 bg-transparent border-none outline-none text-sm px-2" required />
                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded font-bold transition">
                            + Guardar
                        </button>
                    </form>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl border-2 border-dashed border-gray-300 text-gray-400">
                <p className="text-4xl mb-2">🎯</p>
                <p>Nenhum objetivo definido ainda.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}