"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface HazardAnalysisStepProps {
  data: Record<string, any>[] | null
  onNext: () => void
  isPending: boolean
}

export default function HazardAnalysisStep({ data, onNext, isPending }: HazardAnalysisStepProps) {
  if (!data) {
    return <div>Loading data...</div>
  }

  const previewData = data.slice(0, 10)
  const relevantHeaders = [
    "Location Number",
    "Latitude",
    "Longitude",
    "Geospatial_Key",
    "Flood_Risk",
    "Seismic_Risk",
    "Wildfire_Risk",
  ].filter((h) => data[0] && h in data[0])

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case "very high":
        return "bg-red-600"
      case "high":
        return "bg-orange-500"
      case "moderate":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-400"
    }
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Hazard & Geospatial Analysis Complete</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        A geospatial key has been generated and hazard risks have been assessed for each location.
      </p>

      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {relevantHeaders.map((header) => (
                <TableHead key={header} className={"bg-purple-100 dark:bg-purple-900/50"}>
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {relevantHeaders.map((header) => (
                  <TableCell key={header} className="truncate max-w-[200px]">
                    {header.endsWith("_Risk") ? (
                      <Badge variant="secondary" className={`${getRiskColor(row[header])} text-white`}>
                        {row[header]}
                      </Badge>
                    ) : (
                      String(row[header] ?? "")
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <Button onClick={onNext} disabled={isPending} className="mt-8 w-full sm:w-auto">
        {isPending ? "Processing..." : "Next: Generate Output"}
      </Button>
    </div>
  )
}
