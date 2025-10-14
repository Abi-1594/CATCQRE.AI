"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface GenerateOutputStepProps {
  data: Record<string, any>[] | null
  csvData: string | null
  finalHeaders: string[]
}

export default function GenerateOutputStep({ data, csvData, finalHeaders }: GenerateOutputStepProps) {
  if (!data) {
    return <div>Loading data...</div>
  }

  const handleDownload = () => {
    if (!csvData) return
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "catscrub_output.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const previewData = data.slice(0, 10)

  const organizeHeaders = () => {
    const availableHeaders = finalHeaders.filter((h) => data[0] && h in data[0])
    const organizedHeaders: string[] = []

    // Add Location Number first
    if (availableHeaders.includes("Location Number")) {
      organizedHeaders.push("Location Number")
    }

    const buildingValueColumns = [
      "Building Value",
      "Building Value 1",
      "Building Value 2",
      "Building Value 3",
      "Building Value 4",
      "Building Value 5",
      "Building Value 6",
      "Building Value 7",
      "Building Value 8",
      "Building Value 9",
      "Building Value 10",
    ]

    buildingValueColumns.forEach((col) => {
      if (availableHeaders.includes(col)) {
        organizedHeaders.push(col)
      }
    })

    // Add Building_Value_total_final after all building value columns
    if (availableHeaders.includes("Building_Value_total_final")) {
      organizedHeaders.push("Building_Value_total_final")
    }

    const contentColumns = [
      "Content",
      "Content Value",
      "Content Value 1",
      "Content Value 2",
      "Content Value 3",
      "Content Value 4",
      "Content Value 5",
      "Content Value 6",
      "Content Value 7",
      "Content Value 8",
      "Content Value 9",
      "Content Value 10",
    ]

    contentColumns.forEach((col) => {
      if (availableHeaders.includes(col)) {
        organizedHeaders.push(col)
      }
    })

    // Add Content_total_final after all content columns
    if (availableHeaders.includes("Content_total_final")) {
      organizedHeaders.push("Content_total_final")
    }

    const biColumns = [
      "BI",
      "BI Value",
      "BI Value 1",
      "BI Value 2",
      "BI Value 3",
      "BI Value 4",
      "BI Value 5",
      "BI Value 6",
      "BI Value 7",
      "BI Value 8",
      "BI Value 9",
      "BI Value 10",
      "Business Interruption",
      "Business Interruption Value",
      "Business Interruption 1",
      "Business Interruption 2",
    ]

    biColumns.forEach((col) => {
      if (availableHeaders.includes(col)) {
        organizedHeaders.push(col)
      }
    })

    // Add BI_total_final after all BI columns
    if (availableHeaders.includes("BI_total_final")) {
      organizedHeaders.push("BI_total_final")
    }

    // Add any remaining headers that weren't categorized
    const remainingHeaders = availableHeaders.filter((h) => !organizedHeaders.includes(h))
    organizedHeaders.push(...remainingHeaders)

    return organizedHeaders
  }

  const displayHeaders = organizeHeaders()

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Final Output Preview</h2>
        <Button onClick={handleDownload} disabled={!csvData}>
          <Download className="mr-2 h-4 w-4" />
          Download File
        </Button>
      </div>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Your file is ready. Below is a preview of the final output, including Building, Content, and BI values with
        their totals.
      </p>

      <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {displayHeaders.map((header) => (
                <TableHead
                  key={header}
                  className={`font-bold ${
                    header.includes("_total_final")
                      ? "bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {header.includes("_total_final") ? `${header.replace("_total_final", "")} (Total Final)` : header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {displayHeaders.map((header) => (
                  <TableCell
                    key={header}
                    className={`truncate max-w-[200px] ${
                      header.includes("_total_final") ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
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
    </div>
  )
}
