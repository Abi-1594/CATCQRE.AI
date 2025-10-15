export interface FieldMapping {
  "Location Number"?: string
  "Loc Name"?: string
  "Full Address"?: string
  Street?: string
  City?: string
  County?: string
  State?: string
  "State Code"?: string
  "Postal Code"?: string
  Country?: string
  Occupancy?: string
  "Nature of Occupancy"?: string
  Construction?: string

  // Building Values (Multiple)
  "Building Value"?: string
  "Building Value 1"?: string
  "Building Value 2"?: string
  "Building Value 3"?: string
  "Building Value 4"?: string
  "Building Value 5"?: string

  // Contents Values (Multiple)
  "Contents Value"?: string
  "Contents Value 1"?: string
  "Contents Value 2"?: string
  "Contents Value 3"?: string
  "Contents Value 4"?: string
  "Contents Value 5"?: string

  // Business Interruption Values (Multiple)
  "Business Interruption"?: string
  "Business Interruption 1"?: string
  "Business Interruption 2"?: string
  "Business Interruption 3"?: string
  "Business Interruption 4"?: string
  "Business Interruption 5"?: string

  "Sprinkler Type"?: string
  "Year Built"?: string
  "No. of Buildings"?: string
  "No. of Stories"?: string
  "Square Footage"?: string
  "Year Upgraded"?: string
  "Roof Type"?: string
  "Foundation Type"?: string
  "Cladding Type"?: string
  "Soft Story"?: string
  "Tsunami Exposure"?: string
  "Liquefaction Exposure"?: string
}

export interface BusinessRules {
  maxStoriesThreshold: number
  storiesExceededAction: "none" | "reset_construction" | "reset_stories"
  minYearBuilt: number
  maxYearBuilt: number
  invalidYearAction: "none" | "reset_year" | "set_default"
  defaultYearBuilt: number
  minSquareFootage: number
  invalidSqftAction: "none" | "reset_sqft" | "set_default"
  defaultSquareFootage: number
  occupancyConfidenceThreshold: number
  constructionConfidenceThreshold: number
  maxBuildingValue: number
  maxContentsValue: number
  maxBIValue: number
  invalidValueAction: "none" | "reset_value" | "flag_review"
  defaultOccupancyForMisc: string
}

export interface Step {
  id: number
  name: string
}

export interface AppState {
  currentStep: number
  file: File | null
  accountName: string
  lineOfBusiness: string
  originalHeaders: string[]
  data: Record<string, any>[]
  fieldMapping: FieldMapping
  businessRules: BusinessRules
  processingLog: string[]
  progress: number
  error: string | null
  processedData: Record<string, any>[] | null
  outputCsv: string | null
}

export interface OccupancyItem {
  scheme: string
  code: string
  description: string
}

export interface ConstructionItem {
  scheme: string
  code: string
  description: string
}

export interface SearchResult {
  item: OccupancyItem | ConstructionItem
  score: number
}

export interface LLMAnalysisResult {
  bestMatch: { scheme: string; code: string; description: string } | null
  confidence: number
  reasoning: string
  alternativeMatches: Array<{ scheme: string; code: string; description: string; confidence: number }>
}

export interface GeocodingResult {
  latitude: number | null
  longitude: number | null
  street: string
  city: string
  county: string
  state: string
  postal: string
  country: string
  success: boolean
  source: string
}

export interface HazardData {
  floodRisk: string
  seismicRisk: string
  wildfireRisk: string
}

export interface ProcessingStats {
  totalRecords: number
  successfulGeocoding: number
  failedGeocoding: number
  highConfidenceOccupancy: number
  lowConfidenceOccupancy: number
  highConfidenceConstruction: number
  lowConfidenceConstruction: number
  businessRulesApplied: number
  amendmentsApplied: number
}

export interface AmendmentRecord {
  locationNumber: string
  originalOccupancy: string
  originalConstruction: string
  occupancyScheme: string
  occupancyCode: string
  occupancyConfidence: number
  occupancyMethod: string
  occupancyReasoning: string
  constructionScheme: string
  constructionCode: string
  constructionConfidence: number
  constructionMethod: string
  constructionReasoning: string
  amendedOccupancyScheme?: string
  amendedOccupancyCode?: string
  amendedConstructionScheme?: string
  amendedConstructionCode?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface QualityMetrics {
  geocodingSuccessRate: number
  averageOccupancyConfidence: number
  averageConstructionConfidence: number
  businessRuleApplicationRate: number
  dataCompletenessScore: number
}

export interface ExportOptions {
  includeOriginalColumns: boolean
  includeConfidenceScores: boolean
  includeReasoningColumns: boolean
  includeAlternativeMatches: boolean
  highlightLowConfidence: boolean
  customColumnOrder?: string[]
}

export interface CacheStats {
  geocodingCacheSize: number
  schemeCodingCacheSize: number
  headerMappingCacheSize: number
  lastCacheUpdate: Date | null
}

export interface LearningStats {
  totalCorrections: number
  geocodingCorrections: number
  occupancyCorrections: number
  constructionCorrections: number
  headerMappingCorrections: number
}
