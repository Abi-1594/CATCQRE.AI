import { occupancyData } from "./occupancy-data"
import { constructionData } from "./construction-data"
import { foundationTypes } from "./foundation-data"
import { roofCoverTypes } from "./roof-data"
import { wallTypes } from "./wall-data"
import type { LLMAnalysisResult } from "./types"

// Enhanced occupancy definitions for LLM matching with AIR codes
const OCCUPANCY_DEFINITIONS = {
  "301": "General residential composite of all residential occupancies",
  "302": "Single-unit detached dwellings, single family homes, individual houses",
  "303": "Multiple-unit dwellings, multi-family housing, typically four units or less",
  "304": "Hotels, motels, motor hotels, tourist courts, temporary lodging facilities",
  "305": "College dormitories, nursing homes, retirement centers, group institutional housing",
  "306": "Attached multi-unit housing with more than four units, apartments, condominiums",
  "307": "Attached residential units, terraced housing, commonly found in Europe",
  "311": "General commercial composite of all commercial occupancies",
  "312": "Retail stores, shopping centers, consumer goods sales, retail trade",
  "313": "Wholesale distribution, distribution centers, bulk goods storage and sales",
  "314": "Personal services, repair services, laundry, beauty shops, automotive repair",
  "315": "Professional services, offices, business services, financial institutions",
  "316": "Medical services, hospitals, clinics, health care facilities",
  "317": "Entertainment, recreation, theaters, gyms, sports facilities, amusement, pool",
  "318": "Automobile parking facilities, garages, parking lots",
  "319": "Golf courses and related buildings and facilities",
  "321": "General industrial composite of all industrial occupancies",
  "322": "Heavy manufacturing, fabrication, assembly, industrial production",
  "323": "Light manufacturing, fabrication, assembly, small manufacturing",
  "324": "Food processing, beverage manufacturing, drug processing",
  "325": "Chemical manufacturing, chemical processing, refineries",
  "326": "Metal processing, mineral processing, smelting, metal fabrication",
  "327": "High technology, electronics manufacturing, research facilities",
  "328": "Construction industry, contractors, building material suppliers",
  "329": "Petroleum industry, gas stations, oil storage, fuel distribution",
  "330": "Mining operations, extraction, quarries, mineral processing",
  "331": "Restaurants, fast food centers, cafés, bars, food service",
  "335": "Gasoline stations, retail gas sales, automotive fuel",
  "336": "Automotive repair shops, car washes, vehicle service",
  "341": "Religious organizations, non-profit organizations, charities",
  "342": "Churches, religious establishments, worship facilities",
  "343": "Government offices, general government services, public administration",
  "344": "Emergency services, fire stations, police, public safety",
  "345": "Universities, colleges, technical schools, higher education",
  "346": "Primary schools, secondary schools, K-12 education",
  "361": "Electrical utilities, power generation, electricity distribution",
  "362": "Water utilities, water distribution, water treatment",
  "363": "Sanitary sewer, waste collection, sewage treatment",
  "364": "Natural gas utilities, gas distribution, gas storage",
  "365": "Telephone, telegraph, telecommunications",
  "371": "Communication, radio, television broadcasting",
  "372": "Flood control, water management, environmental protection",
  "373": "Agriculture, farming, livestock, agricultural processing",
  "374": "Greenhouses, farms, orchards, nurseries, crop production",
  "375": "Forestry operations, timber, forest management",
}

// Enhanced construction definitions for LLM matching with AIR codes
const CONSTRUCTION_DEFINITIONS = {
  "100": "Unknown construction class, weighted average of known construction damage functions",
  "101": "Wood Frame (Modern) - Low rise wood stud walls, 2x4 or 2x6 inch members, plywood bracing",
  "102": "Light Wood Frame - Light timber trusses, single wall construction, common in Japan/Hawaii",
  "103": "Masonry Veneer - Wood-framed structure with non-load-bearing masonry facing",
  "104": "Heavy Timber - Masonry walls with heavy wood columns, tongue-and-groove planks",
  "107": "Lightweight Cladding - Timber or light steel framing with fiber cement/plywood cladding",
  "108": "Hale Construction - Indigenous Hawaiian construction methods",
  "111": "Masonry - General masonry exterior walls, detailed information unavailable",
  "112": "Adobe - Adobe clay blocks with cement mortar, timber frame roof",
  "113": "Rubble Stone Masonry - Irregular stones in cement mortar, wood floor/roof joists",
  "114": "Unreinforced Masonry Bearing Wall - No steel reinforcing in load-bearing masonry",
  "115": "Unreinforced Masonry Bearing Frame - Masonry infill in bearing frame structure",
  "116": "Reinforced Masonry - Load bearing reinforced brick or concrete-block masonry",
  "117": "Reinforced Masonry Shear Wall with MRF - Moment resisting frames with shear walls",
  "118": "Reinforced Masonry Shear Wall without MRF - Continuous reinforced masonry walls",
  "119": "Joisted Masonry - Masonry walls with combustible roof on non-combustible supports",
  "120": "Confined Masonry - Plain masonry confined by reinforced concrete members",
  "121": "Cavity Double Brick - Two layers of bricks, common in Australia",
  "131": "Reinforced Concrete - General reinforced concrete columns and beams",
  "132": "Reinforced Concrete Shear Wall with MRF - RC with moment frames and shear walls",
  "133": "Reinforced Concrete Shear Wall without MRF - RC box system with shear walls",
  "134": "Reinforced Concrete MRF Ductile - High ductility, sustains large deformations",
  "135": "Reinforced Concrete MRF Non-Ductile - Insufficient reinforcing steel, low ductility",
  "136": "Tilt-Up - RC wall panels cast on ground and tilted into position",
  "137": "Pre-cast Concrete - Post and beam system with prefabricated elements",
  "138": "Pre-cast Concrete with Shear Wall - Pre-cast frame with cast-in-place shear walls",
  "139": "Reinforced Concrete MRF - RC moment frames, ductility level unknown",
  "140": "Reinforced Concrete MRF with URM - RC frames with unreinforced masonry infill",
  "141": "RC Frame with 2nd Story Wood/URM - Caribbean bunker style with wood addition",
  "151": "Steel - General steel frame columns and beams",
  "152": "Light Metal - Light gauge steel frame with metal/asbestos cladding",
  "153": "Braced Steel Frame - Steel columns and beams with diagonal bracing",
  "154": "Steel MRF Perimeter - Perimeter frames carry lateral loads",
  "155": "Steel MRF Distributed - Lateral loads distributed throughout building",
  "156": "Steel MRF - Steel moment-resisting frames, location unknown",
  "157": "Steel Frame with URM - Steel frames with unreinforced masonry infill",
  "158": "Steel Frame with Concrete Shear Wall - Steel frames with RC shear walls",
  "159": "Steel Reinforced Concrete - Steel sections encased in reinforced concrete",
  "160": "Steel Long Span - Column-free spaces greater than 100 feet",
  "191": "Mobile Homes - Weighted average of tie-down types",
  "192": "Mobile Home No Tie-Downs - No anchoring systems present",
  "193": "Mobile Home Partial Tie-Downs - Either over-the-top or frame ties",
  "194": "Mobile Home Full Tie-Downs - Both over-the-top and frame ties",
}

// Business context keywords for occupancy analysis
const OCCUPANCY_CONTEXT_KEYWORDS = {
  residential: ["home", "house", "apartment", "condo", "residential", "dwelling", "family", "tenant"],
  commercial: ["store", "shop", "retail", "business", "commercial", "office", "service"],
  industrial: ["factory", "plant", "manufacturing", "industrial", "warehouse", "distribution"],
  institutional: ["school", "hospital", "church", "government", "public", "institutional"],
  hospitality: ["hotel", "motel", "restaurant", "bar", "hospitality", "lodging"],
  healthcare: ["medical", "clinic", "doctor", "dental", "healthcare", "pharmacy"],
  automotive: ["auto", "car", "vehicle", "garage", "automotive", "repair"],
  food: ["restaurant", "food", "kitchen", "dining", "cafe", "bakery", "grocery"],
}

// Construction material keywords
const CONSTRUCTION_CONTEXT_KEYWORDS = {
  wood: ["wood", "timber", "frame", "lumber", "wooden", "log"],
  masonry: ["brick", "stone", "masonry", "block", "concrete block", "cmu"],
  concrete: ["concrete", "cement", "reinforced", "precast", "tilt-up"],
  steel: ["steel", "metal", "iron", "structural steel", "metal frame", "steel frame"],
  mixed: ["mixed", "combination", "composite", "hybrid"],
}

const ABBREVIATION_MAP: Record<string, string> = {
  // Construction abbreviations
  cncrt: "concrete",
  conc: "concrete",
  concr: "concrete",
  reinf: "reinforced",
  reinfo: "reinforced",
  msnry: "masonry",
  mason: "masonry",
  stl: "steel",
  mtl: "metal",
  precast: "precast",
  prcst: "precast",
  tiltup: "tilt-up",
  "tilt up": "tilt-up",
  frm: "frame",
  bldg: "building",
  struct: "structure",
  // Occupancy abbreviations
  comm: "commercial",
  comml: "commercial",
  res: "residential",
  resid: "residential",
  ind: "industrial",
  indust: "industrial",
  mfg: "manufacturing",
  manuf: "manufacturing",
  whse: "warehouse",
  whs: "warehouse",
  ret: "retail",
  retl: "retail",
  off: "office",
  ofc: "office",
  hosp: "hospital",
  med: "medical",
  rest: "restaurant",
  restr: "restaurant",
  auto: "automotive",
}

// Helper function to expand abbreviations in text
function expandAbbreviations(text: string): { expanded: string; hadAbbreviations: boolean } {
  if (!text) return { expanded: "", hadAbbreviations: false }

  let expanded = text.toLowerCase()
  let hadAbbreviations = false

  // Replace each abbreviation with its full form
  for (const [abbr, full] of Object.entries(ABBREVIATION_MAP)) {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${abbr}\\b`, "gi")
    if (regex.test(expanded)) {
      hadAbbreviations = true
      expanded = expanded.replace(regex, full)
    }
  }

  return { expanded, hadAbbreviations }
}

// Get AIR construction data only
function getAIRConstructionData() {
  return constructionData.filter((item) => item.scheme === "AIR")
}

// Get AIR occupancy data only
function getAIROccupancyData() {
  return occupancyData.filter((item) => item.scheme === "AIR")
}

// Mock LLM analysis using Gemini API simulation
export async function analyzeOccupancyWithLLM(
  description: string,
  businessName?: string,
  natureOfOccupancy?: string,
): Promise<LLMAnalysisResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  if (!description?.trim()) {
    return {
      bestMatch: null,
      confidence: 0,
      reasoning: "No occupancy description provided",
      alternativeMatches: [],
    }
  }

  // Filter to AIR scheme only
  const airOccupancies = occupancyData.filter((item) => item.scheme === "AIR")

  // Simple keyword matching simulation (in production, this would use actual Gemini API)
  const lowerDesc = description.toLowerCase()
  const lowerBusiness = businessName?.toLowerCase() || ""
  const lowerNature = natureOfOccupancy?.toLowerCase() || ""

  const searchText = `${lowerDesc} ${lowerBusiness} ${lowerNature}`.trim()

  // Score each occupancy based on keyword matches
  const scored = airOccupancies.map((occ) => {
    const occDesc = occ.description.toLowerCase()
    let score = 0

    // Direct keyword matches
    const keywords = searchText.split(/\s+/).filter((word) => word.length > 2)
    keywords.forEach((keyword) => {
      if (occDesc.includes(keyword)) {
        score += 0.3
      }
    })

    // Swimming club should match Entertainment (317)
    if (searchText.includes("swimming") || searchText.includes("pool") || searchText.includes("club")) {
      if (occ.code === "317") score += 0.9 // Entertainment - perfect match for swimming clubs
    }

    // Car repairing should match Automotive Repair (336)
    if (
      searchText.includes("car repair") ||
      searchText.includes("auto repair") ||
      searchText.includes("automotive repair")
    ) {
      if (occ.code === "336") score += 0.9 // Automotive repair - perfect match
    }

    // General automotive services
    if (searchText.includes("car") && searchText.includes("repair")) {
      if (occ.code === "336") score += 0.8 // Automotive repair
    }

    // Showrooms are typically wholesale/distribution rather than retail
    if (searchText.includes("showroom")) {
      if (occ.code === "313") score += 0.8 // Wholesale distribution - better match for showrooms
      if (occ.code === "312") score += 0.2 // Retail - much lower score for showrooms
    }

    // Enhanced warehouse matching
    if (searchText.includes("warehouse")) {
      if (occ.code === "313") score += 0.9 // Wholesale distribution - perfect match
      if (occ.code === "312") score += 0.1 // Retail - very low score
    }

    // Enhanced metal processing matching
    if (searchText.includes("metal")) {
      if (occ.code === "326") score += 0.8 // Metal processing - perfect match
      if (occ.code === "322") score += 0.4 // Heavy manufacturing - secondary match
    }

    // Enhanced bakery matching
    if (searchText.includes("bakery")) {
      if (occ.code === "324") score += 0.9 // Food processing - perfect match for bakeries
      if (occ.code === "331") score += 0.2 // Restaurant - much lower score for bakeries
    }

    // General keyword matching with higher scores
    if (searchText.includes("retail") && occDesc.includes("retail")) score += 0.6
    if (searchText.includes("office") && occDesc.includes("office")) score += 0.6
    if (searchText.includes("restaurant") && occDesc.includes("restaurant")) score += 0.6
    if (searchText.includes("hotel") && occDesc.includes("hotel")) score += 0.6
    if (searchText.includes("hospital") && occDesc.includes("hospital")) score += 0.6
    if (searchText.includes("school") && occDesc.includes("school")) score += 0.6
    if (searchText.includes("industrial") && occDesc.includes("industrial")) score += 0.6

    if (searchText.includes("wholesale") && occ.code === "313") score += 0.7
    if (searchText.includes("distribution") && occ.code === "313") score += 0.6

    if (searchText.includes("metal processing") && occ.code === "326") score += 0.9
    if (searchText.includes("processing") && occ.code === "326") score += 0.4

    if (searchText.includes("food processing") && occ.code === "324") score += 0.9
    if (searchText.includes("beverage") && occ.code === "324") score += 0.7
    if (searchText.includes("drug processing") && occ.code === "324") score += 0.8

    return { ...occ, score: Math.min(score, 1.0) }
  })

  const sortedMatches = scored.filter((item) => item.score > 0.01).sort((a, b) => b.score - a.score)

  const bestMatch = sortedMatches[0]
  const alternativeMatches = sortedMatches.slice(1, 4).map((match) => ({
    scheme: match.scheme,
    code: match.code,
    description: match.description,
    confidence: match.score,
  }))

  if (bestMatch) {
    return {
      bestMatch: {
        scheme: bestMatch.scheme,
        code: bestMatch.code,
        description: bestMatch.description,
      },
      confidence: bestMatch.score,
      reasoning: `Matched "${description}" to ${bestMatch.description} based on keyword analysis`,
      alternativeMatches,
    }
  }

  return {
    bestMatch: null,
    confidence: 0,
    reasoning: `No suitable AIR occupancy match found for "${description}"`,
    alternativeMatches: [],
  }
}

export async function analyzeConstructionWithLLM(
  description: string,
  yearBuilt?: number,
  stories?: number,
): Promise<LLMAnalysisResult> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  console.log("[v0] Starting LLM construction analysis for:", description)

  if (!description?.trim()) {
    return {
      bestMatch: null,
      confidence: 0,
      reasoning: "No construction description provided",
      alternativeMatches: [],
    }
  }

  // Filter to AIR scheme only
  const airConstructions = constructionData.filter((item) => item.scheme === "AIR")

  const { expanded: expandedDesc, hadAbbreviations } = expandAbbreviations(description)
  const lowerDesc = expandedDesc.toLowerCase()

  console.log("[v0] Original:", description, "| Expanded:", expandedDesc, "| Had abbreviations:", hadAbbreviations)

  // Score each construction type based on keyword matches
  const scored = airConstructions.map((cons) => {
    const consDesc = cons.description.toLowerCase()
    let score = 0

    // Direct keyword matches
    const keywords = lowerDesc.split(/\s+/).filter((word) => word.length > 2)
    keywords.forEach((keyword) => {
      if (consDesc.includes(keyword)) {
        score += 0.3
      }
    })

    if (lowerDesc.includes("concrete") && consDesc.includes("concrete")) score += 0.6
    if (lowerDesc.includes("wood") && consDesc.includes("wood")) score += 0.6
    if (lowerDesc.includes("steel") && consDesc.includes("steel")) score += 0.6
    if (lowerDesc.includes("metal") && consDesc.includes("metal")) score += 0.6
    if (lowerDesc.includes("masonry") && consDesc.includes("masonry")) score += 0.6
    if (lowerDesc.includes("frame") && consDesc.includes("frame")) score += 0.4
    if (lowerDesc.includes("reinforced") && consDesc.includes("reinforced")) score += 0.4
    if (lowerDesc.includes("unreinforced") && consDesc.includes("unreinforced")) score += 0.6
    if (lowerDesc.includes("tilt") && consDesc.includes("tilt")) score += 0.6
    if (lowerDesc.includes("precast") && consDesc.includes("precast")) score += 0.6

    // Enhanced metal construction matching
    if (lowerDesc.includes("metal") && cons.code === "152") score += 0.8
    if (lowerDesc.includes("light metal") && cons.code === "152") score += 0.9
    if (lowerDesc.includes("metal construction") && cons.code === "152") score += 0.8

    // Year built considerations
    if (yearBuilt) {
      if (yearBuilt < 1940 && consDesc.includes("unreinforced")) score += 0.2
      if (yearBuilt > 1980 && consDesc.includes("modern")) score += 0.1
    }

    // Stories considerations
    if (stories) {
      if (stories > 10 && consDesc.includes("high-rise")) score += 0.2
      if (stories <= 3 && consDesc.includes("low-rise")) score += 0.1
    }

    return { ...cons, score: Math.min(score, 1.0) }
  })

  const sortedMatches = scored.filter((item) => item.score > 0.01).sort((a, b) => b.score - a.score)

  const bestMatch = sortedMatches[0]
  const alternativeMatches = sortedMatches.slice(1, 4).map((match) => ({
    scheme: match.scheme,
    code: match.code,
    description: match.description,
    confidence: match.score,
  }))

  if (bestMatch) {
    let finalConfidence = bestMatch.score

    if (hadAbbreviations) {
      finalConfidence *= 0.7
      console.log("[v0] Abbreviation penalty applied: reduced confidence from", bestMatch.score, "to", finalConfidence)
    }

    const similarAlternatives = alternativeMatches.filter((alt) => alt.confidence >= bestMatch.score - 0.15)
    if (similarAlternatives.length > 0) {
      const ambiguityPenalty = 0.85 // Reduce by 15% for each similar alternative
      finalConfidence *= ambiguityPenalty
      console.log(
        "[v0] Ambiguity penalty applied:",
        similarAlternatives.length,
        "similar alternatives found, reduced confidence to",
        finalConfidence,
      )
    }

    // Cap confidence at reasonable maximum
    finalConfidence = Math.min(finalConfidence, 0.95)

    console.log("[v0] Final confidence:", finalConfidence, "for", bestMatch.description)

    return {
      bestMatch: {
        scheme: bestMatch.scheme,
        code: bestMatch.code,
        description: bestMatch.description,
      },
      confidence: finalConfidence,
      reasoning: `Matched "${description}" to ${bestMatch.description} based on keyword analysis${yearBuilt ? ` (built ${yearBuilt})` : ""}${stories ? ` (${stories} stories)` : ""}${hadAbbreviations ? " (abbreviation expanded)" : ""}${similarAlternatives.length > 0 ? ` (${similarAlternatives.length} similar alternatives)` : ""}`,
      alternativeMatches,
    }
  }

  return {
    bestMatch: null,
    confidence: 0,
    reasoning: `No suitable AIR construction match found for "${description}"`,
    alternativeMatches: [],
  }
}

// Batch process multiple descriptions
export async function batchAnalyzeOccupancy(
  descriptions: Array<{
    description: string
    businessName?: string
    natureOfOccupancy?: string
  }>,
): Promise<
  Array<{
    bestMatch: { scheme: string; code: string; description: string } | null
    confidence: number
    reasoning: string
    alternativeMatches: Array<{ scheme: string; code: string; description: string; confidence: number }>
  }>
> {
  const results = []
  for (const item of descriptions) {
    const result = await analyzeOccupancyWithLLM(item.description, item.businessName, item.natureOfOccupancy)
    results.push(result)
  }
  return results
}

export async function batchAnalyzeConstruction(
  descriptions: Array<{
    description: string
    yearBuilt?: number
    stories?: number
  }>,
): Promise<
  Array<{
    bestMatch: { scheme: string; code: string; description: string } | null
    confidence: number
    reasoning: string
    alternativeMatches: Array<{ scheme: string; code: string; description: string; confidence: number }>
  }>
> {
  const results = []
  for (const item of descriptions) {
    const result = await analyzeConstructionWithLLM(item.description, item.yearBuilt, item.stories)
    results.push(result)
  }
  return results
}

export async function analyzeFoundationTypeWithLLM(
  description: string,
): Promise<{ type: string; code: number } | null> {
  await new Promise((resolve) => setTimeout(resolve, 100))

  if (!description?.trim()) return null

  const lowerDesc = description.toLowerCase()

  // Score each foundation type based on keyword matches
  const scored = foundationTypes.map((foundation) => {
    const foundationDesc = foundation.type.toLowerCase()
    let score = 0

    // Direct keyword matches
    if (lowerDesc.includes("basement") && foundationDesc.includes("basement")) score += 0.8
    if (lowerDesc.includes("crawl") && foundationDesc.includes("crawl")) score += 0.8
    if (lowerDesc.includes("slab") && foundationDesc.includes("slab")) score += 0.8
    if (lowerDesc.includes("pile") && foundationDesc.includes("pile")) score += 0.8
    if (lowerDesc.includes("pier") && foundationDesc.includes("pier")) score += 0.8
    if (lowerDesc.includes("footing") && foundationDesc.includes("footing")) score += 0.8
    if (lowerDesc.includes("masonry") && foundationDesc.includes("masonry")) score += 0.6
    if (lowerDesc.includes("concrete") && foundationDesc.includes("concrete")) score += 0.6
    if (lowerDesc.includes("wood") && foundationDesc.includes("wood")) score += 0.6

    return { ...foundation, score }
  })

  const bestMatch = scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score)[0]
  return bestMatch ? { type: bestMatch.type, code: bestMatch.code } : null
}

export async function analyzeRoofTypeWithLLM(description: string): Promise<{ type: string; code: number } | null> {
  await new Promise((resolve) => setTimeout(resolve, 100))

  if (!description?.trim()) return null

  const lowerDesc = description.toLowerCase()

  // Score each roof type based on keyword matches
  const scored = roofCoverTypes.map((roof) => {
    const roofDesc = roof.type.toLowerCase()
    let score = 0

    // Direct keyword matches
    if (lowerDesc.includes("shingle") && roofDesc.includes("shingle")) score += 0.8
    if (lowerDesc.includes("tile") && roofDesc.includes("tile")) score += 0.8
    if (lowerDesc.includes("metal") && roofDesc.includes("metal")) score += 0.8
    if (lowerDesc.includes("slate") && roofDesc.includes("slate")) score += 0.8
    if (lowerDesc.includes("membrane") && roofDesc.includes("membrane")) score += 0.8
    if (lowerDesc.includes("gravel") && roofDesc.includes("gravel")) score += 0.8
    if (lowerDesc.includes("asphalt") && roofDesc.includes("asphalt")) score += 0.6
    if (lowerDesc.includes("wood") && roofDesc.includes("wood")) score += 0.6
    if (lowerDesc.includes("clay") && roofDesc.includes("clay")) score += 0.6
    if (lowerDesc.includes("concrete") && roofDesc.includes("concrete")) score += 0.6

    return { ...roof, score }
  })

  const bestMatch = scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score)[0]
  return bestMatch ? { type: bestMatch.type, code: bestMatch.code } : null
}

export async function analyzeSoftStoryWithLLM(description: string): Promise<{ type: string; code: number } | null> {
  await new Promise((resolve) => setTimeout(resolve, 100))

  if (!description?.trim()) return null

  const lowerDesc = description.toLowerCase()

  // Simple yes/no/unknown logic for soft story
  if (lowerDesc.includes("yes") || lowerDesc.includes("true") || lowerDesc.includes("1")) {
    return { type: "Yes", code: 2 }
  }
  if (lowerDesc.includes("no") || lowerDesc.includes("false") || lowerDesc.includes("0")) {
    return { type: "No", code: 1 }
  }

  return { type: "Unknown/default", code: 0 }
}

export async function analyzeWallTypeWithLLM(description: string): Promise<{ type: string; code: number } | null> {
  await new Promise((resolve) => setTimeout(resolve, 100))

  if (!description?.trim()) return null

  const lowerDesc = description.toLowerCase()

  // Score each wall type based on keyword matches
  const scored = wallTypes.map((wall) => {
    const wallDesc = wall.type.toLowerCase()
    let score = 0

    // Direct keyword matches
    if (lowerDesc.includes("wood") && wallDesc.includes("wood")) score += 0.8
    if (lowerDesc.includes("masonry") && wallDesc.includes("masonry")) score += 0.8
    if (lowerDesc.includes("concrete") && wallDesc.includes("concrete")) score += 0.8
    if (lowerDesc.includes("steel") && wallDesc.includes("steel")) score += 0.8
    if (lowerDesc.includes("stucco") && wallDesc.includes("stucco")) score += 0.8
    if (lowerDesc.includes("vinyl") && wallDesc.includes("vinyl")) score += 0.8
    if (lowerDesc.includes("brick") && wallDesc.includes("brick")) score += 0.8
    if (lowerDesc.includes("stone") && wallDesc.includes("stone")) score += 0.8
    if (lowerDesc.includes("fiber") && wallDesc.includes("fiber")) score += 0.8
    if (lowerDesc.includes("siding") && wallDesc.includes("siding")) score += 0.6
    if (lowerDesc.includes("frame") && wallDesc.includes("frame")) score += 0.6

    return { ...wall, score }
  })

  const bestMatch = scored.filter((item) => item.score > 0).sort((a, b) => b.score - a.score)[0]
  return bestMatch ? { type: bestMatch.type, code: bestMatch.code } : null
}
