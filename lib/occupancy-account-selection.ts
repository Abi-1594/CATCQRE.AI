// AIR occupancy codes available for account selection when dealing with misc/vacant/blank occupancies
export const accountSelectionOccupancies = [
  // Residential
  { scheme: "AIR", code: "301", description: "General Residential" },
  { scheme: "AIR", code: "302", description: "Permanent Dwelling: Single Family" },
  { scheme: "AIR", code: "303", description: "Permanent Dwelling: Multi Family" },
  { scheme: "AIR", code: "306", description: "Apartments/Condominiums" },

  // Commercial - Most Common
  { scheme: "AIR", code: "311", description: "General Commercial" },
  { scheme: "AIR", code: "312", description: "Retail Trade" },
  { scheme: "AIR", code: "313", description: "Wholesale Trade" },
  { scheme: "AIR", code: "315", description: "Professional, Technical, and Business Services" },
  { scheme: "AIR", code: "318", description: "Parking" },
  { scheme: "AIR", code: "331", description: "Restaurants" },

  // Industrial - Common Types
  { scheme: "AIR", code: "321", description: "General Industrial" },
  { scheme: "AIR", code: "322", description: "Heavy Fabrication and Assembly" },
  { scheme: "AIR", code: "323", description: "Light Fabrication and Assembly" },
  { scheme: "AIR", code: "366", description: "Inland Transit Cargo" },

  // Institutional
  { scheme: "AIR", code: "341", description: "Religion and Non-Profit" },
  { scheme: "AIR", code: "342", description: "Church" },
  { scheme: "AIR", code: "345", description: "Universities, Colleges, and Technical Schools" },
  { scheme: "AIR", code: "346", description: "Primary and Secondary Schools" },

  // Utilities
  { scheme: "AIR", code: "361", description: "Electrical Utilities" },
  { scheme: "AIR", code: "362", description: "Water Utilities" },

  // Agriculture/Other
  { scheme: "AIR", code: "373", description: "Agriculture" },
  { scheme: "AIR", code: "374", description: "Greenhouses" },
]

// Function to check if an occupancy description indicates misc/vacant/blank
export function isMiscOccupancy(description: string): boolean {
  if (!description || typeof description !== "string") return false

  const lowerDesc = description.toLowerCase().trim()

  const miscKeywords = [
    "misc",
    "miscellaneous",
    "vacant",
    "blank",
    "empty",
    "unknown",
    "other",
    "general",
    "unspecified",
    "n/a",
    "na",
    "tbd",
    "to be determined",
  ]

  // Check if the description is exactly one of these keywords or very short
  if (lowerDesc.length <= 3) return true

  return miscKeywords.some((keyword) => lowerDesc === keyword || (lowerDesc.includes(keyword) && lowerDesc.length < 15))
}

// Get occupancy suggestions based on context
export function getOccupancySuggestions(
  businessName?: string,
  additionalContext?: string,
): typeof accountSelectionOccupancies {
  const context = [businessName, additionalContext].filter(Boolean).join(" ").toLowerCase()

  if (!context) return accountSelectionOccupancies

  // Filter suggestions based on context
  const suggestions = accountSelectionOccupancies.filter((occ) => {
    const desc = occ.description.toLowerCase()

    // Residential context
    if (context.includes("home") || context.includes("house") || context.includes("residential")) {
      return desc.includes("residential") || desc.includes("dwelling")
    }

    // Commercial context
    if (context.includes("business") || context.includes("office") || context.includes("store")) {
      return desc.includes("commercial") || desc.includes("retail") || desc.includes("professional")
    }

    // Industrial context
    if (context.includes("factory") || context.includes("manufacturing") || context.includes("industrial")) {
      return desc.includes("industrial") || desc.includes("fabrication") || desc.includes("assembly")
    }

    // Educational context
    if (context.includes("school") || context.includes("education") || context.includes("university")) {
      return desc.includes("school") || desc.includes("universities")
    }

    // Religious context
    if (context.includes("church") || context.includes("religious") || context.includes("worship")) {
      return desc.includes("church") || desc.includes("religion")
    }

    return true
  })

  return suggestions.length > 0 ? suggestions : accountSelectionOccupancies
}

// Default occupancy mapping for common business types
export const businessTypeOccupancyMapping: Record<string, string> = {
  // Residential
  house: "302",
  home: "302",
  apartment: "303",
  condo: "306",
  residential: "301",

  // Commercial
  office: "315",
  store: "312",
  shop: "312",
  retail: "312",
  restaurant: "331",
  hotel: "304",
  motel: "304",
  parking: "318",
  commercial: "311",

  // Industrial
  factory: "321",
  manufacturing: "321",
  warehouse: "366",
  industrial: "321",

  // Institutional
  school: "346",
  university: "345",
  college: "345",
  church: "342",
  hospital: "316",

  // Utilities
  utility: "361",
  power: "361",
  water: "362",

  // Agriculture
  farm: "373",
  agriculture: "373",
  greenhouse: "374",
}

// Get recommended occupancy code based on business name or description
export function getRecommendedOccupancy(businessName?: string, description?: string): string {
  const text = [businessName, description].filter(Boolean).join(" ").toLowerCase()

  for (const [keyword, code] of Object.entries(businessTypeOccupancyMapping)) {
    if (text.includes(keyword)) {
      return code
    }
  }

  // Default to General Commercial if no match found
  return "311"
}
