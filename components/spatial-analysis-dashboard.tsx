"use client"

import { useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import FileUploadStep from "./steps/1-file-upload"
import { processFile } from "@/app/actions"
import { useToast } from "@/components/ui/use-toast"
import TivByStateChart from "./charts/tiv-by-state-chart"
import RiskDistributionChart from "./charts/risk-distribution-chart"

// Dynamically import the MapView to prevent SSR issues with Leaflet
const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] w-full bg-gray-200 animate-pulse rounded-md flex items-center justify-center">
      Loading Map...
    </div>
  ),
})

interface SpatialAnalysisDashboardProps {
  currentPortfolio: Record<string, any>[] | null
}

export default function SpatialAnalysisDashboard({ currentPortfolio }: SpatialAnalysisDashboardProps) {
  const [previousPortfolio, setPreviousPortfolio] = useState<Record<string, any>[] | null>(null)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handlePortfolioUpload = (file: File) => {
    startTransition(async () => {
      const result = await processFile(file)
      if (result.error) {
        toast({ title: "Error processing portfolio", description: result.error, variant: "destructive" })
      } else {
        setPreviousPortfolio(result.data)
        toast({
          title: "Previous portfolio loaded",
          description: `Loaded ${result.data.length} locations for comparison.`,
        })
      }
    })
  }

  if (!currentPortfolio) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data to Analyze</CardTitle>
          <CardDescription>
            Please complete the data processing workflow on the "Workflow" tab to view your spatial analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-12 text-center text-gray-500">
            Your interactive map and charts will appear here once your file is processed.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Geospatial Exposure Map</CardTitle>
            <CardDescription>
              Current portfolio (blue) vs. previous portfolio (grey). Circle size represents Total Insured Value (TIV).
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2 pr-2 sm:pl-4 sm:pr-4">
            <MapView currentData={currentPortfolio} previousData={previousPortfolio} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>TIV by State</CardTitle>
            </CardHeader>
            <CardContent>
              <TivByStateChart data={currentPortfolio} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Locations by Flood Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <RiskDistributionChart data={currentPortfolio} />
            </CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Compare with Previous Portfolio</CardTitle>
          <CardDescription>
            Upload a previous portfolio file (in the same output format) to compare exposures on the map.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FileUploadStep onFileUpload={handlePortfolioUpload} isPending={isPending} />
        </CardContent>
      </Card>
    </div>
  )
}
