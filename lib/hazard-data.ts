// --- SIMULATED HAZARD DATA SOURCE ---
// In a real application, this would be a call to a database or a specialized hazard API.
// For this simulation, we use simple coordinate-based rules to assign risk.

interface HazardData {
  floodRisk: "Low" | "Moderate" | "High" | "Very High"
  seismicRisk: "Low" | "Moderate" | "High" | "Very High"
  wildfireRisk: "Low" | "Moderate" | "High" | "Very High"
}

/**
 * Simulates a lookup for hazard data based on latitude and longitude.
 * @param lat The latitude of the location.
 * @param lon The longitude of the location.
 * @returns An object containing simulated hazard risk levels.
 */
export function getSimulatedHazardData(lat: number, lon: number): HazardData {
  const hazardData: HazardData = {
    floodRisk: "Low",
    seismicRisk: "Low",
    wildfireRisk: "Low",
  }

  // Example Rule 1: High flood risk in a coastal area (e.g., near New Orleans)
  if (lat > 29.9 && lat < 30.1 && lon > -90.1 && lon < -89.9) {
    hazardData.floodRisk = "Very High"
  } else if (lat > 25 && lat < 35) {
    // Broader coastal region
    hazardData.floodRisk = "High"
  }

  // Example Rule 2: High seismic risk in California
  if (lat > 32.5 && lat < 42 && lon > -124.5 && lon < -114) {
    hazardData.seismicRisk = "Very High"
  } else if (lon > -125 && lon < -110) {
    // Broader western US
    hazardData.seismicRisk = "Moderate"
  }

  // Example Rule 3: Wildfire risk in forested, dry areas (e.g., parts of Colorado/California)
  if (hazardData.seismicRisk === "Very High" && lon < -118) {
    hazardData.wildfireRisk = "High"
  } else if (lat > 35 && lat < 45 && lon > -110 && lon < -100) {
    hazardData.wildfireRisk = "Moderate"
  }

  return hazardData
}
