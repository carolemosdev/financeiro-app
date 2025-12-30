import { setupInitialData } from "./actions";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Começando</h1>
        
        <form action={setupInitialData} className="space-y-4">
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">Nome do Banco</label>
            <input 
              name="bankName" 
              placeholder="Ex: Nubank" 
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-1 text-gray-700">Saldo Atual (R$)</label>
            <input 
              name="initialBalance" 
              type="number" 
              step="0.01" 
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" 
              required 
            />
          </div>

          <div className="border-t pt-4 mt-4">
            <h2 className="font-bold text-gray-700 mb-2">Investimento Teste (Opcional)</h2>
            <input 
              name="ticker" 
              placeholder="Ticker (Ex: PETR4)" 
              className="w-full border border-gray-300 p-2 rounded mb-2 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" 
            />
            <div className="flex gap-2">
              <input 
                name="quantity" 
                type="number" 
                placeholder="Qtd" 
                className="w-1/2 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" 
              />
              <input 
                name="price" 
                type="number" 
                step="0.01" 
                placeholder="Preço" 
                className="w-1/2 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none text-gray-900" 
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition duration-200">
            Salvar e Continuar
          </button>
        </form>
      </div>
    </div>
  );
}