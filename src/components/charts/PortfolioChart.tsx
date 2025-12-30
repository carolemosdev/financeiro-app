"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

interface ChartProps {
  data: {
    name: string;
    value: number;
  }[]
}

export default function PortfolioChart({ data }: ChartProps) {
  return (
    <div className="h-[300px] w-full bg-white p-4 rounded-xl shadow-md flex flex-col items-center justify-center">
      <h3 className="text-gray-600 font-semibold mb-2 self-start">Alocação de Ativos</h3>
      
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                contentStyle={{ backgroundColor: 'white', borderRadius: '8px' }}
            />
            <Legend verticalAlign="bottom" height={36}/>
          </PieChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-gray-400 h-full flex items-center">
            Sem dados para exibir
        </div>
      )}
    </div>
  );
}