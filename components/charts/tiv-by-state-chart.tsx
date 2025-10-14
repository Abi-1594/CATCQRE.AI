"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface TivByStateChartProps {
  data: Record<string, any>[]
}

const processDataForChart = (data: Record<string, any>[]) => {
  const tivByState: Record<string, number> = {}

  data.forEach((row) => {
    const state = row.State_Final || "Unknown"
    const tivRaw = row.Total_Insured_Value_Final
    const tiv = typeof tivRaw === "number" && !isNaN(tivRaw) ? tivRaw : 0

    if (tivByState[state]) {
      tivByState[state] += tiv
    } else {
      tivByState[state] = tiv
    }
  })

  return Object.entries(tivByState)
    .map(([name, value]) => ({
      name,
      value: typeof value === "number" && !isNaN(value) ? value : 0,
    }))
    .filter((entry) => entry.value > 0) // Only show states with actual values
    .sort((a, b) => b.value - a.value)
    .slice(0, 15) // Show top 15 states
}

export default function TivByStateChart({ data }: TivByStateChartProps) {
  const chartData = processDataForChart(data)

  if (chartData.length === 0) {
    return <div className="h-[250px] w-full flex items-center justify-center text-gray-500">No data available</div>
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ChartContainer
          config={{
            value: {
              label: "Total Insured Value",
              color: "hsl(var(--chart-1))",
            },
          }}
        >
          <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" fill="var(--color-value)" radius={4} />
          </BarChart>
        </ChartContainer>
      </ResponsiveContainer>
    </div>
  )
}
