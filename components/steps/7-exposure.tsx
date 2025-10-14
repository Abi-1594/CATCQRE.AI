"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Download, Edit } from "lucide-react"
import Papa from "papaparse"

interface ExposureStepProps {
  data: Record<string, any>[] | null
  onNext: () => void
  isPending: boolean
  onAmendmentApplied?: (amendedData: Record<string, any>[]) => void
}

export default function ExposureStep({ data, onNext, isPending, onAmendmentApplied }: ExposureStepProps) {
  if (!data) {
    return <div>Loading data...</div>
  }

  const previewData = data.slice(0, 10)
  const relevantHeaders = [
    "Location Number",
    "Building Value",
    "Building_Value_Final",
    "Building_Value_Total_Final",
    "Contents Value",
    "Contents_Value_Final",
    "Contents_Value_Total_Final",
    "Business Interruption",
    "Business_Interruption_Final",
    "Business_Interruption_Total_Final",
    "Total_Insured_Value_Final",
  ].filter((h) => data[0] && h in data[0])

  const formatCurrency = (value: any) => {
    const num = Number(value)
    if (isNaN(num)) return value
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num)
  }

  const getAllExposureRecords = () => {
    return data.map((row) => ({
      locationNumber: row["Location Number"],
      originalBuildingValue: row["Building Value"] || "",
      buildingValueFinal: row["Building_Value_Final"] || "",
      buildingValueTotal: row["Building_Value_Total_Final"] || "",
      originalContentsValue: row["Contents Value"] || "",
      contentsValueFinal: row["Contents_Value_Final"] || "",
      contentsValueTotal: row["Contents_Value_Total_Final"] || "",
      originalBusinessInterruption: row["Business Interruption"] || "",
      businessInterruptionFinal: row["Business_Interruption_Final"] || "",
      businessInterruptionTotal: row["Business_Interruption_Total_Final"] || "",
      totalInsuredValueFinal: row["Total_Insured_Value_Final"] || "",
    }))
  }

  const handleExportExposure = () => {
    const exposureRecords = getAllExposureRecords()
    const csvContent = Papa.unparse(exposureRecords)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "exposure_amendments.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExposureAmendmentUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const csv = e.target?.result as string
      const result = Papa.parse(csv, { header: true, skipEmptyLines: true })
      const amendments = result.data as Record<string, any>[]

      // Apply amendments to data
      const amendedData = data.map((row) => {
        const amendment = amendments.find((a) => a.locationNumber === row["Location Number"])
        if (amendment) {
          const buildingValueTotal =
            amendment.buildingValueTotal !== ""
              ? Number.parseFloat(amendment.buildingValueTotal)
              : row["Building_Value_Total_Final"]
          const contentsValueTotal =
            amendment.contentsValueTotal !== ""
              ? Number.parseFloat(amendment.contentsValueTotal)
              : row["Contents_Value_Total_Final"]
          const biValueTotal =
            amendment.businessInterruptionTotal !== ""
              ? Number.parseFloat(amendment.businessInterruptionTotal)
              : row["Business_Interruption_Total_Final"]

          return {
            ...row,
            Building_Value_Total_Final: buildingValueTotal,
            Contents_Value_Total_Final: contentsValueTotal,
            Business_Interruption_Total_Final: biValueTotal,
            Total_Insured_Value_Final: buildingValueTotal + contentsValueTotal + biValueTotal,
            _isAmended: true,
          }
        }
        return row
      })

      onAmendmentApplied?.(amendedData)
    }
    reader.readAsText(file)
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Exposure Calculation Complete</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Value fields have been cleaned and Total Insured Value (TIV) has been calculated. Multiple value columns have
        been summed into totals.
      </p>

      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {relevantHeaders.map((header) => (
                <TableHead
                  key={header}
                  className={
                    header.endsWith("_Total_Final") || header === "Total_Insured_Value_Final"
                      ? "bg-yellow-100 dark:bg-yellow-900/50 font-bold"
                      : header.endsWith("_Final")
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
                    <div className="flex items-center gap-2">
                      {row._isAmended && header.endsWith("_Final") && (
                        <Edit className="h-4 w-4 text-orange-600 dark:text-orange-400" title="Amended" />
                      )}
                      {header.endsWith("_Final") ||
                      header.startsWith("Building Value") ||
                      header.startsWith("Contents Value") ||
                      header.startsWith("Business Interruption")
                        ? formatCurrency(row[header])
                        : String(row[header] ?? "")}
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4">Exposure Amendment Center</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Export all exposure records for review and amendment, then re-import the corrected data. Total values are
          calculated by summing all individual value columns.
        </p>

        <div className="flex gap-4 mb-4">
          <Button variant="outline" onClick={handleExportExposure}>
            <Download className="mr-2 h-4 w-4" />
            Export All Exposures
          </Button>

          <div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleExposureAmendmentUpload(e.target.files[0])}
              className="hidden"
              id="exposure-amendment-upload"
            />
            <Button variant="outline" onClick={() => document.getElementById("exposure-amendment-upload")?.click()}>
              <Edit className="mr-2 h-4 w-4" />
              Upload Exposure Amendments
            </Button>
          </div>
        </div>
      </div>

      <Button onClick={onNext} disabled={isPending} className="mt-8 w-full sm:w-auto">
        {isPending ? "Processing..." : "Next: Hazard & Geospatial Analysis"}
      </Button>
    </div>
  )
}
