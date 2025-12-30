"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MonthlyData {
  name: string; // Ex: "Jan", "Fev"
  receitas: number;
  despesas: number;
}

export default function MonthlyChart({ data }: { data: MonthlyData[] }) {
  return (
    <div className="h-[300px] w-full bg-white p-4 rounded-xl shadow-sm">
      <h3 className="text-gray-700 font-bold mb-4">Balanço Mensal</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$ ${value}`} />
          <Tooltip 
            formatter={(value: number) => [`R$ ${value.toFixed(2)}`]}
            cursor={{ fill: 'transparent' }}
          />
          <Legend />
          <Bar dataKey="receitas" name="Receitas" fill="#16a34a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="despesas" name="Despesas" fill="#dc2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}