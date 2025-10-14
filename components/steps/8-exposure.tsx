"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Download, Edit } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Papa from "papaparse"

interface ExposureStepProps {
  data: Record<string, any>[] | null
  onNext: () => void
  isPending: boolean
  onAmendmentApplied?: (amendedData: Record<string, any>[]) => void
}

export default function ExposureStep({ data, onNext, isPending, onAmendmentApplied }: ExposureStepProps) {
  const { toast } = useToast()

  if (!data) {
    return <div>Loading data...</div>
  }

  const previewData = data.slice(0, 10)
  const relevantHeaders = [
    "Location Number",
    "Building Value",
    "Building_Value_Final",
    "Contents Value",
    "Contents_Value_Final",
    "Business Interruption",
    "Business_Interruption_Final",
    "Total_Insured_Value_Final",
  ].filter((h) => data[0] && h in data[0])

  const formatCurrency = (value: any) => {
    const num = Number(value)
    if (isNaN(num)) return value
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num)
  }

  const getAllExposureRecords = () => {
    return data.map((row) => ({
      locationNumber: row["Location Number"] || "",
      originalBuildingValue: row["Building Value"] || "",
      buildingValueFinal: row["Building_Value_Final"] || "",
      originalContentsValue: row["Contents Value"] || "",
      contentsValueFinal: row["Contents_Value_Final"] || "",
      originalBusinessInterruption: row["Business Interruption"] || "",
      businessInterruptionFinal: row["Business_Interruption_Final"] || "",
      totalInsuredValueFinal: row["Total_Insured_Value_Final"] || "",
    }))
  }

  const handleExportExposure = () => {
    const exposureRecords = getAllExposureRecords()

    if (exposureRecords.length === 0) {
      toast({
        title: "No Records to Export",
        description: "No exposure records found.",
        variant: "default",
      })
      return
    }

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

    toast({
      title: "Export Successful",
      description: `Exported ${exposureRecords.length} exposure records.`,
    })
  }

  const handleExposureAmendmentUpload = (file: File) => {
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

            let buildingValue = row["Building_Value_Final"]
            let contentsValue = row["Contents_Value_Final"]
            let biValue = row["Business_Interruption_Final"]

            if (amendment.buildingValueFinal !== "" && amendment.buildingValueFinal !== undefined) {
              buildingValue = Number.parseFloat(amendment.buildingValueFinal) || 0
              updatedRow["Building_Value_Final"] = buildingValue
              hasChanges = true
            }
            if (amendment.contentsValueFinal !== "" && amendment.contentsValueFinal !== undefined) {
              contentsValue = Number.parseFloat(amendment.contentsValueFinal) || 0
              updatedRow["Contents_Value_Final"] = contentsValue
              hasChanges = true
            }
            if (amendment.businessInterruptionFinal !== "" && amendment.businessInterruptionFinal !== undefined) {
              biValue = Number.parseFloat(amendment.businessInterruptionFinal) || 0
              updatedRow["Business_Interruption_Final"] = biValue
              hasChanges = true
            }

            if (hasChanges) {
              updatedRow["Total_Insured_Value_Final"] = buildingValue + contentsValue + biValue
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
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Exposure Calculation Complete</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Value fields have been cleaned and Total Insured Value (TIV) has been calculated.
      </p>

      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {relevantHeaders.map((header) => (
                <TableHead key={header} className={header.endsWith("_Final") ? "bg-blue-100 dark:bg-blue-900/50" : ""}>
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
          Export all exposure records for review and amendment, then re-import the corrected data.
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
