"use client"

import { Pie, PieChart, ResponsiveContainer, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface RiskDistributionChartProps {
  data: Record<string, any>[]
}

const COLORS = {
  Low: "hsl(142, 76%, 36%)",
  Moderate: "hsl(48, 96%, 53%)",
  High: "hsl(25, 95%, 53%)",
  "Very High": "hsl(0, 84%, 60%)",
  Unknown: "hsl(0, 0%, 50%)",
}

const processDataForChart = (data: Record<string, any>[]) => {
  const riskCounts: Record<string, number> = {
    Low: 0,
    Moderate: 0,
    High: 0,
    "Very High": 0,
    Unknown: 0,
  }

  data.forEach((row) => {
    const risk = row.Flood_Risk || "Unknown"
    if (riskCounts.hasOwnProperty(risk)) {
      riskCounts[risk]++
    } else {
      // If we encounter an unexpected risk value, count it as Unknown
      riskCounts.Unknown++
    }
  })

  return Object.entries(riskCounts)
    .map(([name, value]) => ({
      name,
      value: typeof value === "number" && !isNaN(value) && value > 0 ? value : 0,
    }))
    .filter((entry) => entry.value > 0) // Only show categories with actual counts
}

export default function RiskDistributionChart({ data }: RiskDistributionChartProps) {
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
              label: "Number of Locations",
              color: "hsl(var(--chart-1))",
            },
            Low: {
              label: "Low Risk",
              color: "hsl(142, 76%, 36%)",
            },
            Moderate: {
              label: "Moderate Risk",
              color: "hsl(48, 96%, 53%)",
            },
            High: {
              label: "High Risk",
              color: "hsl(25, 95%, 53%)",
            },
            "Very High": {
              label: "Very High Risk",
              color: "hsl(0, 84%, 60%)",
            },
            Unknown: {
              label: "Unknown Risk",
              color: "hsl(0, 0%, 50%)",
            },
          }}
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </ResponsiveContainer>
    </div>
  )
}
