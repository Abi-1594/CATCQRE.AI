"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Download, Edit } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Papa from "papaparse"

interface CatnetModifiersStepProps {
  data: Record<string, any>[] | null
  onNext: () => void
  isPending: boolean
  onAmendmentApplied?: (amendedData: Record<string, any>[]) => void
}

export default function CatnetModifiersStep({ data, onNext, isPending, onAmendmentApplied }: CatnetModifiersStepProps) {
  const { toast } = useToast()

  if (!data) {
    return <div>Loading data...</div>
  }

  const previewData = data.slice(0, 10)
  const originalHeaders = [
    "Year Upgraded",
    "Roof Type",
    "Foundation Type",
    "Cladding Type",
    "Soft Story",
    "Tsunami Exposure",
    "Liquefaction Exposure",
  ].filter((h) => data[0] && h in data[0])

  const displayHeaders: string[] = ["Location Number"]
  originalHeaders.forEach((header) => {
    displayHeaders.push(header)
    const finalHeader = `${header.replace(/ /g, "_")}_Final`
    if (data[0] && finalHeader in data[0]) {
      displayHeaders.push(finalHeader)
    }
  })

  const getAllCatnetRecords = () => {
    return data.map((row) => ({
      locationNumber: row["Location Number"] || "",
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

    if (catnetRecords.length === 0) {
      toast({
        title: "No Records to Export",
        description: "No CATNET modifier records found.",
        variant: "default",
      })
      return
    }

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

    toast({
      title: "Export Successful",
      description: `Exported ${catnetRecords.length} CATNET modifier records.`,
    })
  }

  const handleCatnetAmendmentUpload = (file: File) => {
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

        // Apply amendments to data
        const amendedData = data.map((row) => {
          const amendment = amendments.find((a) => a.locationNumber === String(row["Location Number"]))
          if (amendment) {
            const updatedRow = { ...row }
            let hasChanges = false

            if (amendment.yearUpgradedFinal !== "" && amendment.yearUpgradedFinal !== undefined) {
              updatedRow["Year_Upgraded_Final"] = Number.parseInt(amendment.yearUpgradedFinal) || 0
              hasChanges = true
            }
            if (amendment.roofTypeFinal !== "" && amendment.roofTypeFinal !== undefined) {
              updatedRow["Roof_Type_Final"] = amendment.roofTypeFinal
              hasChanges = true
            }
            if (amendment.foundationTypeFinal !== "" && amendment.foundationTypeFinal !== undefined) {
              updatedRow["Foundation_Type_Final"] = amendment.foundationTypeFinal
              hasChanges = true
            }
            if (amendment.claddingTypeFinal !== "" && amendment.claddingTypeFinal !== undefined) {
              updatedRow["Cladding_Type_Final"] = amendment.claddingTypeFinal
              hasChanges = true
            }
            if (amendment.softStoryFinal !== "" && amendment.softStoryFinal !== undefined) {
              updatedRow["Soft_Story_Final"] = Number.parseInt(amendment.softStoryFinal) || 0
              hasChanges = true
            }
            if (amendment.tsunamiExposureFinal !== "" && amendment.tsunamiExposureFinal !== undefined) {
              updatedRow["Tsunami_Exposure_Final"] = Number.parseInt(amendment.tsunamiExposureFinal) || 0
              hasChanges = true
            }
            if (amendment.liquefactionExposureFinal !== "" && amendment.liquefactionExposureFinal !== undefined) {
              updatedRow["Liquefaction_Exposure_Final"] = Number.parseInt(amendment.liquefactionExposureFinal) || 0
              hasChanges = true
            }

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
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">CATNET Modifiers Coding Complete</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Secondary risk characteristics have been processed and standardized.
      </p>

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
