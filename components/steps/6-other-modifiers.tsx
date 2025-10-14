"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Download, Edit } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Papa from "papaparse"

interface OtherModifiersStepProps {
  data: Record<string, any>[] | null
  onNext: () => void
  isPending: boolean
  onAmendmentApplied?: (amendedData: Record<string, any>[]) => void
}

export default function OtherModifiersStep({ data, onNext, isPending, onAmendmentApplied }: OtherModifiersStepProps) {
  const { toast } = useToast()

  if (!data) {
    return <div>Loading data...</div>
  }

  const previewData = data.slice(0, 10)

  const fieldMappings = [
    { original: "Sprinkler Type", final: "Sprinkler_Type_Final" },
    { original: "Year Built", final: "Year_Built_Final" },
    { original: "No. of Buildings", final: "No_of_Buildings_Final" },
    { original: "No. of Stories", final: "No_of_Stories_Final" },
    { original: "Square Footage", final: "Square_Footage_Final" },
  ]

  const displayHeaders: string[] = ["Location Number"]

  fieldMappings.forEach(({ original, final }) => {
    if (data[0]?.[original] !== undefined) {
      displayHeaders.push(original)
    }
    if (data[0]?.[final] !== undefined) {
      displayHeaders.push(final)
    }
  })

  console.log("[v0] Display headers:", displayHeaders)

  const getAllModifierRecords = () => {
    return data.map((row) => ({
      locationNumber: row["Location Number"] || "",
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

    if (modifierRecords.length === 0) {
      toast({
        title: "No Records to Export",
        description: "No modifier records found.",
        variant: "default",
      })
      return
    }

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

    toast({
      title: "Export Successful",
      description: `Exported ${modifierRecords.length} modifier records.`,
    })
  }

  const handleModifierAmendmentUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string
        const result = Papa.parse(csv, { header: true, skipEmptyLines: true })
        const amendments = result.data as Record<string, any>[]

        if (amendments.length === 0) {
          toast({
            title: "Upload Error",
            description: "No valid amendment data found in the file.",
            variant: "destructive",
          })
          return
        }

        const amendedData = data.map((row) => {
          const amendment = amendments.find((a) => a.locationNumber === String(row["Location Number"]))
          if (amendment) {
            const updatedRow = { ...row }
            let hasChanges = false

            fieldMappings.forEach(({ original, final }) => {
              if (amendment[final] !== "" && amendment[final] !== undefined) {
                updatedRow[final] = Number.parseInt(amendment[final]) || 0
                hasChanges = true
              }
            })

            if (hasChanges) {
              updatedRow["_isAmended"] = true
              return updatedRow
            }
          }
          return row
        })

        onAmendmentApplied?.(amendedData)

        const amendedCount = amendedData.filter((row) => row._isAmended).length
        toast({
          title: "Amendments Applied",
          description: `Successfully applied amendments to ${amendedCount} records.`,
        })
      } catch (error) {
        toast({
          title: "Upload Error",
          description: "Failed to process the amendment file. Please check the file format.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Other Modifiers Coding Complete</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Additional fields have been processed and standardized. Original and processed values are shown side by side.
      </p>

      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {displayHeaders.map((header) => (
                <TableHead
                  key={header}
                  className={
                    header.endsWith("_Final")
                      ? "bg-blue-100 dark:bg-blue-900/50"
                      : header === "Location Number"
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-100 dark:bg-gray-800"
                  }
                >
                  {header === "Location Number"
                    ? "Location #"
                    : header.endsWith("_Final")
                      ? header.replace("_Final", " (Final)").replace("_", " ")
                      : header}
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
