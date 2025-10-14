"use client"

import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet"
import type { LatLngExpression } from "leaflet"

interface MapViewProps {
  currentData: Record<string, any>[]
  previousData: Record<string, any>[] | null
}

// Function to scale TIV to a reasonable circle radius for the map
const scaleRadius = (tiv: number) => {
  if (!tiv || tiv <= 0) return 50 // Minimum radius for visibility
  // Use a logarithmic scale to prevent giant circles for extreme values
  return Math.log(tiv) * 25 + 50
}

const formatCurrency = (value: any) => {
  const num = Number(value)
  if (isNaN(num)) return value
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num)
}

export default function MapView({ currentData, previousData }: MapViewProps) {
  const defaultCenter: LatLngExpression = [39.8283, -98.5795] // Center of the US
  const defaultZoom = 4

  const renderCircles = (data: Record<string, any>[], color: string) => {
    return data
      .filter((row) => typeof row.Latitude === "number" && typeof row.Longitude === "number")
      .map((row, index) => {
        const position: LatLngExpression = [row.Latitude, row.Longitude]
        return (
          <Circle
            key={`${color}-${index}`}
            center={position}
            pathOptions={{ color: color, fillColor: color, fillOpacity: 0.4 }}
            radius={scaleRadius(row.Total_Insured_Value_Final)}
          >
            <Popup>
              <b>Location:</b> {row["Location Number"]} <br />
              <b>Address:</b> {row.Street_Final}, {row.City_Final} <br />
              <b>TIV:</b> {formatCurrency(row.Total_Insured_Value_Final)} <br />
              <b>Flood Risk:</b> {row.Flood_Risk}
            </Popup>
          </Circle>
        )
      })
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      scrollWheelZoom={true}
      style={{ height: "600px", width: "100%", borderRadius: "0.5rem" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {previousData && renderCircles(previousData, "grey")}
      {renderCircles(currentData, "blue")}
    </MapContainer>
  )
}
