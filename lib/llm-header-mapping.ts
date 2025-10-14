// Mock LLM header analysis - in production this would call actual LLM service
export async function batchMatchHeaders(
  headers: string[],
  data: Record<string, any>[],
): Promise<Record<string, { field: string | null; confidence: number; reasoning: string }>> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const results: Record<string, { field: string | null; confidence: number; reasoning: string }> = {}

  headers.forEach((header) => {
    const lowerHeader = header.toLowerCase()

    // Sample data analysis
    const sampleValues = data
      .slice(0, 3)
      .map((row) => String(row[header] || ""))
      .join(", ")

    // Mock analysis logic
    let field: string | null = null
    let confidence = 0
    let reasoning = ""

    // Location/ID patterns
    if (lowerHeader.includes("location") || lowerHeader.includes("id") || lowerHeader.includes("number")) {
      field = "Location Number"
      confidence = 0.9
      reasoning = `Header "${header}" appears to contain location identifiers. Sample values: ${sampleValues}`
    }
    // Address patterns
    else if (lowerHeader.includes("address") || lowerHeader.includes("street")) {
      if (lowerHeader.includes("full") || lowerHeader.includes("complete")) {
        field = "Full Address"
        confidence = 0.95
      } else {
        field = "Street"
        confidence = 0.85
      }
      reasoning = `Header "${header}" contains address information. Sample values: ${sampleValues}`
    }
    // Geographic patterns
    else if (lowerHeader.includes("city")) {
      field = "City"
      confidence = 0.9
      reasoning = `Header "${header}" appears to contain city names. Sample values: ${sampleValues}`
    } else if (lowerHeader.includes("state")) {
      field = "State"
      confidence = 0.9
      reasoning = `Header "${header}" appears to contain state information. Sample values: ${sampleValues}`
    } else if (lowerHeader.includes("zip") || lowerHeader.includes("postal")) {
      field = "Postal Code"
      confidence = 0.9
      reasoning = `Header "${header}" appears to contain postal codes. Sample values: ${sampleValues}`
    }
    // Business patterns
    else if (lowerHeader.includes("name") || lowerHeader.includes("business") || lowerHeader.includes("company")) {
      field = "Loc Name"
      confidence = 0.8
      reasoning = `Header "${header}" appears to contain business names. Sample values: ${sampleValues}`
    }
    // Occupancy patterns
    else if (
      lowerHeader.includes("occupancy") ||
      lowerHeader.includes("use") ||
      lowerHeader.includes("business type")
    ) {
      field = "Occupancy"
      confidence = 0.85
      reasoning = `Header "${header}" appears to describe occupancy or business type. Sample values: ${sampleValues}`
    }
    // Construction patterns
    else if (
      lowerHeader.includes("construction") ||
      lowerHeader.includes("building type") ||
      lowerHeader.includes("structure")
    ) {
      field = "Construction"
      confidence = 0.85
      reasoning = `Header "${header}" appears to describe construction type. Sample values: ${sampleValues}`
    }
    // Value patterns - will be handled by sequential mapping logic
    else if (
      lowerHeader.includes("building") &&
      (lowerHeader.includes("value") || lowerHeader.includes("limit") || lowerHeader.includes("coverage"))
    ) {
      field = "Building Value"
      confidence = 0.8
      reasoning = `Header "${header}" appears to contain building values. Sample values: ${sampleValues}`
    } else if (
      lowerHeader.includes("contents") &&
      (lowerHeader.includes("value") || lowerHeader.includes("limit") || lowerHeader.includes("coverage"))
    ) {
      field = "Contents Value"
      confidence = 0.8
      reasoning = `Header "${header}" appears to contain contents values. Sample values: ${sampleValues}`
    } else if (
      (lowerHeader.includes("business interruption") || lowerHeader.includes("bi")) &&
      (lowerHeader.includes("value") || lowerHeader.includes("limit") || lowerHeader.includes("coverage"))
    ) {
      field = "Business Interruption"
      confidence = 0.8
      reasoning = `Header "${header}" appears to contain business interruption values. Sample values: ${sampleValues}`
    }
    // Property details
    else if (lowerHeader.includes("year") && lowerHeader.includes("built")) {
      field = "Year Built"
      confidence = 0.9
      reasoning = `Header "${header}" appears to contain construction year. Sample values: ${sampleValues}`
    } else if (lowerHeader.includes("stories") || lowerHeader.includes("floors")) {
      field = "No. of Stories"
      confidence = 0.85
      reasoning = `Header "${header}" appears to contain number of stories/floors. Sample values: ${sampleValues}`
    } else if (lowerHeader.includes("square") || lowerHeader.includes("area") || lowerHeader.includes("sqft")) {
      field = "Square Footage"
      confidence = 0.85
      reasoning = `Header "${header}" appears to contain area measurements. Sample values: ${sampleValues}`
    } else if (lowerHeader.includes("sprinkler")) {
      field = "Sprinkler Type"
      confidence = 0.9
      reasoning = `Header "${header}" appears to contain sprinkler information. Sample values: ${sampleValues}`
    } else {
      field = null
      confidence = 0
      reasoning = `Unable to determine mapping for "${header}". Sample values: ${sampleValues}`
    }

    results[header] = { field, confidence, reasoning }
  })

  return results
}
