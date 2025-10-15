"use client"

import type React from "react"

import { useState } from "react"
import { UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import type { BusinessRules } from "@/lib/types"
import { accountSelectionOccupancies } from "@/lib/occupancy-account-selection"

interface FileUploadStepProps {
  onFileUpload: (file: File, accountName: string, lineOfBusiness: string, businessRules: BusinessRules) => void
  isPending: boolean
  businessRules?: BusinessRules
  onRulesUpdate?: (rules: BusinessRules) => void
}

const ALLOWED_EXTENSIONS = ["csv", "xlsx", "xls"]
const ALLOWED_MIME_TYPES = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
]

const isFileAllowed = (file: File) => {
  const extension = file.name.split(".").pop()?.toLowerCase()
  return (extension && ALLOWED_EXTENSIONS.includes(extension)) || ALLOWED_MIME_TYPES.includes(file.type)
}

export default function FileUploadStep({ onFileUpload, isPending, businessRules, onRulesUpdate }: FileUploadStepProps) {
  const [file, setFile] = useState<File | null>(null)
  const [accountName, setAccountName] = useState<string>("")
  const [lineOfBusiness, setLineOfBusiness] = useState<string>("Property")
  const [rules, setRules] = useState<BusinessRules>(
    businessRules || {
      maxStoriesThreshold: 3,
      storiesExceededAction: "none",
      minYearBuilt: 1800,
      maxYearBuilt: new Date().getFullYear(),
      invalidYearAction: "none",
      defaultYearBuilt: 1980,
      minSquareFootage: 100,
      invalidSqftAction: "none",
      defaultSquareFootage: 5000,
      occupancyConfidenceThreshold: 0.7,
      constructionConfidenceThreshold: 0.7,
      maxBuildingValue: 100000000,
      maxContentsValue: 50000000,
      maxBIValue: 25000000,
      invalidValueAction: "none",
      defaultOccupancyForMisc: "37",
    },
  )
  const { toast } = useToast()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (isFileAllowed(selectedFile)) {
        setFile(selectedFile)
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a .csv, .xlsx, or .xls file.",
          variant: "destructive",
        })
        event.target.value = ""
      }
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    const droppedFile = event.dataTransfer.files?.[0]
    if (droppedFile) {
      if (isFileAllowed(droppedFile)) {
        setFile(droppedFile)
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a .csv, .xlsx, or .xls file.",
          variant: "destructive",
        })
      }
    }
  }

  const handleRuleChange = (key: keyof BusinessRules, value: any) => {
    const updatedRules = { ...rules, [key]: value }
    setRules(updatedRules)
    if (onRulesUpdate) {
      onRulesUpdate(updatedRules)
    }
  }

  const getSelectedOccupancyDescription = () => {
    const selected = accountSelectionOccupancies.find((occ) => occ.code === rules.defaultOccupancyForMisc)
    return selected ? selected.description : ""
  }

  const handleSubmit = () => {
    if (!accountName.trim()) {
      toast({
        title: "Account Name Required",
        description: "Please enter an account name for the output file.",
        variant: "destructive",
      })
      return
    }
    if (file) {
      onFileUpload(file, accountName, lineOfBusiness, rules)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Upload Your Data File</h2>
        <p className="text-gray-500 dark:text-gray-400">Upload a CSV or Excel file and configure initial settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="account-name" className="text-sm font-medium">
                Account Name *
              </Label>
              <Input
                id="account-name"
                type="text"
                placeholder="Enter account name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">Used for output file naming: AccountName_Location.csv</p>
            </div>

            <div>
              <Label htmlFor="line-of-business" className="text-sm font-medium">
                Line of Business (LOB)
              </Label>
              <Select value={lineOfBusiness} onValueChange={setLineOfBusiness}>
                <SelectTrigger id="line-of-business" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Property">Property</SelectItem>
                  <SelectItem value="Specie">Specie</SelectItem>
                  <SelectItem value="Cargo">Cargo</SelectItem>
                  <SelectItem value="Onshore Energy">Onshore Energy</SelectItem>
                  <SelectItem value="Builder Risk">Builder Risk</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Used for LOB-specific business rules</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Occupancy Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label className="text-sm font-medium">Default Occupancy for Misc/Vacant/Blank</Label>
              <Select
                value={rules.defaultOccupancyForMisc}
                onValueChange={(value) => handleRuleChange("defaultOccupancyForMisc", value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountSelectionOccupancies.map((occ) => (
                    <SelectItem key={occ.code} value={occ.code}>
                      {occ.scheme} {occ.code} - {occ.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Selected: {getSelectedOccupancyDescription()}</p>
              <p className="text-xs text-gray-500 mt-1">
                Applied to: misc, miscellaneous, vacant, blank, empty, unknown, other, n/a, tbd
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* File Upload Section */}
      <Card>
        <CardContent className="pt-6">
          <label
            htmlFor="file-upload"
            className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 text-center hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
            <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-200">
              {file ? file.name : "Drag and drop a file or click to upload"}
            </span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              onChange={handleFileChange}
              accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            />
          </label>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button
          onClick={handleSubmit}
          disabled={!file || !accountName.trim() || isPending}
          className="w-full sm:w-auto px-8"
        >
          {isPending ? "Processing..." : "Start Processing"}
        </Button>
      </div>
    </div>
  )
}
