import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-900 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex flex-col gap-4">
        <h1 className="text-4xl font-bold">Money Manager 2025</h1>
        <p className="text-xl">Organize suas finanças e investimentos em um só lugar.</p>
        
        <Link 
          href="/onboarding" 
          className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold transition-colors"
        >
          Começar Agora
        </Link>
      </div>
    </main>
  );
}