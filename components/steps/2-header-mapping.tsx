"use client"

import { useState, useMemo, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { CheckCircle, Sparkles, BrainCircuit, Edit, Zap, Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { FieldMapping } from "@/lib/types"
import { MAPPING_FIELDS, MAPPING_ALIASES } from "@/lib/constants"
import { getLearnedHeaders, saveLearnedHeader } from "@/lib/cache"
import { batchMatchHeaders } from "@/lib/llm-header-mapping"
import Fuse from "fuse.js"

interface HeaderMappingStepProps {
  headers: string[]
  data: Record<string, any>[]
  onMap: (mapping: FieldMapping) => void
  isPending: boolean
}

const fuse = new Fuse(MAPPING_FIELDS, {
  includeScore: true,
  threshold: 0.6,
})

const autoMapHeaders = (headers: string[], learnedHeaders: Record<string, string>): FieldMapping => {
  const mapping: FieldMapping = {}
  const availableFields = [...MAPPING_FIELDS]

  // 1. Apply learned headers first
  headers.forEach((header) => {
    if (learnedHeaders[header] && availableFields.includes(learnedHeaders[header])) {
      mapping[learnedHeaders[header] as keyof FieldMapping] = header
      availableFields.splice(availableFields.indexOf(learnedHeaders[header]), 1)
    }
  })

  // 2. Apply alias and fuzzy logic for remaining headers with sequential mapping for values
  const buildingValueHeaders: string[] = []
  const contentsValueHeaders: string[] = []
  const biValueHeaders: string[] = []

  headers
    .filter((h) => !Object.values(mapping).includes(h))
    .forEach((header) => {
      const lowerHeader = header.toLowerCase().trim()
      let bestMatch: string | null = null

      // Check for building value patterns
      const buildingValueAliases = MAPPING_ALIASES["Building Value"] || []
      if (buildingValueAliases.some((alias) => lowerHeader.includes(alias))) {
        buildingValueHeaders.push(header)
        return
      }

      // Check for contents value patterns
      const contentsValueAliases = MAPPING_ALIASES["Contents Value"] || []
      if (contentsValueAliases.some((alias) => lowerHeader.includes(alias))) {
        contentsValueHeaders.push(header)
        return
      }

      // Check for business interruption patterns
      const biValueAliases = MAPPING_ALIASES["Business Interruption"] || []
      if (biValueAliases.some((alias) => lowerHeader.includes(alias))) {
        biValueHeaders.push(header)
        return
      }

      // Regular alias matching for other fields
      for (const field in MAPPING_ALIASES) {
        if (MAPPING_ALIASES[field as keyof typeof MAPPING_ALIASES].includes(lowerHeader)) {
          bestMatch = field
          break
        }
      }

      if (!bestMatch) {
        const results = fuse.search(lowerHeader)
        if (results.length > 0 && results[0].score! < 0.5) {
          bestMatch = results[0].item
        }
      }

      if (bestMatch && availableFields.includes(bestMatch)) {
        mapping[bestMatch as keyof FieldMapping] = header
        availableFields.splice(availableFields.indexOf(bestMatch), 1)
      }
    })

  // 3. Map building value headers sequentially
  buildingValueHeaders.forEach((header, index) => {
    const fieldName = index === 0 ? "Building Value" : `Building Value ${index + 1}`
    if (availableFields.includes(fieldName)) {
      mapping[fieldName as keyof FieldMapping] = header
      availableFields.splice(availableFields.indexOf(fieldName), 1)
    }
  })

  // 4. Map contents value headers sequentially
  contentsValueHeaders.forEach((header, index) => {
    const fieldName = index === 0 ? "Contents Value" : `Contents Value ${index + 1}`
    if (availableFields.includes(fieldName)) {
      mapping[fieldName as keyof FieldMapping] = header
      availableFields.splice(availableFields.indexOf(fieldName), 1)
    }
  })

  // 5. Map business interruption headers sequentially
  biValueHeaders.forEach((header, index) => {
    const fieldName = index === 0 ? "Business Interruption" : `Business Interruption ${index + 1}`
    if (availableFields.includes(fieldName)) {
      mapping[fieldName as keyof FieldMapping] = header
      availableFields.splice(availableFields.indexOf(fieldName), 1)
    }
  })

  return mapping
}

// Group fields by category for better organization
const getFieldGroups = () => {
  return {
    "Core Fields": MAPPING_FIELDS.filter((field) =>
      [
        "Location Number",
        "Loc Name",
        "Full Address",
        "Street",
        "City",
        "County",
        "State",
        "State Code",
        "Postal Code",
        "Country",
      ].includes(field),
    ),
    "Property Details": MAPPING_FIELDS.filter((field) =>
      [
        "Construction",
        "Occupancy",
        "Sprinkler Type",
        "Year Built",
        "No. of Buildings",
        "No. of Stories",
        "Square Footage",
      ].includes(field),
    ),
    "Building Values": MAPPING_FIELDS.filter(
      (field) => field.startsWith("Building Value") || field === "Building Value",
    ),
    "Contents Values": MAPPING_FIELDS.filter(
      (field) => field.startsWith("Contents Value") || field === "Contents Value",
    ),
    "Business Interruption": MAPPING_FIELDS.filter(
      (field) => field.startsWith("Business Interruption") || field === "Business Interruption",
    ),
    "Additional Modifiers": MAPPING_FIELDS.filter((field) =>
      [
        "Year Upgraded",
        "Roof Type",
        "Foundation Type",
        "Cladding Type",
        "Soft Story",
        "Tsunami Exposure",
        "Liquefaction Exposure",
        "Nature of Occupancy",
      ].includes(field),
    ),
  }
}

export default function HeaderMappingStep({ headers, data, onMap, isPending }: HeaderMappingStepProps) {
  const [learnedHeaders, setLearnedHeaders] = useState<Record<string, string>>({})
  const [manualChanges, setManualChanges] = useState<Record<string, string>>({})
  const [llmSuggestions, setLlmSuggestions] = useState<
    Record<string, { field: string | null; confidence: number; reasoning: string }>
  >({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  useEffect(() => {
    setLearnedHeaders(getLearnedHeaders())
  }, [])

  const initialMapping = useMemo(() => autoMapHeaders(headers, learnedHeaders), [headers, learnedHeaders])
  const [mapping, setMapping] = useState<FieldMapping>(initialMapping)

  // Run LLM analysis on component mount
  useEffect(() => {
    if (headers.length > 0 && data.length > 0) {
      analyzeLLMSuggestions()
    }
  }, [headers, data])

  const analyzeLLMSuggestions = async () => {
    setIsAnalyzing(true)
    try {
      const suggestions = await batchMatchHeaders(headers, data)
      setLlmSuggestions(suggestions)

      // Apply LLM suggestions to unmapped headers
      const updatedMapping = { ...mapping }
      const availableFields = [...MAPPING_FIELDS]

      // Remove already mapped fields
      Object.keys(updatedMapping).forEach((key) => {
        const index = availableFields.indexOf(key)
        if (index > -1) availableFields.splice(index, 1)
      })

      // Apply LLM suggestions for unmapped headers
      headers.forEach((header) => {
        const currentField = getMappedField(header)
        if (!currentField && suggestions[header]?.field && suggestions[header].confidence >= 0.6) {
          const suggestedField = suggestions[header].field!
          if (availableFields.includes(suggestedField)) {
            updatedMapping[suggestedField as keyof FieldMapping] = header
            availableFields.splice(availableFields.indexOf(suggestedField), 1)
          }
        }
      })

      setMapping(updatedMapping)
    } catch (error) {
      console.error("LLM analysis failed:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleMappingChange = (field: keyof FieldMapping, header: string) => {
    const newMapping = { ...mapping }
    // Unset previous mapping for this header
    Object.keys(newMapping).forEach((key) => {
      if (newMapping[key as keyof FieldMapping] === header) {
        delete newMapping[key as keyof FieldMapping]
      }
    })
    // Set new mapping
    if (field !== "none") {
      newMapping[field] = header
      saveLearnedHeader(header, field) // Learn this new mapping

      // Track if this was a manual change (not auto-mapped)
      if (!initialMapping[field] || initialMapping[field] !== header) {
        setManualChanges((prev) => ({ ...prev, [header]: field }))
      }
    } else {
      delete newMapping[field]
    }
    setMapping(newMapping)
  }

  const getMappedField = (header: string) => {
    return Object.keys(mapping).find((key) => mapping[key as keyof FieldMapping] === header) || null
  }

  const getHeaderIcon = (header: string) => {
    const mappedField = getMappedField(header)
    const isManualChange = manualChanges[header] === mappedField
    const isLearned = learnedHeaders[header] === mappedField
    const isAutoMapped = initialMapping[mappedField as keyof FieldMapping] === header && !isLearned && !isManualChange
    const llmSuggestion = llmSuggestions[header]
    const isLLMSuggested = llmSuggestion?.field === mappedField && llmSuggestion.confidence >= 0.6

    if (isManualChange) {
      return <Edit className="h-4 w-4 text-orange-600 dark:text-orange-400" title="Manual Override" />
    } else if (isLearned) {
      return <BrainCircuit className="h-4 w-4 text-purple-600 dark:text-purple-400" title="Learned" />
    } else if (isLLMSuggested) {
      return <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" title="LLM Suggested" />
    } else if (isAutoMapped) {
      return <Sparkles className="h-4 w-4 text-blue-500 dark:text-blue-400" title="Auto-mapped" />
    } else if (mappedField) {
      return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
    }
    return null
  }

  const getConfidenceBadge = (header: string) => {
    const llmSuggestion = llmSuggestions[header]
    const mappedField = getMappedField(header)

    if (llmSuggestion?.field === mappedField && llmSuggestion.confidence > 0) {
      const confidence = Math.round(llmSuggestion.confidence * 100)
      const variant = confidence >= 80 ? "default" : confidence >= 60 ? "secondary" : "outline"
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger></TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <p className="text-sm">{llmSuggestion.reasoning}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    return null
  }

  const previewData = data.slice(0, 5)
  const fieldGroups = getFieldGroups()

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Map Your Headers</h2>
        {isAnalyzing && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing with AI...
          </div>
        )}
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Match your columns to the required fields. We've applied AI analysis, auto-suggestions, and your learned
        mappings. Multiple value fields are automatically mapped in sequence (Building Value → Building Value 1 →
        Building Value 2, etc.).
      </p>

      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              {headers.map((header) => {
                const mappedField = getMappedField(header)
                return (
                  <TableHead key={header} className={`p-2 ${mappedField ? "bg-green-100 dark:bg-green-900/50" : ""}`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {getHeaderIcon(header)}
                        <span className="font-semibold text-gray-700 dark:text-gray-200">{header}</span>
                        {getConfidenceBadge(header)}
                      </div>
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              {headers.map((header) => (
                <TableCell key={header} className="p-2 align-top">
                  <Select
                    value={getMappedField(header) || "none"}
                    onValueChange={(value) => handleMappingChange(value as keyof FieldMapping, header)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a field..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      <SelectItem value="none">-- Do not map --</SelectItem>
                      {Object.entries(fieldGroups).map(([groupName, fields]) => (
                        <div key={groupName}>
                          <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50 dark:bg-gray-800">
                            {groupName}
                          </div>
                          {fields.map((field) => (
                            <SelectItem key={field} value={field} className="pl-4">
                              {field}
                            </SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              ))}
            </TableRow>
            {previewData.map((row, rowIndex) => (
              <TableRow key={`row-${rowIndex}`}>
                {headers.map((header) => (
                  <TableCell
                    key={`${header}-${rowIndex}`}
                    className="p-2 truncate max-w-[200px] text-sm text-gray-600 dark:text-gray-400"
                  >
                    {String(row[header] ?? "")}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Address Fields</CardTitle>
            <CardDescription className="text-xs">
              Core address and location fields mapped from your data
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs">
            <div className="space-y-1">
              {[
                "Location Number",
                "Loc Name",
                "Full Address",
                "Street",
                "City",
                "County",
                "State",
                "State Code",
                "Postal Code",
                "Country",
              ].map((field) => {
                const mappedHeader = mapping[field as keyof FieldMapping]
                return (
                  <div key={field} className="flex justify-between">
                    <span className="text-gray-600">{field}:</span>
                    <span className={`font-medium ${mappedHeader ? "text-green-600" : "text-gray-400"}`}>
                      {mappedHeader || "Not mapped"}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Property Modifiers</CardTitle>
            <CardDescription className="text-xs">
              Construction, occupancy, and other property characteristics
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs">
            <div className="space-y-1">
              {[
                "Construction",
                "Occupancy",
                "Sprinkler Type",
                "Year Built",
                "No. of Buildings",
                "No. of Stories",
                "Square Footage",
                "Year Upgraded",
                "Roof Type",
                "Foundation Type",
                "Cladding Type",
                "Soft Story",
                "Nature of Occupancy",
              ].map((field) => {
                const mappedHeader = mapping[field as keyof FieldMapping]
                return (
                  <div key={field} className="flex justify-between">
                    <span className="text-gray-600">{field}:</span>
                    <span className={`font-medium ${mappedHeader ? "text-green-600" : "text-gray-400"}`}>
                      {mappedHeader || "Not mapped"}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Value Fields</CardTitle>
            <CardDescription className="text-xs">
              All building, contents, and business interruption value columns
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs">
            <div className="space-y-1">
              {[
                "Building Value",
                "Building Value 1",
                "Building Value 2",
                "Building Value 3",
                "Building Value 4",
                "Building Value 5",
                "Contents Value",
                "Contents Value 1",
                "Contents Value 2",
                "Contents Value 3",
                "Contents Value 4",
                "Contents Value 5",
                "Business Interruption",
                "Business Interruption 1",
                "Business Interruption 2",
                "Business Interruption 3",
                "Business Interruption 4",
                "Business Interruption 5",
              ].map((field) => {
                const mappedHeader = mapping[field as keyof FieldMapping]
                return (
                  <div key={field} className="flex justify-between">
                    <span className="text-gray-600">{field}:</span>
                    <span className={`font-medium ${mappedHeader ? "text-green-600" : "text-gray-400"}`}>
                      {mappedHeader || "Not mapped"}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">Sequential Mapping Logic</h3>
        <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
          <p>• First building value column → "Building Value"</p>
          <p>• Second building value column → "Building Value 1"</p>
          <p>• Third building value column → "Building Value 2"</p>
          <p>• Same logic applies to Contents and Business Interruption values</p>
        </div>

        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2 mt-4">AI Analysis Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-blue-600" />
            <span>AI Suggested</span>
          </div>
          <div className="flex items-center gap-1">
            <BrainCircuit className="h-3 w-3 text-purple-600" />
            <span>Learned</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-blue-500" />
            <span>Auto-mapped</span>
          </div>
          <div className="flex items-center gap-1">
            <Edit className="h-3 w-3 text-orange-600" />
            <span>Manual Override</span>
          </div>
        </div>
      </div>

      <Button onClick={() => onMap(mapping)} disabled={isPending} className="mt-8 w-full sm:w-auto">
        {isPending ? "Processing..." : "Next: Configure Business Rules"}
      </Button>
    </div>
  )
}
