"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function MonthSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pega o mês/ano da URL ou usa a data atual
  const currentMonth = Number(searchParams.get("month") ?? new Date().getMonth());
  const currentYear = Number(searchParams.get("year") ?? new Date().getFullYear());

  const date = new Date(currentYear, currentMonth);

  const handleChangeMonth = (increment: number) => {
    const newDate = new Date(currentYear, currentMonth + increment);
    // Atualiza a URL para filtrar o dashboard
    router.push(`/dashboard?month=${newDate.getMonth()}&year=${newDate.getFullYear()}`);
  };

  return (
    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
      <button 
        onClick={() => handleChangeMonth(-1)}
        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 font-bold transition"
        title="Mês Anterior"
      >
        &lt;
      </button>

      <span className="font-bold text-gray-800 capitalize min-w-[140px] text-center">
        {date.toLocaleString("pt-BR", { month: "long", year: "numeric" })}
      </span>

      <button 
        onClick={() => handleChangeMonth(1)}
        className="p-2 hover:bg-gray-100 rounded-full text-gray-600 font-bold transition"
        title="Próximo Mês"
      >
        &gt;
      </button>
    </div>
  );
}