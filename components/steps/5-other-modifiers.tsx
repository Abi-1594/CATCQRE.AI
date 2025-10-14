"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Download, Edit } from "lucide-react"
import Papa from "papaparse"

interface OtherModifiersStepProps {
  data: Record<string, any>[] | null
  onNext: () => void
  isPending: boolean
  onAmendmentApplied?: (amendedData: Record<string, any>[]) => void
}

export default function OtherModifiersStep({ data, onNext, isPending, onAmendmentApplied }: OtherModifiersStepProps) {
  if (!data) {
    return <div>Loading data...</div>
  }

  const previewData = data.slice(0, 10)
  const originalHeaders = [
    "Sprinkler Type",
    "Year Built",
    "No. of Buildings",
    "No. of Stories",
    "Square Footage",
  ].filter((h) => data[0] && h in data[0])

  const displayHeaders: string[] = ["Location Number"]
  originalHeaders.forEach((header) => {
    displayHeaders.push(header)
    if (data[0][`${header.replace(/ /g, "_")}_Final`]) {
      displayHeaders.push(`${header.replace(/ /g, "_")}_Final`)
    }
  })

  const getAllModifierRecords = () => {
    return data.map((row) => ({
      locationNumber: row["Location Number"],
      originalSprinklerType: row["Sprinkler Type"] || "",
      sprinklerTypeFinal: row["Sprinkler_Type_Final"] || "",
      originalYearBuilt: row["Year Built"] || "",
      yearBuiltFinal: row["Year_Built_Final"] || "",
      originalNoOfBuildings: row["No. of Buildings"] || "",
      noOfBuildingsFinal: row["No_of_Buildings_Final"] || "",
      originalNoOfStories: row["No. of Stories"] || "",
      noOfStoriesFinal: row["No_of_Stories_Final"] || "",
      originalSquareFootage: row["Square Footage"] || "",
      squareFootageFinal: row["Square_Footage_Final"] || "",
    }))
  }

  const handleExportModifiers = () => {
    const modifierRecords = getAllModifierRecords()
    const csvContent = Papa.unparse(modifierRecords)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "other_modifiers_amendments.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleModifierAmendmentUpload = (file: File) => {
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
            Sprinkler_Type_Final:
              amendment.sprinklerTypeFinal !== ""
                ? Number.parseInt(amendment.sprinklerTypeFinal)
                : row["Sprinkler_Type_Final"],
            Year_Built_Final:
              amendment.yearBuiltFinal !== "" ? Number.parseInt(amendment.yearBuiltFinal) : row["Year_Built_Final"],
            No_of_Buildings_Final:
              amendment.noOfBuildingsFinal !== ""
                ? Number.parseInt(amendment.noOfBuildingsFinal)
                : row["No_of_Buildings_Final"],
            No_of_Stories_Final:
              amendment.noOfStoriesFinal !== ""
                ? Number.parseInt(amendment.noOfStoriesFinal)
                : row["No_of_Stories_Final"],
            Square_Footage_Final:
              amendment.squareFootageFinal !== ""
                ? Number.parseInt(amendment.squareFootageFinal)
                : row["Square_Footage_Final"],
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
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Other Modifiers Coding Complete</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Additional fields have been processed and standardized.</p>

      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {displayHeaders.map((header) => (
                <TableHead key={header} className={header.endsWith("_Final") ? "bg-blue-100 dark:bg-blue-900/50" : ""}>
                  {header}
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
        <h3 className="text-lg font-semibold mb-4">Modifier Amendment Center</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Export all modifier records for review and amendment, then re-import the corrected data.
        </p>

        <div className="flex gap-4 mb-4">
          <Button variant="outline" onClick={handleExportModifiers}>
            <Download className="mr-2 h-4 w-4" />
            Export All Modifiers
          </Button>

          <div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleModifierAmendmentUpload(e.target.files[0])}
              className="hidden"
              id="modifier-amendment-upload"
            />
            <Button variant="outline" onClick={() => document.getElementById("modifier-amendment-upload")?.click()}>
              <Edit className="mr-2 h-4 w-4" />
              Upload Modifier Amendments
            </Button>
          </div>
        </div>
      </div>

      <Button onClick={onNext} disabled={isPending} className="mt-8 w-full sm:w-auto">
        {isPending ? "Processing..." : "Next: CATNET Modifiers"}
      </Button>
    </div>
  )
}
