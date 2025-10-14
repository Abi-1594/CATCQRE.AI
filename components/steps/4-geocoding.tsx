"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { CheckCircle, XCircle, BrainCircuit, Download, Edit } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Papa from "papaparse"

interface GeocodingStepProps {
  data: Record<string, any>[] | null
  onNext: () => void
  isPending: boolean
  onAmendmentApplied?: (amendedData: Record<string, any>[]) => void
}

export default function GeocodingStep({ data, onNext, isPending, onAmendmentApplied }: GeocodingStepProps) {
  const { toast } = useToast()

  if (!data || data.length === 0) {
    return <div>Loading data...</div>
  }

  const previewData = data.slice(0, 10)

  const getDisplayHeaders = () => {
    const allHeaders = Object.keys(data[0])
    const displayHeaders: string[] = []
    const processed = new Set<string>()

    const originalOrder = Object.keys(data[0]).filter(
      (h) => !h.endsWith("_Final") && !["Latitude", "Longitude", "_isCached"].includes(h),
    )

    originalOrder.forEach((header) => {
      if (processed.has(header)) return
      displayHeaders.push(header)
      processed.add(header)

      if (header === "Full Address") {
        const addressParts = [
          "Street_Final",
          "City_Final",
          "County_Final",
          "State_Final",
          "Statecode_Final",
          "Postal_Final",
          "Country_Final",
        ]
        addressParts.forEach((part) => {
          if (allHeaders.includes(part) && !processed.has(part)) {
            displayHeaders.push(part)
            processed.add(part)
          }
        })
      } else {
        const finalHeader = `${header.replace(/ /g, "_")}_Final`
        if (allHeaders.includes(finalHeader) && !processed.has(finalHeader)) {
          displayHeaders.push(finalHeader)
          processed.add(finalHeader)
        }
      }
    })

    if (allHeaders.includes("Latitude")) displayHeaders.push("Latitude")
    if (allHeaders.includes("Longitude")) displayHeaders.push("Longitude")

    allHeaders.forEach((header) => {
      if (!processed.has(header) && !header.startsWith("_")) {
        displayHeaders.push(header)
      }
    })

    return displayHeaders
  }

  const displayHeaders = getDisplayHeaders()

  const getFailedGeocodingRecords = () => {
    console.log("Checking failed geocoding records...", data.length)

    const failedRecords = data
      .filter((row) => {
        const hasLat = row.Latitude !== null && row.Latitude !== undefined && row.Latitude !== ""
        const hasLon = row.Longitude !== null && row.Longitude !== undefined && row.Longitude !== ""
        const failed = !hasLat || !hasLon

        if (failed) {
          console.log("Failed record:", row["Location Number"], "Lat:", row.Latitude, "Lon:", row.Longitude)
        }

        return failed
      })
      .map((row) => {
        console.log("Mapping failed record:", row)
        return {
          locationNumber: row["Location Number"] || "",
          fullAddress: row["Full Address"] || "",
          street: row.Street || "",
          city: row.City || "",
          state: row.State || "",
          postalCode: row["Postal Code"] || "",
          country: row.Country || "",
          streetFinal: row.Street_Final || "",
          cityFinal: row.City_Final || "",
          stateFinal: row.State_Final || "",
          postalFinal: row.Postal_Final || "",
          countryFinal: row.Country_Final || "",
          latitude: "",
          longitude: "",
        }
      })

    console.log("Failed records to export:", failedRecords)
    return failedRecords
  }

  const handleGeocodingAmendmentUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string
        console.log("CSV content:", csv.substring(0, 500))

        const result = Papa.parse(csv, { header: true, skipEmptyLines: true })
        const amendments = result.data as Record<string, any>[]

        console.log("Parsed amendments:", amendments)

        if (amendments.length === 0) {
          toast({
            title: "Upload Error",
            description: "No valid amendment data found in the file.",
            variant: "destructive",
          })
          return
        }

        // Apply amendments to data
        let amendedCount = 0
        const amendedData = data.map((row) => {
          const locationNumber = String(row["Location Number"] || "").trim()
          const amendment = amendments.find((a) => {
            const amendmentLocationNumber = String(a.locationNumber || "").trim()
            return amendmentLocationNumber === locationNumber
          })

          if (amendment) {
            console.log("Found amendment for location:", locationNumber, amendment)

            const lat = amendment.latitude ? Number.parseFloat(String(amendment.latitude)) : null
            const lon = amendment.longitude ? Number.parseFloat(String(amendment.longitude)) : null

            if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
              amendedCount++
              return {
                ...row,
                Street_Final: amendment.streetFinal || row.Street_Final,
                City_Final: amendment.cityFinal || row.City_Final,
                State_Final: amendment.stateFinal || row.State_Final,
                Postal_Final: amendment.postalFinal || row.Postal_Final,
                Country_Final: amendment.countryFinal || row.Country_Final,
                Latitude: lat,
                Longitude: lon,
                _isAmended: true,
              }
            }
          }
          return row
        })

        console.log("Amended count:", amendedCount)

        if (amendedCount > 0) {
          onAmendmentApplied?.(amendedData)
          toast({
            title: "Amendments Applied",
            description: `Successfully applied ${amendedCount} geocoding amendments.`,
          })
        } else {
          toast({
            title: "No Amendments Applied",
            description: "No valid amendments found in the uploaded file.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Upload error:", error)
        toast({
          title: "Upload Error",
          description: "Failed to process the amendment file. Please check the file format.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)
  }

  const handleExportFailedGeocoding = () => {
    const failedRecords = getFailedGeocodingRecords()

    if (failedRecords.length === 0) {
      toast({
        title: "No Failed Records",
        description: "All records have been successfully geocoded.",
        variant: "default",
      })
      return
    }

    const csvContent = Papa.unparse(failedRecords)
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "geocoding_amendments.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Export Successful",
      description: `Exported ${failedRecords.length} failed geocoding records.`,
    })
  }

  const failedCount = getFailedGeocodingRecords().length

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Geocoding & Address Cleansing Complete</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Addresses have been cleansed and geocoded. New columns are highlighted. Cached results are marked with a{" "}
        <BrainCircuit className="inline h-4 w-4 text-purple-600" /> icon.
      </p>

      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {displayHeaders.map((header) => (
                <TableHead
                  key={header}
                  className={
                    header.endsWith("_Final") || ["Latitude", "Longitude"].includes(header)
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
                {displayHeaders.map((header) => (
                  <TableCell key={header} className="truncate max-w-[200px]">
                    <div className="flex items-center gap-2">
                      {header === "Latitude" && row._isCached && (
                        <BrainCircuit className="h-4 w-4 text-purple-600 dark:text-purple-400" title="Cached Result" />
                      )}
                      {header === "Latitude" && row._isAmended && (
                        <Edit className="h-4 w-4 text-orange-600 dark:text-orange-400" title="Amended Result" />
                      )}
                      {row[header] === true ? (
                        <CheckCircle className="text-green-500" />
                      ) : row[header] === false ? (
                        <XCircle className="text-red-500" />
                      ) : (
                        String(row[header] ?? "")
                      )}
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
        <h3 className="text-lg font-semibold mb-4">Geocoding Amendment Center</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Failed geocoding records can be exported for manual coordinate entry and re-imported.
        </p>

        <div className="flex gap-4 mb-4">
          <Button variant="outline" onClick={handleExportFailedGeocoding}>
            <Download className="mr-2 h-4 w-4" />
            Export Failed Geocoding
          </Button>

          <div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleGeocodingAmendmentUpload(e.target.files[0])}
              className="hidden"
              id="geocoding-amendment-upload"
            />
            <Button variant="outline" onClick={() => document.getElementById("geocoding-amendment-upload")?.click()}>
              <Edit className="mr-2 h-4 w-4" />
              Upload Geocoding Amendments
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Failed geocoding records: {failedCount} of {data.length}
        </div>
      </div>

      <Button onClick={onNext} disabled={isPending} className="mt-8 w-full sm:w-auto">
        {isPending ? "Processing..." : "Next: Occupancy & Construction Coding"}
      </Button>
    </div>
  )
}
