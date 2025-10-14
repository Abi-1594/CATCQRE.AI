"use client"

import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Download, Edit, AlertTriangle, CheckCircle2, Zap, BrainCircuit, Sparkles } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import Papa from "papaparse"

interface OccConstCodingStepProps {
  data: Record<string, any>[] | null
  onNext: () => void
  isPending: boolean
  onAmendmentApplied?: (amendedData: Record<string, any>[]) => void
}

export default function OccConstCodingStep({ data, onNext, isPending, onAmendmentApplied }: OccConstCodingStepProps) {
  const { toast } = useToast()

  if (!data) {
    return <div>Loading data...</div>
  }

  const previewData = data.slice(0, 10)
  const relevantHeaders = [
    "Location Number",
    "Construction_Original", // Updated to use the preserved original column
    "Construction",
    "Construction Scheme",
    "Construction Code",
    "Construction Confidence",
    "Occupancy_Original", // Updated to use the preserved original column
    "Occupancy",
    "Occupancy Scheme",
    "Occupancy Code",
    "Occupancy Confidence",
  ].filter((h) => {
    if (h === "Construction_Original" || h === "Occupancy_Original") {
      return data[0] && h in data[0]
    }
    return data[0] && h in data[0]
  })

  const getConfidenceColor = (score: number, threshold: number) => {
    if (score >= 0.9) return "bg-green-500"
    if (score >= threshold) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getMethodIcon = (row: any, type: "construction" | "occupancy") => {
    const method = type === "construction" ? row["_constructionMethod"] : row["_occupancyMethod"]

    switch (method) {
      case "llm-analysis":
        return <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" title="AI Analysis" />
      case "rule-based":
        return <BrainCircuit className="h-4 w-4 text-purple-600 dark:text-purple-400" title="Rule-based Match" />
      case "tfidf-search":
      case "tfidf-fallback":
        return <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-400" title="Semantic Search" />
      case "account-selection":
        return <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" title="Account Selection Rule" />
      default:
        return null
    }
  }

  const getReasoning = (row: any, type: "construction" | "occupancy") => {
    return type === "construction" ? row["_constructionReasoning"] : row["_occupancyReasoning"]
  }

  const getAlternatives = (row: any, type: "construction" | "occupancy") => {
    const alternatives = type === "construction" ? row["_constructionAlternatives"] : row["_occupancyAlternatives"]
    return alternatives || []
  }

  const getLowConfidenceRecords = () => {
    console.log("Checking low confidence records...", data.length)

    const lowConfidenceRecords = data
      .filter((row) => {
        const constConf = row["Construction Confidence"] || 0
        const occConf = row["Occupancy Confidence"] || 0
        const isLowConfidence = constConf < 1.0 || occConf < 1.0

        if (isLowConfidence) {
          console.log("Low confidence record:", row["Location Number"], "Const:", constConf, "Occ:", occConf)
        }

        return isLowConfidence
      })
      .map((row) => ({
        locationNumber: row["Location Number"] || "",
        originalConstruction: row["Construction_Original"] || "", // Updated column name
        originalOccupancy: row["Occupancy_Original"] || "", // Updated column name
        constructionScheme: row["Construction Scheme"] || "",
        constructionCode: row["Construction Code"] || "",
        constructionConfidence: row["Construction Confidence"] || 0,
        constructionMethod: row["_constructionMethod"] || "",
        constructionReasoning: row["_constructionReasoning"] || "",
        occupancyScheme: row["Occupancy Scheme"] || "",
        occupancyCode: row["Occupancy Code"] || "",
        occupancyConfidence: row["Occupancy Confidence"] || 0,
        occupancyMethod: row["_occupancyMethod"] || "",
        occupancyReasoning: row["_occupancyReasoning"] || "",
        amendedConstructionScheme: "",
        amendedConstructionCode: "",
        amendedOccupancyScheme: "",
        amendedOccupancyCode: "",
      }))

    console.log("Low confidence records to export:", lowConfidenceRecords.length)
    return lowConfidenceRecords
  }

  const handleExportAmendments = () => {
    const lowConfidenceRecords = getLowConfidenceRecords()

    if (lowConfidenceRecords.length === 0) {
      toast({
        title: "No Low Confidence Records",
        description: "All records have high confidence scores.",
        variant: "default",
      })
      return
    }

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

    toast({
      title: "Export Successful",
      description: `Exported ${lowConfidenceRecords.length} low confidence records.`,
    })
  }

  const handleAmendmentUpload = (file: File) => {
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

            const updatedRow = { ...row }
            let hasChanges = false

            // Apply construction amendments
            if (amendment.amendedConstructionScheme && amendment.amendedConstructionCode) {
              updatedRow["Construction Scheme"] = amendment.amendedConstructionScheme
              updatedRow["Construction Code"] = amendment.amendedConstructionCode
              updatedRow["Construction Confidence"] = 1.0
              updatedRow["_constructionMethod"] = "manual-amendment"
              hasChanges = true
            }

            // Apply occupancy amendments
            if (amendment.amendedOccupancyScheme && amendment.amendedOccupancyCode) {
              updatedRow["Occupancy Scheme"] = amendment.amendedOccupancyScheme
              updatedRow["Occupancy Code"] = amendment.amendedOccupancyCode
              updatedRow["Occupancy Confidence"] = 1.0
              updatedRow["_occupancyMethod"] = "manual-amendment"
              hasChanges = true
            }

            if (hasChanges) {
              updatedRow["_isAmended"] = true
              amendedCount++
              return updatedRow
            }
          }
          return row
        })

        console.log("Amended count:", amendedCount)

        if (amendedCount > 0) {
          onAmendmentApplied?.(amendedData)
          toast({
            title: "Amendments Applied",
            description: `Successfully applied amendments to ${amendedCount} records.`,
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

  const lowConfidenceCount = getLowConfidenceRecords().length

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
        Occupancy & Construction Coding Complete
      </h2>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Construction and Occupancy fields have been analyzed using AI and mapped to standard schemes. Review the
        confidence scores and reasoning.
      </p>

      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {relevantHeaders.map((header) => (
                <TableHead
                  key={header}
                  className={
                    ![
                      "Construction",
                      "Occupancy",
                      "Location Number",
                      "Construction_Original", // Updated column name
                      "Occupancy_Original", // Updated column name
                    ].includes(header)
                      ? "bg-blue-100 dark:bg-blue-900/50"
                      : ""
                  }
                >
                  {header === "Construction_Original"
                    ? "Construction Original"
                    : header === "Occupancy_Original"
                      ? "Occupancy Original"
                      : header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {relevantHeaders.map((header) => (
                  <TableCell key={header} className="truncate max-w-[200px]">
                    {header === "Construction_Original" ? (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                          {String(row["Construction_Original"] ?? "")}
                        </span>
                        
                      </div>
                    ) : header === "Occupancy_Original" ? (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm text-gray-700 dark:text-gray-300">
                          {String(row["Occupancy_Original"] ?? "")}
                        </span>
                        
                      </div>
                    ) : header.endsWith("Confidence") ? (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="secondary"
                          className={`${getConfidenceColor(row[header], header.includes("Construction") ? 0.7 : 0.7)} text-white`}
                        >
                          {(row[header] * 100).toFixed(0)}%
                        </Badge>
                        {row[header] === 0 && (
                          <Badge variant="destructive" className="text-xs">
                            AI FAILED
                          </Badge>
                        )}
                        {((header.includes("Construction") && row["_constructionNeedsReview"]) ||
                          (header.includes("Occupancy") && row["_occupancyNeedsReview"])) && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" title="Below confidence threshold" />
                        )}
                        {row["_businessRuleApplied"] && (
                          <CheckCircle2 className="h-4 w-4 text-blue-500" title={row["_businessRuleApplied"]} />
                        )}
                        {row["_isAmended"] && (
                          <Edit className="h-4 w-4 text-orange-600 dark:text-orange-400" title="Amended" />
                        )}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              {getMethodIcon(row, header.includes("Construction") ? "construction" : "occupancy")}
                            </TooltipTrigger>
                            <TooltipContent className="max-w-sm">
                              <div className="space-y-2">
                                <p className="font-semibold">Analysis Method:</p>
                                <p className="text-sm">
                                  {getReasoning(row, header.includes("Construction") ? "construction" : "occupancy") ||
                                    "Standard matching applied"}
                                </p>
                                {row[header] === 0 && (
                                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                                    <p className="font-semibold text-xs text-red-700 dark:text-red-300">
                                      Original Input:
                                    </p>
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                      {header.includes("Construction") ? row["Construction"] : row["Occupancy"]}
                                    </p>
                                    <p className="text-xs text-red-500 mt-1">
                                      AI could not find suitable match - manual review required
                                    </p>
                                  </div>
                                )}
                                {getAlternatives(row, header.includes("Construction") ? "construction" : "occupancy")
                                  .length > 0 && (
                                  <div>
                                    <p className="font-semibold text-xs">Alternative matches:</p>
                                    <ul className="text-xs space-y-1">
                                      {getAlternatives(
                                        row,
                                        header.includes("Construction") ? "construction" : "occupancy",
                                      )
                                        .slice(0, 2)
                                        .map((alt: any, idx: number) => (
                                          <li key={idx}>
                                            {alt.scheme} {alt.code} - {alt.description.substring(0, 40)}... (
                                            {(alt.confidence * 100).toFixed(0)}%)
                                          </li>
                                        ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ) : header === "Construction Scheme" || header === "Occupancy Scheme" ? (
                      <div className="flex items-center gap-2">
                        <span>{String(row[header] ?? "")}</span>
                        {(row[header] === "Unknown" || row[header] === "" || !row[header]) && (
                          <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">
                            NEEDS REVIEW
                          </Badge>
                        )}
                      </div>
                    ) : header === "Construction" || header === "Occupancy" ? (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-sm">{String(row[header] ?? "")}</span>
                        <Badge variant="secondary" className="text-xs w-fit">
                          Coded
                        </Badge>
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

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">AI Analysis Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-blue-600" />
            <span>AI Analysis</span>
          </div>
          <div className="flex items-center gap-1">
            <BrainCircuit className="h-3 w-3 text-purple-600" />
            <span>Rule-based</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-blue-500" />
            <span>Semantic Search</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span>Account Selection</span>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
        <h3 className="text-lg font-semibold mb-4">Amendment Center</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Records with confidence below 100% can be exported for manual review and amendment. The export includes AI
          reasoning and alternative matches.
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
          Low confidence records: {lowConfidenceCount} of {data.length}
        </div>
      </div>

      <Button onClick={onNext} disabled={isPending} className="mt-8 w-full sm:w-auto">
        {isPending ? "Processing..." : "Next: Other Modifiers"}
      </Button>
    </div>
  )
}
