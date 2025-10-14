"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Download, Edit, AlertTriangle, CheckCircle2 } from "lucide-react"
import Papa from "papaparse"
import { useState } from "react"

interface OccConstCodingStepProps {
  data: Record<string, any>[] | null
  onNext: () => void
  isPending: boolean
  onAmendmentApplied?: (amendedData: Record<string, any>[]) => void
}

interface AmendmentData {
  locationNumber: string
  originalConstruction?: string
  originalOccupancy?: string
  amendedConstruction?: string
  amendedOccupancy?: string
}

export default function OccConstCodingStep({ data, onNext, isPending, onAmendmentApplied }: OccConstCodingStepProps) {
  const [showAmendmentExport, setShowAmendmentExport] = useState(false)
  const [amendmentData, setAmendmentData] = useState<AmendmentData[]>([])

  if (!data) {
    return <div>Loading data...</div>
  }

  const previewData = data.slice(0, 10)
  const relevantHeaders = [
    "Location Number",
    "Construction",
    "Construction Scheme",
    "Construction Code",
    "Construction Confidence",
    "Occupancy",
    "Occupancy Scheme",
    "Occupancy Code",
    "Occupancy Confidence",
  ].filter((h) => data[0] && h in data[0])

  const getConfidenceColor = (score: number, threshold: number) => {
    if (score >= 0.9) return "bg-green-500"
    if (score >= threshold) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getLowConfidenceRecords = () => {
    return data
      .filter(
        (row) =>
          (row["Construction Confidence"] && row["Construction Confidence"] < 1.0) ||
          (row["Occupancy Confidence"] && row["Occupancy Confidence"] < 1.0),
      )
      .map((row) => ({
        locationNumber: row["Location Number"],
        originalConstruction: row["Construction"],
        originalOccupancy: row["Occupancy"],
        constructionScheme: row["Construction Scheme"],
        constructionCode: row["Construction Code"],
        constructionConfidence: row["Construction Confidence"],
        occupancyScheme: row["Occupancy Scheme"],
        occupancyCode: row["Occupancy Code"],
        occupancyConfidence: row["Occupancy Confidence"],
      }))
  }

  const handleExportAmendments = () => {
    const lowConfidenceRecords = getLowConfidenceRecords()
    const csvContent = Papa.unparse(lowConfidenceRecords)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "occupancy_construction_amendments.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleAmendmentUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const csv = e.target?.result as string
      const result = Papa.parse(csv, { header: true, skipEmptyLines: true })
      const amendments = result.data as Record<string, any>[]

      // Apply amendments to data
      const amendedData = data.map((row) => {
        const amendment = amendments.find((a) => a.locationNumber === row["Location Number"])
        if (amendment) {
          return {
            ...row,
            "Construction Scheme": amendment.amendedConstructionScheme || row["Construction Scheme"],
            "Construction Code": amendment.amendedConstructionCode || row["Construction Code"],
            "Construction Confidence": amendment.amendedConstructionScheme ? 1.0 : row["Construction Confidence"],
            "Occupancy Scheme": amendment.amendedOccupancyScheme || row["Occupancy Scheme"],
            "Occupancy Code": amendment.amendedOccupancyCode || row["Occupancy Code"],
            "Occupancy Confidence": amendment.amendedOccupancyScheme ? 1.0 : row["Occupancy Confidence"],
          }
        }
        return row
      })

      // Update parent component with amended data
      onAmendmentApplied?.(amendedData)
    }
    reader.readAsText(file)
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
        Occupancy & Construction Coding Complete
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Construction and Occupancy fields have been mapped to standard schemes. Review the confidence scores.
      </p>

      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {relevantHeaders.map((header) => (
                <TableHead
                  key={header}
                  className={
                    !["Construction", "Occupancy", "Location Number"].includes(header)
                      ? "bg-blue-100 dark:bg-blue-900/50"
                      : ""
                  }
                >
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
                    {header.endsWith("Confidence") ? (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`${getConfidenceColor(row[header], header.includes("Construction") ? 0.7 : 0.7)} text-white`}
                        >
                          {(row[header] * 100).toFixed(0)}%
                        </Badge>
                        {((header.includes("Construction") && row["_constructionNeedsReview"]) ||
                          (header.includes("Occupancy") && row["_occupancyNeedsReview"])) && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" title="Below confidence threshold" />
                        )}
                        {row["_businessRuleApplied"] && (
                          <CheckCircle2 className="h-4 w-4 text-blue-500" title={row["_businessRuleApplied"]} />
                        )}
                      </div>
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

      <div className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4">Amendment Center</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Records with confidence below 100% can be exported for manual review and amendment.
        </p>

        <div className="flex gap-4 mb-4">
          <Button variant="outline" onClick={handleExportAmendments}>
            <Download className="mr-2 h-4 w-4" />
            Export Low Confidence Records
          </Button>

          <div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleAmendmentUpload(e.target.files[0])}
              className="hidden"
              id="amendment-upload"
            />
            <Button variant="outline" onClick={() => document.getElementById("amendment-upload")?.click()}>
              <Edit className="mr-2 h-4 w-4" />
              Upload Amendments
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Low confidence records: {getLowConfidenceRecords().length} of {data.length}
        </div>
      </div>

      <Button onClick={onNext} disabled={isPending} className="mt-8 w-full sm:w-auto">
        {isPending ? "Processing..." : "Next: Other Modifiers"}
      </Button>
    </div>
  )
}
