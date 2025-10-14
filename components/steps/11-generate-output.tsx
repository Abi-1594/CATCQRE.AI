"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import Papa from "papaparse"
import { useState, useEffect } from "react"

interface GenerateOutputStepProps {
  data: Record<string, any>[] | null
  csvData: string | null
  finalHeaders: string[]
}

export default function GenerateOutputStep({ data, csvData, finalHeaders }: GenerateOutputStepProps) {
  const [generatedCsvData, setGeneratedCsvData] = useState<string | null>(csvData)

  useEffect(() => {
    if (!generatedCsvData && data && finalHeaders) {
      // Generate CSV data automatically
      const finalData = data.map((row) => {
        const orderedRow: Record<string, any> = {}
        for (const header of finalHeaders) {
          if (header in row) {
            orderedRow[header] = row[header]
          }
        }
        return orderedRow
      })

      const csv = Papa.unparse(finalData, { columns: finalHeaders })
      setGeneratedCsvData(csv)
    }
  }, [data, finalHeaders, generatedCsvData])

  const handleDownload = () => {
    const dataToDownload = generatedCsvData || csvData
    if (!dataToDownload) return
    const blob = new Blob([dataToDownload], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", "catscrub_output.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const previewData = data ? data.slice(0, 10) : []
  const displayHeaders = finalHeaders.filter((h) => data && data[0] && h in data[0])

  return (
    <div className="w-full">
      {data ? (
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Final Output Preview</h2>
          <Button onClick={handleDownload} disabled={!csvData && !generatedCsvData}>
            <Download className="mr-2 h-4 w-4" />
            Download File
          </Button>
        </div>
      ) : (
        <div>Loading data...</div>
      )}
      {data && (
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Your file is ready. Below is a preview of the final output, including your original mapped columns.
        </p>
      )}

      {data && (
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {displayHeaders.map((header) => (
                  <TableHead
                    key={header}
                    className="bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 font-bold"
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
                      {String(row[header] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </div>
  )
}
