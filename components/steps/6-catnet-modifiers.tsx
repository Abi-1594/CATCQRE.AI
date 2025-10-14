"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Download, Edit } from "lucide-react"
import Papa from "papaparse"

interface CatnetModifiersStepProps {
  data: Record<string, any>[] | null
  onNext: () => void
  isPending: boolean
  onAmendmentApplied?: (amendedData: Record<string, any>[]) => void
}

export default function CatnetModifiersStep({ data, onNext, isPending, onAmendmentApplied }: CatnetModifiersStepProps) {
  if (!data) {
    return <div>Loading data...</div>
  }

  const previewData = data.slice(0, 10)

  console.log("[v0] Available columns in data:", data[0] ? Object.keys(data[0]) : "No data")

  const expectedColumns = [
    { original: "Year Upgraded", final: "Year_Upgraded_Final" },
    { original: "Roof Type", final: "Roof_Type_Final" },
    { original: "Foundation Type", final: "Foundation_Type_Final" },
    { original: "Cladding Type", final: "Cladding_Type_Final" },
    { original: "Soft Story", final: "Soft_Story_Final" },
    { original: "Tsunami Exposure", final: "Tsunami_Exposure_Final" },
    { original: "Liquefaction Exposure", final: "Liquefaction_Exposure_Final" },
  ]

  const displayHeaders: string[] = ["Location Number"]

  expectedColumns.forEach(({ original, final }) => {
    const hasOriginal = data[0] && original in data[0]
    const hasFinal = data[0] && final in data[0]

    console.log(`[v0] Column check - ${original}: ${hasOriginal}, ${final}: ${hasFinal}`)

    // Always add both original and final columns for comparison
    displayHeaders.push(original)
    displayHeaders.push(final)
  })

  console.log("[v0] Display headers:", displayHeaders)

  const getAllCatnetRecords = () => {
    return data.map((row) => ({
      locationNumber: row["Location Number"],
      originalYearUpgraded: row["Year Upgraded"] || "",
      yearUpgradedFinal: row["Year_Upgraded_Final"] || "",
      originalRoofType: row["Roof Type"] || "",
      roofTypeFinal: row["Roof_Type_Final"] || "",
      originalFoundationType: row["Foundation Type"] || "",
      foundationTypeFinal: row["Foundation_Type_Final"] || "",
      originalCladdingType: row["Cladding Type"] || "",
      claddingTypeFinal: row["Cladding_Type_Final"] || "",
      originalSoftStory: row["Soft Story"] || "",
      softStoryFinal: row["Soft_Story_Final"] || "",
      originalTsunamiExposure: row["Tsunami Exposure"] || "",
      tsunamiExposureFinal: row["Tsunami_Exposure_Final"] || "",
      originalLiquefactionExposure: row["Liquefaction Exposure"] || "",
      liquefactionExposureFinal: row["Liquefaction_Exposure_Final"] || "",
    }))
  }

  const handleExportCatnetModifiers = () => {
    const catnetRecords = getAllCatnetRecords()
    const csvContent = Papa.unparse(catnetRecords)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "catnet_modifiers_amendments.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCatnetAmendmentUpload = (file: File) => {
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
            Year_Upgraded_Final:
              amendment.yearUpgradedFinal !== ""
                ? Number.parseInt(amendment.yearUpgradedFinal)
                : row["Year_Upgraded_Final"],
            Roof_Type_Final: amendment.roofTypeFinal !== "" ? amendment.roofTypeFinal : row["Roof_Type_Final"],
            Foundation_Type_Final:
              amendment.foundationTypeFinal !== "" ? amendment.foundationTypeFinal : row["Foundation_Type_Final"],
            Cladding_Type_Final:
              amendment.claddingTypeFinal !== "" ? amendment.claddingTypeFinal : row["Cladding_Type_Final"],
            Soft_Story_Final:
              amendment.softStoryFinal !== "" ? Number.parseInt(amendment.softStoryFinal) : row["Soft_Story_Final"],
            Tsunami_Exposure_Final:
              amendment.tsunamiExposureFinal !== ""
                ? Number.parseInt(amendment.tsunamiExposureFinal)
                : row["Tsunami_Exposure_Final"],
            Liquefaction_Exposure_Final:
              amendment.liquefactionExposureFinal !== ""
                ? Number.parseInt(amendment.liquefactionExposureFinal)
                : row["Liquefaction_Exposure_Final"],
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
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Secondary Modifiers Coding Complete</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Secondary risk characteristics have been processed and standardized.
      </p>

      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {displayHeaders.map((header) => (
                <TableHead
                  key={header}
                  className={
                    header.endsWith("_Final") ? "bg-blue-100 dark:bg-blue-900/50" : "bg-gray-100 dark:bg-gray-800"
                  }
                >
                  {header.endsWith("_Final") ? `${header.replace("_Final", "")} (Final)` : header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {displayHeaders.map((header) => (
                  <TableCell key={header} className="truncate max-w-[200px]">
                    <div className="flex items-center gap-2">
                      {row._isAmended && header.endsWith("_Final") && (
                        <Edit className="h-4 w-4 text-orange-600 dark:text-orange-400" title="Amended" />
                      )}
                      {String(row[header] ?? "")}
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
        <h3 className="text-lg font-semibold mb-4">CATNET Amendment Center</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Export all CATNET modifier records for review and amendment, then re-import the corrected data.
        </p>

        <div className="flex gap-4 mb-4">
          <Button variant="outline" onClick={handleExportCatnetModifiers}>
            <Download className="mr-2 h-4 w-4" />
            Export All CATNET Modifiers
          </Button>

          <div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleCatnetAmendmentUpload(e.target.files[0])}
              className="hidden"
              id="catnet-amendment-upload"
            />
            <Button variant="outline" onClick={() => document.getElementById("catnet-amendment-upload")?.click()}>
              <Edit className="mr-2 h-4 w-4" />
              Upload CATNET Amendments
            </Button>
          </div>
        </div>
      </div>

      <Button onClick={onNext} disabled={isPending} className="mt-8 w-full sm:w-auto">
        {isPending ? "Processing..." : "Next: Exposure"}
      </Button>
    </div>
  )
}
