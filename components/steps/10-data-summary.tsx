"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useMemo } from "react"

interface DataSummaryStepProps {
  data: Record<string, any>[] | null
  onNext: () => void
  isPending: boolean
}

export default function DataSummaryStep({ data, onNext, isPending }: DataSummaryStepProps) {
  const summaryStats = useMemo(() => {
    if (!data || data.length === 0) return null

    console.log("[v0] Data summary - first row keys:", data[0] ? Object.keys(data[0]) : "No data")
    console.log("[v0] Data summary - sample row:", data[0])

    const buildingValueColumns = Object.keys(data[0] || {}).filter(
      (key) => key.toLowerCase().includes("building") && key.toLowerCase().includes("value"),
    )
    const contentValueColumns = Object.keys(data[0] || {}).filter(
      (key) =>
        key.toLowerCase().includes("content") &&
        (key.toLowerCase().includes("value") || key.toLowerCase().includes("total")),
    )
    const biValueColumns = Object.keys(data[0] || {}).filter(
      (key) =>
        key.toLowerCase().includes("bi") &&
        (key.toLowerCase().includes("value") || key.toLowerCase().includes("total")),
    )

    console.log("[v0] Building value columns found:", buildingValueColumns)
    console.log("[v0] Content value columns found:", contentValueColumns)
    console.log("[v0] BI value columns found:", biValueColumns)

    const buildingValueCol = buildingValueColumns[0] || "Building_Value_total_final"
    const contentValueCol = contentValueColumns[0] || "Content_total_final"
    const biValueCol = biValueColumns[0] || "BI_total_final"

    // Coverage Profile calculations
    const buildingLocations = data.filter(
      (row) => row[buildingValueCol] && Number.parseFloat(row[buildingValueCol]) > 0,
    ).length
    const contentLocations = data.filter(
      (row) => row[contentValueCol] && Number.parseFloat(row[contentValueCol]) > 0,
    ).length
    const biLocations = data.filter((row) => row[biValueCol] && Number.parseFloat(row[biValueCol]) > 0).length

    const totalBuildingTIV = data.reduce((sum, row) => sum + (Number.parseFloat(row[buildingValueCol]) || 0), 0)
    const totalContentTIV = data.reduce((sum, row) => sum + (Number.parseFloat(row[contentValueCol]) || 0), 0)
    const totalBITIV = data.reduce((sum, row) => sum + (Number.parseFloat(row[biValueCol]) || 0), 0)
    const grandTotalTIV = totalBuildingTIV + totalContentTIV + totalBITIV

    console.log("[v0] TIV calculations:", { totalBuildingTIV, totalContentTIV, totalBITIV, grandTotalTIV })

    // TIV Profile by value bands
    const tivBands = [
      { label: "0k-50k", min: 0, max: 50000 },
      { label: "50k-100k", min: 50000, max: 100000 },
      { label: "100k-250k", min: 100000, max: 250000 },
      { label: "250k-500k", min: 250000, max: 500000 },
      { label: "500k-1m", min: 500000, max: 1000000 },
      { label: "1m-5m", min: 1000000, max: 5000000 },
      { label: "5m-10m", min: 5000000, max: 10000000 },
      { label: "10m-20m", min: 10000000, max: 20000000 },
      { label: "20m-50m", min: 20000000, max: 50000000 },
      { label: "50m+", min: 50000000, max: Number.POSITIVE_INFINITY },
    ]

    const tivProfile = tivBands.map((band) => {
      const locationsInBand = data.filter((row) => {
        const totalTIV =
          (Number.parseFloat(row[buildingValueCol]) || 0) +
          (Number.parseFloat(row[contentValueCol]) || 0) +
          (Number.parseFloat(row[biValueCol]) || 0)
        return totalTIV >= band.min && totalTIV < band.max
      })
      const bandTIV = locationsInBand.reduce((sum, row) => {
        return (
          sum +
          (Number.parseFloat(row[buildingValueCol]) || 0) +
          (Number.parseFloat(row[contentValueCol]) || 0) +
          (Number.parseFloat(row[biValueCol]) || 0)
        )
      }, 0)
      return {
        band: band.label,
        count: locationsInBand.length,
        tiv: bandTIV,
        percentage: grandTotalTIV > 0 ? (bandTIV / grandTotalTIV) * 100 : 0,
      }
    })

    // Geocoding quality
    const geocodedCount = data.filter((row) => row.Latitude && row.Longitude).length
    const ungeocodedCount = data.length - geocodedCount
    const highResCount = data.filter((row) => row.Latitude && row.Longitude && row.Street_Final).length
    const lowResCount = geocodedCount - highResCount

    const geocodedTIV = data
      .filter((row) => row.Latitude && row.Longitude)
      .reduce(
        (sum, row) =>
          sum +
          (Number.parseFloat(row[buildingValueCol]) || 0) +
          (Number.parseFloat(row[contentValueCol]) || 0) +
          (Number.parseFloat(row[biValueCol]) || 0),
        0,
      )
    const ungeocodedTIV = grandTotalTIV - geocodedTIV

    // Calculate Low Resolution TIV (geocoded but not high resolution)
    const lowResTIV = data
      .filter((row) => row.Latitude && row.Longitude && !row.Street_Final)
      .reduce(
        (sum, row) =>
          sum +
          (Number.parseFloat(row[buildingValueCol]) || 0) +
          (Number.parseFloat(row[contentValueCol]) || 0) +
          (Number.parseFloat(row[biValueCol]) || 0),
        0,
      )

    const highResTIV = geocodedTIV - lowResTIV

    // Region breakdown for geocoding
    const usData = data.filter((row) => row.Country === "US" || row.Country === "USA" || row.Country_Final === "US")
    const nonUsModelledData = data.filter(
      (row) =>
        row.Country !== "US" && row.Country !== "USA" && row.Country_Final !== "US" && row.Latitude && row.Longitude,
    )
    const nonUsNonModelledData = data.filter(
      (row) =>
        row.Country !== "US" &&
        row.Country !== "USA" &&
        row.Country_Final !== "US" &&
        (!row.Latitude || !row.Longitude),
    )

    // Primary Modifiers completeness
    const occupancyComplete = data.filter((row) => {
      const occupancyValue = row["Occupancy Code"] || row.Occupancy_Final
      return occupancyValue && occupancyValue !== "Unknown" && occupancyValue !== "" && occupancyValue !== "0"
    }).length
    const occupancyTIV = data
      .filter((row) => {
        const occupancyValue = row["Occupancy Code"] || row.Occupancy_Final
        return occupancyValue && occupancyValue !== "Unknown" && occupancyValue !== "" && occupancyValue !== "0"
      })
      .reduce(
        (sum, row) =>
          sum +
          (Number.parseFloat(row[buildingValueCol]) || 0) +
          (Number.parseFloat(row[contentValueCol]) || 0) +
          (Number.parseFloat(row[biValueCol]) || 0),
        0,
      )

    const constructionComplete = data.filter((row) => {
      const constructionValue = row["Construction Code"] || row.Construction_Final
      return (
        constructionValue && constructionValue !== "Unknown" && constructionValue !== "" && constructionValue !== "0"
      )
    }).length
    const constructionTIV = data
      .filter((row) => {
        const constructionValue = row["Construction Code"] || row.Construction_Final
        return (
          constructionValue && constructionValue !== "Unknown" && constructionValue !== "" && constructionValue !== "0"
        )
      })
      .reduce(
        (sum, row) =>
          sum +
          (Number.parseFloat(row[buildingValueCol]) || 0) +
          (Number.parseFloat(row[contentValueCol]) || 0) +
          (Number.parseFloat(row[biValueCol]) || 0),
        0,
      )

    const yearBuiltComplete = data.filter(
      (row) => row.Year_Built_Final && Number.parseInt(row.Year_Built_Final) > 1800,
    ).length
    const yearBuiltTIV = data
      .filter((row) => row.Year_Built_Final && Number.parseInt(row.Year_Built_Final) > 1800)
      .reduce(
        (sum, row) =>
          sum +
          (Number.parseFloat(row[buildingValueCol]) || 0) +
          (Number.parseFloat(row[contentValueCol]) || 0) +
          (Number.parseFloat(row[biValueCol]) || 0),
        0,
      )

    const storiesComplete = data.filter(
      (row) => row.No_of_Stories_Final && Number.parseInt(row.No_of_Stories_Final) > 0,
    ).length
    const storiesTIV = data
      .filter((row) => row.No_of_Stories_Final && Number.parseInt(row.No_of_Stories_Final) > 0)
      .reduce(
        (sum, row) =>
          sum +
          (Number.parseFloat(row[buildingValueCol]) || 0) +
          (Number.parseFloat(row[contentValueCol]) || 0) +
          (Number.parseFloat(row[biValueCol]) || 0),
        0,
      )

    console.log("[v0] Modifier completeness:", {
      occupancyComplete,
      constructionComplete,
      yearBuiltComplete,
      storiesComplete,
      occupancyTIV,
      constructionTIV,
    })

    return {
      coverage: {
        buildings: {
          count: buildingLocations,
          tiv: totalBuildingTIV,
          percentage: grandTotalTIV > 0 ? (totalBuildingTIV / grandTotalTIV) * 100 : 0,
        },
        contents: {
          count: contentLocations,
          tiv: totalContentTIV,
          percentage: grandTotalTIV > 0 ? (totalContentTIV / grandTotalTIV) * 100 : 0,
        },
        bi: {
          count: biLocations,
          tiv: totalBITIV,
          percentage: grandTotalTIV > 0 ? (totalBITIV / grandTotalTIV) * 100 : 0,
        },
        total: grandTotalTIV,
      },
      tivProfile,
      geocoding: {
        regions: [
          {
            name: "US",
            ungeocoded: {
              count: usData.filter((row) => !row.Latitude || !row.Longitude).length,
              tiv: usData
                .filter((row) => !row.Latitude || !row.Longitude)
                .reduce(
                  (sum, row) =>
                    sum +
                    (Number.parseFloat(row[buildingValueCol]) || 0) +
                    (Number.parseFloat(row[contentValueCol]) || 0) +
                    (Number.parseFloat(row[biValueCol]) || 0),
                  0,
                ),
              percentage: 0,
            },
            lowRes: {
              count: usData.filter((row) => row.Latitude && row.Longitude && !row.Street_Final).length,
              tiv: usData
                .filter((row) => row.Latitude && row.Longitude && !row.Street_Final)
                .reduce(
                  (sum, row) =>
                    sum +
                    (Number.parseFloat(row[buildingValueCol]) || 0) +
                    (Number.parseFloat(row[contentValueCol]) || 0) +
                    (Number.parseFloat(row[biValueCol]) || 0),
                  0,
                ),
              percentage: 0,
            },
            highRes: {
              count: usData.filter((row) => row.Latitude && row.Longitude && row.Street_Final).length,
              tiv: usData
                .filter((row) => row.Latitude && row.Longitude && row.Street_Final)
                .reduce(
                  (sum, row) =>
                    sum +
                    (Number.parseFloat(row[buildingValueCol]) || 0) +
                    (Number.parseFloat(row[contentValueCol]) || 0) +
                    (Number.parseFloat(row[biValueCol]) || 0),
                  0,
                ),
              percentage: 0,
            },
            target: 99,
          },
          {
            name: "Non-US (Modelled)",
            ungeocoded: {
              count: nonUsModelledData.filter((row) => !row.Latitude || !row.Longitude).length,
              tiv: nonUsModelledData
                .filter((row) => !row.Latitude || !row.Longitude)
                .reduce(
                  (sum, row) =>
                    sum +
                    (Number.parseFloat(row[buildingValueCol]) || 0) +
                    (Number.parseFloat(row[contentValueCol]) || 0) +
                    (Number.parseFloat(row[biValueCol]) || 0),
                  0,
                ),
              percentage: 0,
            },
            lowRes: {
              count: nonUsModelledData.filter((row) => row.Latitude && row.Longitude && !row.Street_Final).length,
              tiv: nonUsModelledData
                .filter((row) => row.Latitude && row.Longitude && !row.Street_Final)
                .reduce(
                  (sum, row) =>
                    sum +
                    (Number.parseFloat(row[buildingValueCol]) || 0) +
                    (Number.parseFloat(row[contentValueCol]) || 0) +
                    (Number.parseFloat(row[biValueCol]) || 0),
                  0,
                ),
              percentage: 0,
            },
            highRes: {
              count: nonUsModelledData.filter((row) => row.Latitude && row.Longitude && row.Street_Final).length,
              tiv: nonUsModelledData
                .filter((row) => row.Latitude && row.Longitude && row.Street_Final)
                .reduce(
                  (sum, row) =>
                    sum +
                    (Number.parseFloat(row[buildingValueCol]) || 0) +
                    (Number.parseFloat(row[contentValueCol]) || 0) +
                    (Number.parseFloat(row[biValueCol]) || 0),
                  0,
                ),
              percentage: 0,
            },
            target: 95,
          },
          {
            name: "Non-US (Non-Modelled)",
            ungeocoded: {
              count: nonUsNonModelledData.length,
              tiv: nonUsNonModelledData.reduce(
                (sum, row) =>
                  sum +
                  (Number.parseFloat(row[buildingValueCol]) || 0) +
                  (Number.parseFloat(row[contentValueCol]) || 0) +
                  (Number.parseFloat(row[biValueCol]) || 0),
                0,
              ),
              percentage: 0,
            },
            lowRes: { count: 0, tiv: 0, percentage: 0 },
            highRes: { count: 0, tiv: 0, percentage: 0 },
            target: 80,
          },
        ],
      },
      modifiers: {
        occupancy: {
          count: occupancyComplete,
          tiv: occupancyTIV,
          percentage: grandTotalTIV > 0 ? (occupancyTIV / grandTotalTIV) * 100 : 0,
          target: 100,
        },
        construction: {
          count: constructionComplete,
          tiv: constructionTIV,
          percentage: grandTotalTIV > 0 ? (constructionTIV / grandTotalTIV) * 100 : 0,
          target: 100,
        },
        yearBuilt: {
          count: yearBuiltComplete,
          tiv: yearBuiltTIV,
          percentage: grandTotalTIV > 0 ? (yearBuiltTIV / grandTotalTIV) * 100 : 0,
          target: 85,
        },
        stories: {
          count: storiesComplete,
          tiv: storiesTIV,
          percentage: grandTotalTIV > 0 ? (storiesTIV / grandTotalTIV) * 100 : 0,
          target: 100,
        },
      },
    }
  }, [data])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  if (!data || !summaryStats) {
    return <div>Loading data...</div>
  }

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Data Summary</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Review the final data quality and coverage statistics before generating the output file.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coverage Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold bg-blue-900 text-white p-2 rounded">Coverage Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-blue-800 text-white">Coverage</TableHead>
                  <TableHead className="bg-blue-800 text-white">Loc Count</TableHead>
                  <TableHead className="bg-blue-800 text-white">TIV</TableHead>
                  <TableHead className="bg-blue-800 text-white">TIV%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Buildings + Structures</TableCell>
                  <TableCell>{summaryStats.coverage.buildings.count.toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(summaryStats.coverage.buildings.tiv)}</TableCell>
                  <TableCell>{formatPercentage(summaryStats.coverage.buildings.percentage)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Contents</TableCell>
                  <TableCell>{summaryStats.coverage.contents.count.toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(summaryStats.coverage.contents.tiv)}</TableCell>
                  <TableCell>{formatPercentage(summaryStats.coverage.contents.percentage)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">BI</TableCell>
                  <TableCell>{summaryStats.coverage.bi.count.toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(summaryStats.coverage.bi.tiv)}</TableCell>
                  <TableCell>{formatPercentage(summaryStats.coverage.bi.percentage)}</TableCell>
                </TableRow>
                <TableRow className="bg-blue-100 dark:bg-blue-900/20">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="font-bold"></TableCell>
                  <TableCell className="font-bold">{formatCurrency(summaryStats.coverage.total)}</TableCell>
                  <TableCell className="font-bold"></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* TIV Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold bg-blue-900 text-white p-2 rounded">TIV Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-blue-800 text-white">LOC TIV</TableHead>
                  <TableHead className="bg-blue-800 text-white">Loc Count</TableHead>
                  <TableHead className="bg-blue-800 text-white">TIV</TableHead>
                  <TableHead className="bg-blue-800 text-white">TIV%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryStats.tivProfile.map((band, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{band.band}</TableCell>
                    <TableCell>{band.count.toLocaleString()}</TableCell>
                    <TableCell>{formatCurrency(band.tiv)}</TableCell>
                    <TableCell>{formatPercentage(band.percentage)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Geocoding Quality */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold bg-blue-900 text-white p-2 rounded">Geocoding</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-blue-800 text-white">Region</TableHead>
                  <TableHead className="bg-blue-800 text-white">Ungeocoded</TableHead>
                  <TableHead className="bg-blue-800 text-white"></TableHead>
                  <TableHead className="bg-blue-800 text-white"></TableHead>
                  <TableHead className="bg-blue-800 text-white">Low Resolution</TableHead>
                  <TableHead className="bg-blue-800 text-white"></TableHead>
                  <TableHead className="bg-blue-800 text-white"></TableHead>
                  <TableHead className="bg-blue-800 text-white">High Resolution</TableHead>
                  <TableHead className="bg-blue-800 text-white"></TableHead>
                  <TableHead className="bg-blue-800 text-white"></TableHead>
                  <TableHead className="bg-purple-600 text-white">High Resolution Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaryStats.geocoding.regions.map((region, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{region.name}</TableCell>
                    <TableCell>{region.ungeocoded.count}</TableCell>
                    <TableCell>{formatCurrency(region.ungeocoded.tiv)}</TableCell>
                    <TableCell>{formatPercentage(region.ungeocoded.percentage)}</TableCell>
                    <TableCell>{region.lowRes.count}</TableCell>
                    <TableCell>{region.lowRes.tiv > 0 ? formatCurrency(region.lowRes.tiv) : "-"}</TableCell>
                    <TableCell>
                      {region.lowRes.tiv > 0 ? formatPercentage(region.lowRes.percentage) : "0.00%"}
                    </TableCell>
                    <TableCell>{region.highRes.count}</TableCell>
                    <TableCell>{formatCurrency(region.highRes.tiv)}</TableCell>
                    <TableCell>{formatPercentage(region.highRes.percentage)}</TableCell>
                    <TableCell className="bg-purple-100 dark:bg-purple-900/20">{region.target}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Primary Modifiers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold bg-blue-900 text-white p-2 rounded">
              Primary Modifiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-blue-800 text-white">Modifier</TableHead>
                  <TableHead className="bg-blue-800 text-white">Loc Count</TableHead>
                  <TableHead className="bg-blue-800 text-white">TIV</TableHead>
                  <TableHead className="bg-blue-800 text-white">TIV%</TableHead>
                  <TableHead className="bg-purple-600 text-white">Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Occupancy</TableCell>
                  <TableCell>{summaryStats.modifiers.occupancy.count.toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(summaryStats.modifiers.occupancy.tiv)}</TableCell>
                  <TableCell
                    className={
                      summaryStats.modifiers.occupancy.percentage >= 98 ? "text-green-600 font-bold" : "text-red-600"
                    }
                  >
                    {formatPercentage(summaryStats.modifiers.occupancy.percentage)}
                  </TableCell>
                  <TableCell className="bg-purple-100 dark:bg-purple-900/20">
                    {summaryStats.modifiers.occupancy.target}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Construction</TableCell>
                  <TableCell>{summaryStats.modifiers.construction.count.toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(summaryStats.modifiers.construction.tiv)}</TableCell>
                  <TableCell
                    className={
                      summaryStats.modifiers.construction.percentage >= 98 ? "text-green-600 font-bold" : "text-red-600"
                    }
                  >
                    {formatPercentage(summaryStats.modifiers.construction.percentage)}
                  </TableCell>
                  <TableCell className="bg-purple-100 dark:bg-purple-900/20">
                    {summaryStats.modifiers.construction.target}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Year Built</TableCell>
                  <TableCell>{summaryStats.modifiers.yearBuilt.count.toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(summaryStats.modifiers.yearBuilt.tiv)}</TableCell>
                  <TableCell
                    className={
                      summaryStats.modifiers.yearBuilt.percentage >= 85 ? "text-green-600 font-bold" : "text-red-600"
                    }
                  >
                    {formatPercentage(summaryStats.modifiers.yearBuilt.percentage)}
                  </TableCell>
                  <TableCell className="bg-purple-100 dark:bg-purple-900/20">
                    {summaryStats.modifiers.yearBuilt.target}%
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">No of Storeys</TableCell>
                  <TableCell>{summaryStats.modifiers.stories.count.toLocaleString()}</TableCell>
                  <TableCell>{formatCurrency(summaryStats.modifiers.stories.tiv)}</TableCell>
                  <TableCell
                    className={
                      summaryStats.modifiers.stories.percentage >= 98 ? "text-green-600 font-bold" : "text-red-600"
                    }
                  >
                    {formatPercentage(summaryStats.modifiers.stories.percentage)}
                  </TableCell>
                  <TableCell className="bg-purple-100 dark:bg-purple-900/20">
                    {summaryStats.modifiers.stories.target}%
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Button onClick={onNext} disabled={isPending} className="mt-8 w-full sm:w-auto">
        {isPending ? "Processing..." : "Next: Generate Output"}
      </Button>
    </div>
  )
}
