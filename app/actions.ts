"use server"

import Papa from "papaparse"
import * as xlsx from "xlsx"
import { constructionSearch, occupancySearch } from "@/lib/nlp"
import {
  analyzeOccupancyWithLLM,
  analyzeConstructionWithLLM,
  analyzeFoundationTypeWithLLM,
  analyzeRoofTypeWithLLM,
  analyzeSoftStoryWithLLM,
  analyzeWallTypeWithLLM,
} from "@/lib/llm-scheme-coding"
import type { FieldMapping, BusinessRules } from "@/lib/types"
import { OUTPUT_COLUMN_SEQUENCE } from "@/lib/constants"
import type { GeocodingCache } from "@/lib/cache"
import { accountSelectionOccupancies, isMiscOccupancy } from "@/lib/occupancy-account-selection"
import ngeohash from "ngeohash"

// --- Stage 1: Robust Decision Tree Rules (Updated with AIR codes) ---
const constructionRules = [
  { keywords: ["heavy", "timber"], result: { scheme: "AIR", code: "104" } },
  { keywords: ["light", "wood"], result: { scheme: "AIR", code: "102" } },
  { keywords: ["wood", "frame", "modern"], result: { scheme: "AIR", code: "101" } },
  { keywords: ["masonry", "veneer"], result: { scheme: "AIR", code: "103" } },
  { keywords: ["unreinforced", "masonry", "bearing", "wall"], result: { scheme: "AIR", code: "114" } },
  { keywords: ["unreinforced", "masonry", "bearing", "frame"], result: { scheme: "AIR", code: "115" } },
  { keywords: ["unreinforced", "masonry"], result: { scheme: "AIR", code: "114" } },
  { keywords: ["reinforced", "masonry", "shear", "wall"], result: { scheme: "AIR", code: "117" } },
  { keywords: ["reinforced", "masonry"], result: { scheme: "AIR", code: "116" } },
  { keywords: ["confined", "masonry"], result: { scheme: "AIR", code: "120" } },
  { keywords: ["adobe"], result: { scheme: "AIR", code: "112" } },
  { keywords: ["rubble", "stone"], result: { scheme: "AIR", code: "113" } },
  { keywords: ["joisted", "masonry"], result: { scheme: "AIR", code: "119" } },
  { keywords: ["reinforced", "concrete", "shear", "wall"], result: { scheme: "AIR", code: "132" } },
  { keywords: ["reinforced", "concrete", "ductile"], result: { scheme: "AIR", code: "134" } },
  { keywords: ["reinforced", "concrete", "non-ductile"], result: { scheme: "AIR", code: "135" } },
  { keywords: ["tilt-up"], result: { scheme: "AIR", code: "136" } },
  { keywords: ["tilt", "up"], result: { scheme: "AIR", code: "136" } },
  { keywords: ["precast", "concrete", "shear"], result: { scheme: "AIR", code: "138" } },
  { keywords: ["precast", "concrete"], result: { scheme: "AIR", code: "137" } },
  { keywords: ["pre-cast", "concrete"], result: { scheme: "AIR", code: "137" } },
  { keywords: ["reinforced", "concrete"], result: { scheme: "AIR", code: "131" } },
  { keywords: ["steel", "frame", "braced"], result: { scheme: "AIR", code: "153" } },
  { keywords: ["braced", "steel"], result: { scheme: "AIR", code: "153" } },
  { keywords: ["steel", "moment", "frame"], result: { scheme: "AIR", code: "156" } },
  { keywords: ["steel", "long", "span"], result: { scheme: "AIR", code: "160" } },
  { keywords: ["light", "metal"], result: { scheme: "AIR", code: "152" } },
  { keywords: ["light", "steel"], result: { scheme: "AIR", code: "152" } },
  { keywords: ["steel", "reinforced", "concrete"], result: { scheme: "AIR", code: "159" } },
  { keywords: ["mobile", "home", "full", "tie"], result: { scheme: "AIR", code: "194" } },
  { keywords: ["mobile", "home", "partial", "tie"], result: { scheme: "AIR", code: "193" } },
  { keywords: ["mobile", "home", "no", "tie"], result: { scheme: "AIR", code: "192" } },
  { keywords: ["mobile", "home"], result: { scheme: "AIR", code: "191" } },
  { keywords: ["manufactured", "home"], result: { scheme: "AIR", code: "191" } },
  { keywords: ["trailer"], result: { scheme: "AIR", code: "191" } },
  { keywords: ["wood"], result: { scheme: "AIR", code: "101" } },
  { keywords: ["masonry"], result: { scheme: "AIR", code: "111" } },
  { keywords: ["concrete"], result: { scheme: "AIR", code: "131" } },
  { keywords: ["steel"], result: { scheme: "AIR", code: "151" } },
]

const occupancyRules = [
  { keywords: ["single", "family"], result: { scheme: "AIR", code: "302" } },
  { keywords: ["multi", "family"], result: { scheme: "AIR", code: "303" } },
  { keywords: ["health", "care"], result: { scheme: "AIR", code: "316" } },
  { keywords: ["dwelling"], result: { scheme: "AIR", code: "302" } },
  { keywords: ["house"], result: { scheme: "AIR", code: "302" } },
  { keywords: ["apartment"], result: { scheme: "AIR", code: "303" } },
  { keywords: ["hotel"], result: { scheme: "AIR", code: "304" } },
  { keywords: ["motel"], result: { scheme: "AIR", code: "304" } },
  { keywords: ["retail"], result: { scheme: "AIR", code: "312" } },
  { keywords: ["store"], result: { scheme: "AIR", code: "312" } },
  { keywords: ["office"], result: { scheme: "AIR", code: "315" } },
  { keywords: ["hospital"], result: { scheme: "AIR", code: "316" } },
  { keywords: ["school"], result: { scheme: "AIR", code: "346" } },
  { keywords: ["university"], result: { scheme: "AIR", code: "345" } },
  { keywords: ["industrial"], result: { scheme: "AIR", code: "321" } },
  { keywords: ["commercial"], result: { scheme: "AIR", code: "311" } },
  { keywords: ["restaurant"], result: { scheme: "AIR", code: "331" } },
  { keywords: ["gas", "station"], result: { scheme: "AIR", code: "335" } },
  { keywords: ["automotive", "repair"], result: { scheme: "AIR", code: "336" } },
  { keywords: ["church"], result: { scheme: "AIR", code: "342" } },
  { keywords: ["parking"], result: { scheme: "AIR", code: "318" } },
]

function applyRules(description: string, rules: typeof constructionRules): { scheme: string; code: string } | null {
  if (!description || typeof description !== "string") return null
  const lowerDesc = description.toLowerCase()
  for (const rule of rules) {
    if (rule.keywords.every((keyword) => lowerDesc.includes(keyword))) {
      return rule.result
    }
  }
  return null
}

function isWoodConstruction(constructionCode: string): boolean {
  // Check if construction is wood-based (AIR codes 101-108)
  return (
    constructionCode === "101" ||
    (typeof constructionCode === "string" &&
      constructionCode.startsWith("10") &&
      Number.parseInt(constructionCode) >= 101 &&
      Number.parseInt(constructionCode) <= 108)
  )
}

// Helper function to safely parse numeric values
function parseNumericValue(value: any): number {
  if (value === null || value === undefined || value === "") return 0

  // Handle string values with currency symbols and commas
  if (typeof value === "string") {
    const cleaned = value.replace(/[$,\s]/g, "")
    const parsed = Number.parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }

  // Handle numeric values
  if (typeof value === "number") {
    return isNaN(value) ? 0 : value
  }

  return 0
}

function parseComplexNumericValue(value: any, type: "buildings" | "stories"): number {
  if (value === null || value === undefined || value === "") return type === "buildings" ? 1 : 0

  const str = String(value).toLowerCase().trim()

  // Handle "dual stories" or similar text descriptions
  if (str.includes("dual") && type === "buildings") return 2
  if (str.includes("dual") && type === "stories") return 2

  // Handle "9+" format - extract the number before +
  const plusMatch = str.match(/(\d+)\+/)
  if (plusMatch) {
    return Number.parseInt(plusMatch[1], 10)
  }

  // Handle "2+3" format - sum the numbers
  const sumMatch = str.match(/(\d+)\s*\+\s*(\d+)/)
  if (sumMatch) {
    return Number.parseInt(sumMatch[1], 10) + Number.parseInt(sumMatch[2], 10)
  }

  // Handle decimal values like "2.5" or "2.2" - round up for stories
  const decimalMatch = str.match(/(\d+)\.(\d+)/)
  if (decimalMatch && type === "stories") {
    const whole = Number.parseInt(decimalMatch[1], 10)
    const decimal = Number.parseInt(decimalMatch[2], 10)
    return decimal > 0 ? whole + 1 : whole // Round up if there's any decimal
  }

  // Standard parsing with comma removal
  const cleaned = str.replace(/[,$\s]/g, "")
  const parsed = Number.parseInt(cleaned, 10)

  return isNaN(parsed) ? (type === "buildings" ? 1 : 0) : parsed
}

// --- Server Actions ---

export async function processFile(file: File) {
  try {
    const buffer = await file.arrayBuffer()
    let data: Record<string, any>[]
    let originalHeaders: string[] | undefined

    if (file.name.endsWith(".csv")) {
      const text = new TextDecoder().decode(buffer)
      const result = Papa.parse(text, { header: true, skipEmptyLines: true })
      data = result.data as Record<string, any>[]
      originalHeaders = result.meta.fields
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const workbook = xlsx.read(buffer, { type: "buffer" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      data = xlsx.utils.sheet_to_json(worksheet)
      originalHeaders = data.length > 0 ? Object.keys(data[0]) : []
    } else {
      return { error: "Unsupported file type." }
    }

    return { originalHeaders: originalHeaders || [], data }
  } catch (error: any) {
    return { error: `Error parsing file: ${error.message}` }
  }
}

export async function processAddressCleansing(data: Record<string, any>[], mapping: FieldMapping) {
  try {
    const processedData = await Promise.all(
      data.map(async (row) => {
        const newRow = { ...row }

        const fullAddressMapped = mapping["Full Address"] ? row[mapping["Full Address"]] : null
        const street = mapping.Street ? row[mapping.Street] : ""
        const city = mapping.City ? row[mapping.City] : ""
        const county = mapping.County ? row[mapping.County] : ""
        const state = mapping.State ? row[mapping.State] : ""
        const stateCode = mapping["State Code"] ? row[mapping["State Code"]] : ""
        const postal = mapping["Postal Code"] ? row[mapping["Postal Code"]] : ""
        const country = mapping.Country ? row[mapping.Country] : ""

        let addressToGeocode = fullAddressMapped
        if (!addressToGeocode) {
          addressToGeocode = [street, city, state, postal, country].filter(Boolean).join(", ")
        }

        // Preserve original data as the default for _Final columns
        newRow["Street_Final"] = street
        newRow["City_Final"] = city
        newRow["County_Final"] = county
        newRow["State_Final"] = state
        newRow["Statecode_Final"] = stateCode
        newRow["Postal_Final"] = postal
        newRow["Country_Final"] = country
        newRow["Latitude"] = null
        newRow["Longitude"] = null
        newRow["_geocodingCacheKey"] = addressToGeocode // Pass key back to client

        if (!addressToGeocode) return newRow

        // --- Primary API: OpenStreetMap (Nominatim) ---
        try {
          console.log(`[v0] Geocoding with Nominatim: ${addressToGeocode}`)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&q=${encodeURIComponent(
              addressToGeocode,
            )}`,
            {
              headers: { "User-Agent": "CatScrubApp/1.0 (Vercel AI)" },
              signal: AbortSignal.timeout(10000), // 10 second timeout
            },
          )

          if (response.ok) {
            const geoData = await response.json()
            const location = geoData[0]
            if (location) {
              const addr = location.address || {}
              let finalStreet = addr.road
              if (finalStreet && addr.house_number) {
                finalStreet = `${addr.house_number} ${finalStreet}`
              }
              newRow["Street_Final"] = finalStreet || street
              newRow["City_Final"] = addr.city || addr.town || addr.village || city
              newRow["County_Final"] = addr.county || county
              newRow["State_Final"] = addr.state || state
              newRow["Statecode_Final"] = addr.state_code ? addr.state_code.toUpperCase() : stateCode
              newRow["Postal_Final"] = addr.postcode || postal
              newRow["Country_Final"] = addr.country || country
              newRow["Latitude"] = Number.parseFloat(location.lat)
              newRow["Longitude"] = Number.parseFloat(location.lon)
              console.log(`[v0] Successfully geocoded: ${addressToGeocode}`)
            } else {
              console.log(`[v0] No results found for: ${addressToGeocode}`)
            }
          } else {
            console.error(`[v0] Nominatim API returned status ${response.status} for: ${addressToGeocode}`)
          }
        } catch (e) {
          console.error(`[v0] Nominatim API call failed for ${addressToGeocode}:`, e)
          // Keep original values if geocoding fails
        }

        return newRow
      }),
    )
    return { processedData }
  } catch (error: any) {
    console.error("[v0] Error during address cleansing:", error)
    return { error: `Error during address cleansing: ${error.message}` }
  }
}

export async function processSchemeCoding(
  data: Record<string, any>[],
  mapping: FieldMapping,
  businessRules?: BusinessRules,
) {
  try {
    // Provide default business rules if not passed
    const defaultRules: BusinessRules = {
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
      defaultOccupancyForMisc: "311", // Updated default AIR occupancy code for General Commercial
    }

    const rules = businessRules || defaultRules

    const processedData = await Promise.all(
      data.map(async (row, index) => {
        const newRow = { ...row }

        // Location Number & Name
        newRow["Location Number"] = (mapping["Location Number"] && row[mapping["Location Number"]]) || index + 1
        newRow["Loc_Name_Final"] =
          (mapping["Loc Name"] && String(row[mapping["Loc Name"]]).replace(/[^a-zA-Z0-9 ]/g, "")) || ""

        const originalConstDesc = mapping.Construction ? row[mapping.Construction] : ""
        const originalOccDesc = mapping.Occupancy ? row[mapping.Occupancy] : ""

        // Store original values in dedicated columns for display
        newRow["Construction_Original"] = originalConstDesc
        newRow["Occupancy_Original"] = originalOccDesc

        // --- Enhanced Construction Coding with LLM Analysis ---
        const constDesc = originalConstDesc
        const yearBuilt = newRow["Year_Built_Final"] || (mapping["Year Built"] ? row[mapping["Year Built"]] : undefined)
        const stories =
          newRow["No_of_Stories_Final"] || (mapping["No. of Stories"] ? row[mapping["No. of Stories"]] : undefined)

        newRow["_constCacheKey"] = constDesc

        // Stage 1: Decision Tree
        const constRuleMatch = applyRules(constDesc, constructionRules)
        if (constRuleMatch) {
          newRow["Construction Scheme"] = constRuleMatch.scheme
          newRow["Construction Code"] = constRuleMatch.code
          newRow["Construction Confidence"] = 1.0
          newRow["_constructionMethod"] = "rule-based"
        } else {
          // Stage 2: LLM Analysis
          try {
            console.log("[v0] Starting LLM construction analysis for:", constDesc)
            const llmResult = await analyzeConstructionWithLLM(constDesc, yearBuilt, stories)
            console.log("[v0] LLM construction result:", llmResult)

            if (
              llmResult &&
              typeof llmResult === "object" &&
              llmResult.bestMatch &&
              typeof llmResult.bestMatch === "object" &&
              typeof llmResult.bestMatch.scheme === "string" &&
              typeof llmResult.bestMatch.code === "string" &&
              typeof llmResult.confidence === "number" &&
              llmResult.confidence >= 0.3
            ) {
              newRow["Construction Scheme"] = llmResult.bestMatch.scheme
              newRow["Construction Code"] = llmResult.bestMatch.code
              newRow["Construction Confidence"] = llmResult.confidence
              newRow["_constructionMethod"] = "llm-analysis"
              newRow["_constructionReasoning"] = llmResult.reasoning
              newRow["_constructionAlternatives"] = llmResult.alternativeMatches
            } else {
              console.log("[v0] LLM result invalid, falling back to TF-IDF")
              // Stage 3: TF-IDF Search (fallback)
              const constTfidfMatch = constructionSearch.search(constDesc)
              if (constTfidfMatch && constTfidfMatch.item && constTfidfMatch.item.scheme && constTfidfMatch.item.code) {
                newRow["Construction Scheme"] = constTfidfMatch.item.scheme
                newRow["Construction Code"] = constTfidfMatch.item.code
                newRow["Construction Confidence"] = constTfidfMatch.score || 0
                newRow["_constructionMethod"] = "tfidf-search"
              } else {
                newRow["Construction Scheme"] = "AIR"
                newRow["Construction Code"] = "100"
                newRow["Construction Confidence"] = 0
                newRow["_constructionMethod"] = "unknown"
              }
            }
          } catch (error) {
            console.error("LLM construction analysis failed:", error)
            // Fallback to TF-IDF
            const constTfidfMatch = constructionSearch.search(constDesc)
            if (constTfidfMatch && constTfidfMatch.item && constTfidfMatch.item.scheme && constTfidfMatch.item.code) {
              newRow["Construction Scheme"] = constTfidfMatch.item.scheme
              newRow["Construction Code"] = constTfidfMatch.item.code
              newRow["Construction Confidence"] = constTfidfMatch.score || 0
              newRow["_constructionMethod"] = "tfidf-fallback"
            } else {
              newRow["Construction Scheme"] = "AIR"
              newRow["Construction Code"] = "100"
              newRow["Construction Confidence"] = 0
              newRow["_constructionMethod"] = "unknown"
            }
          }
        }

        // Apply business rules for stories and wood construction AFTER construction coding
        const numStories = newRow["No_of_Stories_Final"] || 0
        const constructionCode = newRow["Construction Code"]

        if (numStories > rules.maxStoriesThreshold && isWoodConstruction(constructionCode)) {
          if (rules.storiesExceededAction === "reset_construction") {
            newRow["Construction Scheme"] = "AIR"
            newRow["Construction Code"] = "100"
            newRow["Construction Confidence"] = 1.0
            newRow["_businessRuleApplied"] =
              `Wood construction with ${numStories} stories > ${rules.maxStoriesThreshold} threshold - construction reset`
          } else if (rules.storiesExceededAction === "reset_stories") {
            newRow["No_of_Stories_Final"] = 0
            newRow["_businessRuleApplied"] =
              `Stories reset due to wood construction exceeding ${rules.maxStoriesThreshold} threshold`
          }
        }

        // Flag low confidence construction
        if (newRow["Construction Confidence"] < rules.constructionConfidenceThreshold) {
          newRow["_constructionNeedsReview"] = true
        }

        // --- Enhanced Occupancy Coding with LLM Analysis ---
        const occDesc = originalOccDesc
        const businessName = mapping["Loc Name"] ? row[mapping["Loc Name"]] : ""
        const natureOfOcc = mapping["Nature of Occupancy"] ? row[mapping["Nature of Occupancy"]] : ""

        newRow["_occCacheKey"] = occDesc

        // Check if occupancy is misc/vacant/blank and needs replacement
        if (isMiscOccupancy(occDesc)) {
          const selectedOccupancy = accountSelectionOccupancies.find(
            (occ) => occ.code === rules.defaultOccupancyForMisc,
          )
          if (selectedOccupancy) {
            newRow["Occupancy Scheme"] = selectedOccupancy.scheme
            newRow["Occupancy Code"] = selectedOccupancy.code
            newRow["Occupancy Confidence"] = 1.0
            newRow["_occupancyMethod"] = "account-selection"
            newRow["_businessRuleApplied"] = `Misc/vacant occupancy replaced with ${selectedOccupancy.description}`
          } else {
            // Fallback if selected occupancy not found
            newRow["Occupancy Scheme"] = "AIR"
            newRow["Occupancy Code"] = "311"
            newRow["Occupancy Confidence"] = 1.0
            newRow["_occupancyMethod"] = "account-selection-fallback"
            newRow["_businessRuleApplied"] = "Misc/vacant occupancy replaced with General Commercial"
          }
        } else {
          // Stage 1: Decision Tree
          const occRuleMatch = applyRules(occDesc, occupancyRules)
          if (occRuleMatch) {
            newRow["Occupancy Scheme"] = occRuleMatch.scheme
            newRow["Occupancy Code"] = occRuleMatch.code
            newRow["Occupancy Confidence"] = 1.0
            newRow["_occupancyMethod"] = "rule-based"
          } else {
            // Stage 2: LLM Analysis
            try {
              console.log("[v0] Starting LLM occupancy analysis for:", occDesc)
              const llmResult = await analyzeOccupancyWithLLM(occDesc, businessName, natureOfOcc)
              console.log("[v0] LLM occupancy result:", llmResult)

              if (
                llmResult &&
                typeof llmResult === "object" &&
                llmResult.bestMatch &&
                typeof llmResult.bestMatch === "object" &&
                typeof llmResult.bestMatch.scheme === "string" &&
                typeof llmResult.bestMatch.code === "string" &&
                typeof llmResult.confidence === "number" &&
                llmResult.confidence >= 0.3
              ) {
                newRow["Occupancy Scheme"] = llmResult.bestMatch.scheme
                newRow["Occupancy Code"] = llmResult.bestMatch.code
                newRow["Occupancy Confidence"] = llmResult.confidence
                newRow["_occupancyMethod"] = "llm-analysis"
                newRow["_occupancyReasoning"] = llmResult.reasoning
                newRow["_occupancyAlternatives"] = llmResult.alternativeMatches
              } else {
                console.log("[v0] LLM result invalid, falling back to TF-IDF")
                // Stage 3: TF-IDF Search (fallback)
                const occTfidfMatch = occupancySearch.search(occDesc)
                if (occTfidfMatch && occTfidfMatch.item && occTfidfMatch.item.scheme && occTfidfMatch.item.code) {
                  newRow["Occupancy Scheme"] = occTfidfMatch.item.scheme
                  newRow["Occupancy Code"] = occTfidfMatch.item.code
                  newRow["Occupancy Confidence"] = occTfidfMatch.score || 0
                  newRow["_occupancyMethod"] = "tfidf-search"
                } else {
                  newRow["Occupancy Scheme"] = "AIR"
                  newRow["Occupancy Code"] = "301" // Updated unknown code for AIR
                  newRow["Occupancy Confidence"] = 0
                  newRow["_occupancyMethod"] = "unknown"
                }
              }
            } catch (error) {
              console.error("LLM occupancy analysis failed:", error)
              try {
                const occTfidfMatch = occupancySearch.search(occDesc)
                if (occTfidfMatch && occTfidfMatch.item && occTfidfMatch.item.scheme && occTfidfMatch.item.code) {
                  newRow["Occupancy Scheme"] = occTfidfMatch.item.scheme
                  newRow["Occupancy Code"] = occTfidfMatch.item.code
                  newRow["Occupancy Confidence"] = occTfidfMatch.score || 0
                  newRow["_occupancyMethod"] = "tfidf-fallback"
                } else {
                  newRow["Occupancy Scheme"] = "AIR"
                  newRow["Occupancy Code"] = "301"
                  newRow["Occupancy Confidence"] = 0
                  newRow["_occupancyMethod"] = "unknown"
                }
              } catch (fallbackError) {
                console.error("TF-IDF fallback also failed:", fallbackError)
                newRow["Occupancy Scheme"] = "AIR"
                newRow["Occupancy Code"] = "301"
                newRow["Occupancy Confidence"] = 0
                newRow["_occupancyMethod"] = "error-fallback"
              }
            }
          }
        }

        // Flag low confidence occupancy
        if (newRow["Occupancy Confidence"] < rules.occupancyConfidenceThreshold) {
          newRow["_occupancyNeedsReview"] = true
        }

        return newRow
      }),
    )
    return { processedData }
  } catch (error: any) {
    return { error: `Error during scheme coding: ${error.message}` }
  }
}

export async function processOtherModifiers(
  data: Record<string, any>[],
  mapping: FieldMapping,
  businessRules?: BusinessRules,
) {
  try {
    // Provide default business rules if not passed
    const defaultRules: BusinessRules = {
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
      defaultOccupancyForMisc: "311", // Updated default AIR occupancy code
    }

    const rules = businessRules || defaultRules

    const processedData = data.map((row) => {
      const newRow = { ...row }

      const sprinkler = mapping["Sprinkler Type"] ? String(row[mapping["Sprinkler Type"]]).toLowerCase() : ""
      newRow["Sprinkler_Type_Final"] = sprinkler === "yes" || sprinkler === "true" || sprinkler === "1" ? 1 : 0

      // Year Built with business rules
      const yearBuiltRaw = mapping["Year Built"] ? row[mapping["Year Built"]] : ""
      const yearMatch = String(yearBuiltRaw).match(/\b(19|20)\d{2}\b/)
      let yearBuilt = yearMatch ? Number.parseInt(yearMatch[0], 10) : 0

      if (yearBuilt < rules.minYearBuilt || yearBuilt > rules.maxYearBuilt) {
        if (rules.invalidYearAction === "reset_year") {
          yearBuilt = 0
          newRow["_businessRuleApplied"] = "Year reset due to invalid range"
        } else if (rules.invalidYearAction === "set_default") {
          yearBuilt = rules.defaultYearBuilt
          newRow["_businessRuleApplied"] = "Year set to default due to invalid range"
        }
      }
      newRow["Year_Built_Final"] = yearBuilt

      const numBuildingsRaw = mapping["No. of Buildings"] ? row[mapping["No. of Buildings"]] : "1"
      newRow["No_of_Buildings_Final"] = parseComplexNumericValue(numBuildingsRaw, "buildings")

      const numStoriesRaw = mapping["No. of Stories"] ? row[mapping["No. of Stories"]] : "0"
      newRow["No_of_Stories_Final"] = parseComplexNumericValue(numStoriesRaw, "stories")

      // Square Footage with business rules
      const sqFootageRaw = mapping["Square Footage"] ? row[mapping["Square Footage"]] : "0"
      let sqFootage = Number.parseInt(String(sqFootageRaw).replace(/,/g, ""), 10) || 0

      if (sqFootage > 0 && sqFootage < rules.minSquareFootage) {
        if (rules.invalidSqftAction === "reset_sqft") {
          sqFootage = 0
          newRow["_businessRuleApplied"] = "Square footage reset due to being below minimum"
        } else if (rules.invalidSqftAction === "set_default") {
          sqFootage = rules.defaultSquareFootage
          newRow["_businessRuleApplied"] = "Square footage set to default due to being below minimum"
        }
      }
      newRow["Square_Footage_Final"] = sqFootage

      // Nature of Occupancy processing
      const natureOfOcc = mapping["Nature of Occupancy"] ? String(row[mapping["Nature of Occupancy"]]) : ""
      newRow["Nature_of_Occupancy_Final"] = natureOfOcc

      return newRow
    })
    return { processedData }
  } catch (error: any) {
    return { error: `Error processing modifiers: ${error.message}` }
  }
}

export async function processCatnetModifiers(data: Record<string, any>[], mapping: FieldMapping) {
  try {
    const processedData = await Promise.all(
      data.map(async (row) => {
        const newRow = { ...row }

        const parseBoolean = (key: keyof FieldMapping) => {
          const raw = mapping[key] ? String(row[mapping[key]]).toLowerCase() : ""
          return raw === "yes" || raw === "true" || raw === "1" ? 1 : 0
        }

        const parseYear = (key: keyof FieldMapping) => {
          const raw = mapping[key] ? row[mapping[key]] : ""
          const match = String(raw).match(/\b(19|20)\d{2}\b/)
          return match ? Number.parseInt(match[0], 10) : 0
        }

        const parseString = (key: keyof FieldMapping) => {
          return mapping[key] ? String(row[mapping[key]]) : ""
        }

        const yearUpgradedRaw = parseString("Year Upgraded")
        newRow["Year Upgraded"] = yearUpgradedRaw
        newRow["Year_Upgraded_Final"] = parseYear("Year Upgraded")

        const roofTypeRaw = parseString("Roof Type")
        newRow["Roof Type"] = roofTypeRaw // Store original description
        const roofTypeAnalysis = await analyzeRoofTypeWithLLM(roofTypeRaw)
        newRow["Roof_Type_Final"] = roofTypeAnalysis ? roofTypeAnalysis.code : 0

        const foundationTypeRaw = parseString("Foundation Type")
        newRow["Foundation Type"] = foundationTypeRaw // Store original description
        const foundationTypeAnalysis = await analyzeFoundationTypeWithLLM(foundationTypeRaw)
        newRow["Foundation_Type_Final"] = foundationTypeAnalysis ? foundationTypeAnalysis.code : 0

        const claddingTypeRaw = parseString("Cladding Type")
        newRow["Cladding Type"] = claddingTypeRaw // Store original description
        const wallTypeAnalysis = await analyzeWallTypeWithLLM(claddingTypeRaw)
        newRow["Cladding_Type_Final"] = wallTypeAnalysis ? wallTypeAnalysis.code : 0

        const softStoryRaw = parseString("Soft Story")
        newRow["Soft Story"] = softStoryRaw // Store original description
        const softStoryAnalysis = await analyzeSoftStoryWithLLM(softStoryRaw)
        newRow["Soft_Story_Final"] = softStoryAnalysis ? softStoryAnalysis.code : parseBoolean("Soft Story")

        const tsunamiExposureRaw = parseString("Tsunami Exposure")
        newRow["Tsunami Exposure"] = tsunamiExposureRaw // Store original description
        newRow["Tsunami_Exposure_Final"] = parseBoolean("Tsunami Exposure")

        const liquefactionExposureRaw = parseString("Liquefaction Exposure")
        newRow["Liquefaction Exposure"] = liquefactionExposureRaw // Store original description
        newRow["Liquefaction_Exposure_Final"] = parseBoolean("Liquefaction Exposure")

        return newRow
      }),
    )
    return { processedData }
  } catch (error: any) {
    return { error: `Error processing CATNET modifiers: ${error.message}` }
  }
}

export async function processExposure(
  data: Record<string, any>[],
  mapping: FieldMapping,
  businessRules?: BusinessRules,
) {
  try {
    // Provide default business rules if not passed
    const defaultRules: BusinessRules = {
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
      defaultOccupancyForMisc: "311", // Updated default AIR occupancy code
    }

    const rules = businessRules || defaultRules

    const processedData = data.map((row) => {
      const newRow = { ...row }

      const parseValue = (key: keyof FieldMapping) => {
        const rawValue = mapping[key] ? row[mapping[key]] : "0"
        return parseNumericValue(rawValue)
      }

      // Process all building values (base + 1-5)
      const buildingValue = parseValue("Building Value")
      const buildingValue1 = parseValue("Building Value 1")
      const buildingValue2 = parseValue("Building Value 2")
      const buildingValue3 = parseValue("Building Value 3")
      const buildingValue4 = parseValue("Building Value 4")
      const buildingValue5 = parseValue("Building Value 5")

      // Store individual values if they exist
      if (buildingValue > 0) newRow["Building_Value_Final"] = buildingValue
      if (buildingValue1 > 0) newRow["Building_Value_1_Final"] = buildingValue1
      if (buildingValue2 > 0) newRow["Building_Value_2_Final"] = buildingValue2
      if (buildingValue3 > 0) newRow["Building_Value_3_Final"] = buildingValue3
      if (buildingValue4 > 0) newRow["Building_Value_4_Final"] = buildingValue4
      if (buildingValue5 > 0) newRow["Building_Value_5_Final"] = buildingValue5

      // Process all contents values (base + 1-5)
      const contentsValue = parseValue("Contents Value")
      const contentsValue1 = parseValue("Contents Value 1")
      const contentsValue2 = parseValue("Contents Value 2")
      const contentsValue3 = parseValue("Contents Value 3")
      const contentsValue4 = parseValue("Contents Value 4")
      const contentsValue5 = parseValue("Contents Value 5")

      // Store individual values if they exist
      if (contentsValue > 0) newRow["Contents_Value_Final"] = contentsValue
      if (contentsValue1 > 0) newRow["Contents_Value_1_Final"] = contentsValue1
      if (contentsValue2 > 0) newRow["Contents_Value_2_Final"] = contentsValue2
      if (contentsValue3 > 0) newRow["Contents_Value_3_Final"] = contentsValue3
      if (contentsValue4 > 0) newRow["Contents_Value_4_Final"] = contentsValue4
      if (contentsValue5 > 0) newRow["Contents_Value_5_Final"] = contentsValue5

      // Process all BI values (base + 1-5)
      const biValue = parseValue("Business Interruption")
      const biValue1 = parseValue("Business Interruption 1")
      const biValue2 = parseValue("Business Interruption 2")
      const biValue3 = parseValue("Business Interruption 3")
      const biValue4 = parseValue("Business Interruption 4")
      const biValue5 = parseValue("Business Interruption 5")

      // Store individual values if they exist
      if (biValue > 0) newRow["Business_Interruption_Final"] = biValue
      if (biValue1 > 0) newRow["Business_Interruption_1_Final"] = biValue1
      if (biValue2 > 0) newRow["Business_Interruption_2_Final"] = biValue2
      if (biValue3 > 0) newRow["Business_Interruption_3_Final"] = biValue3
      if (biValue4 > 0) newRow["Business_Interruption_4_Final"] = biValue4
      if (biValue5 > 0) newRow["Business_Interruption_5_Final"] = biValue5

      // Calculate combined totals - sum ALL fields (base + 1-5)
      const totalBuildingValue =
        buildingValue + buildingValue1 + buildingValue2 + buildingValue3 + buildingValue4 + buildingValue5
      const totalContentsValue =
        contentsValue + contentsValue1 + contentsValue2 + contentsValue3 + contentsValue4 + contentsValue5
      const totalBIValue = biValue + biValue1 + biValue2 + biValue3 + biValue4 + biValue5

      // Apply business rules for values
      let finalBuildingValue = totalBuildingValue
      let finalContentsValue = totalContentsValue
      let finalBIValue = totalBIValue

      if (totalBuildingValue > rules.maxBuildingValue) {
        if (rules.invalidValueAction === "reset_value") {
          finalBuildingValue = 0
          newRow["_businessRuleApplied"] = "Building value reset due to exceeding maximum"
        } else if (rules.invalidValueAction === "flag_review") {
          newRow["_buildingValueNeedsReview"] = true
        }
      }

      if (totalContentsValue > rules.maxContentsValue) {
        if (rules.invalidValueAction === "reset_value") {
          finalContentsValue = 0
          newRow["_businessRuleApplied"] = "Contents value reset due to exceeding maximum"
        } else if (rules.invalidValueAction === "flag_review") {
          newRow["_contentsValueNeedsReview"] = true
        }
      }

      if (totalBIValue > rules.maxBIValue) {
        if (rules.invalidValueAction === "reset_value") {
          finalBIValue = 0
          newRow["_businessRuleApplied"] = "BI value reset due to exceeding maximum"
        } else if (rules.invalidValueAction === "flag_review") {
          newRow["_biValueNeedsReview"] = true
        }
      }

      // Set final combined values
      newRow["Building_Value_Total_Final"] = finalBuildingValue
      newRow["Contents_Value_Total_Final"] = finalContentsValue
      newRow["Business_Interruption_Total_Final"] = finalBIValue
      newRow["Total_Insured_Value_Final"] = finalBuildingValue + finalContentsValue + finalBIValue

      return newRow
    })
    return { processedData }
  } catch (error: any) {
    return { error: `Error calculating exposure: ${error.message}` }
  }
}

export async function generateOutputFile(data: Record<string, any>[], mapping: FieldMapping) {
  try {
    const originalMappedHeaders = Object.values(mapping)
    const additionalHeaders = originalMappedHeaders.filter((h) => !OUTPUT_COLUMN_SEQUENCE.includes(h))
    const finalHeaders = [...OUTPUT_COLUMN_SEQUENCE, ...additionalHeaders]

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
    return { success: true, csvData: csv }
  } catch (error: any) {
    return { error: `Error generating output file: ${error.message}` }
  }
}

export async function learnFromOutputFile(file: File) {
  try {
    const buffer = await file.arrayBuffer()
    let data: Record<string, any>[]

    if (file.name.endsWith(".csv")) {
      const text = new TextDecoder().decode(buffer)
      const result = Papa.parse(text, { header: true, skipEmptyLines: true })
      data = result.data as Record<string, any>[]
    } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
      const workbook = xlsx.read(buffer, { type: "buffer" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      data = xlsx.utils.sheet_to_json(worksheet)
    } else {
      return { error: "Unsupported file type." }
    }

    const newGeocodingCache: GeocodingCache = {}
    let learnedCount = 0

    for (const row of data) {
      const lat = Number.parseFloat(row.Latitude)
      const lon = Number.parseFloat(row.Longitude)
      const street = row.Street_Final
      const city = row.City_Final
      const postal = row.Postal_Final
      const country = row.Country_Final

      if (!isNaN(lat) && !isNaN(lon) && street && city && postal && country) {
        const addressKey = [street, city, postal, country].filter(Boolean).join(", ")
        if (!newGeocodingCache[addressKey]) {
          newGeocodingCache[addressKey] = {
            lat,
            lon,
            street,
            city,
            county: row.County_Final || "",
            state: row.State_Final || "",
            postal,
            country,
          }
          learnedCount++
        }
      }
    }

    return { newGeocodingCache, learnedCount }
  } catch (error: any) {
    return { error: `Error learning from file: ${error.message}` }
  }
}

export async function processHazardAnalysis(data: Record<string, any>[]) {
  try {
    const processedData = data.map((row) => {
      const newRow = { ...row }
      const lat = row.Latitude
      const lon = row.Longitude

      if (typeof lat === "number" && typeof lon === "number") {
        // 1. Generate Geospatial Key (Geohash)
        newRow["Geospatial_Key"] = ngeohash.encode(lat, lon, 9) // Precision 9 is ~4.7m x 4.7m

        // 2. Perform Hazard Analysis (Simulated)
        const hazard = getSimulatedHazardData(lat, lon)
        newRow["Flood_Risk"] = hazard.floodRisk
        newRow["Seismic_Risk"] = hazard.seismicRisk
        newRow["Wildfire_Risk"] = hazard.wildfireRisk
      } else {
        newRow["Geospatial_Key"] = ""
        newRow["Flood_Risk"] = "Unknown"
        newRow["Seismic_Risk"] = "Unknown"
        newRow["Wildfire_Risk"] = "Unknown"
      }

      return newRow
    })
    return { processedData }
  } catch (error: any) {
    return { error: `Error during hazard analysis: ${error.message}` }
  }
}

// Simulated hazard data function
function getSimulatedHazardData(lat: number, lon: number) {
  // Simulate hazard data based on latitude and longitude
  // This is a placeholder function for demonstration purposes
  return {
    floodRisk: "Low",
    seismicRisk: "Medium",
    wildfireRisk: "High",
  }
}
