import { prisma } from "@/lib/prisma";
import { updateTransaction } from "../../actions"; // Volta duas pastas para achar as actions
import Link from "next/link";
import { redirect } from "next/navigation";

interface Props {
  params: {
    id: string;
  };
}

export default async function EditTransactionPage({ params }: Props) {
  // 1. Busca os dados atuais para preencher o formulário
  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id }
  });

  if (!transaction) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Editar Movimentação</h1>
        
        <form action={updateTransaction} className="space-y-4">
          <input type="hidden" name="id" value={transaction.id} />
          
          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input 
              name="description" 
              defaultValue={transaction.description}
              className="w-full border border-gray-300 p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
              required 
            />
          </div>

          {/* Valor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <input 
              name="amount" 
              type="number" 
              step="0.01" 
              defaultValue={Number(transaction.amount)}
              className="w-full border border-gray-300 p-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
              required 
            />
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <select 
              name="category" 
              defaultValue={transaction.category}
              className="w-full border border-gray-300 p-2 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" 
              required
            >
              <option value="Alimentação">🍔 Alimentação</option>
              <option value="Transporte">🚗 Transporte</option>
              <option value="Lazer">🎉 Lazer</option>
              <option value="Casa">🏠 Casa</option>
              <option value="Saúde">💊 Saúde</option>
              <option value="Salário">💰 Salário</option>
              <option value="Investimento">📈 Investimento</option>
              <option value="Outros">📦 Outros</option>
            </select>
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select 
              name="type" 
              defaultValue={transaction.type}
              className="w-full border border-gray-300 p-2 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500" 
              required
            >
              <option value="EXPENSE">🔴 Despesa (Saída)</option>
              <option value="INCOME">🟢 Receita (Entrada)</option>
            </select>
          </div>

          {/* Botões */}
          <div className="pt-4 flex gap-3">
            <Link href="/dashboard" className="w-1/2 flex justify-center py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">
              Cancelar
            </Link>
            <button type="submit" className="w-1/2 bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-md">
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}