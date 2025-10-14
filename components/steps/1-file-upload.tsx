"use client"

import type React from "react"

import { useState } from "react"
import { UploadCloud } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"

interface FileUploadStepProps {
  onFileUpload: (file: File) => void
  isPending: boolean
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

export default function FileUploadStep({ onFileUpload, isPending }: FileUploadStepProps) {
  const [file, setFile] = useState<File | null>(null)
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
        event.target.value = "" // Reset file input
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

  const handleSubmit = () => {
    if (file) {
      onFileUpload(file)
    }
  }

  return (
    <div className="w-full max-w-2xl text-center">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Upload Your Data File</h2>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Upload a CSV or Excel file (.xlsx, .xls) to begin.</p>
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
      <Button onClick={handleSubmit} disabled={!file || isPending} className="mt-8 w-full sm:w-auto">
        {isPending ? "Processing..." : "Start Processing"}
      </Button>
    </div>
  )
}
