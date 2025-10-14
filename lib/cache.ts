// A simple localStorage-based cache for learning from user corrections.

const LEARNED_HEADERS_KEY = "catscrub_learnedHeaders"
const GEOCODING_CACHE_KEY = "catscrub_geocodingCache"
const SCHEME_CODING_CACHE_KEY = "catscrub_schemeCodingCache"
const AMENDMENT_CACHE_KEY = "catscrub_amendmentCache"

// --- Type Definitions ---
export type LearnedHeaderMappings = Record<string, string> // e.g., { "Site Address": "Full Address" }
export type GeocodingCacheItem = {
  lat: number
  lon: number
  street: string
  city: string
  county: string
  state: string
  postal: string
  country: string
}
export type GeocodingCache = Record<string, GeocodingCacheItem> // Key is the address string

export type SchemeCacheItem = {
  scheme: string
  code: string
  confidence: number
}
export type SchemeCodingCache = Record<string, SchemeCacheItem> // Key is the description string

export type AmendmentCacheItem = {
  originalValue: string
  amendedScheme: string
  amendedCode: string
  amendedConfidence: number
  amendmentDate: string
}
export type AmendmentCache = Record<string, AmendmentCacheItem>

// --- Generic Cache Functions ---
function getCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const item = window.localStorage.getItem(key)
    return item ? (JSON.parse(item) as T) : null
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error)
    return null
  }
}

function setCache<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    const item = JSON.stringify(value)
    window.localStorage.setItem(key, item)
  } catch (error) {
    console.error(`Error setting localStorage key “${key}”:`, error)
  }
}

// --- Specific Cache Implementations ---

// Header Mappings
export const getLearnedHeaders = (): LearnedHeaderMappings => getCache<LearnedHeaderMappings>(LEARNED_HEADERS_KEY) || {}
export const saveLearnedHeader = (header: string, field: string) => {
  const current = getLearnedHeaders()
  current[header] = field
  setCache(LEARNED_HEADERS_KEY, current)
}

// Geocoding
export const getGeocodingCache = (): GeocodingCache => getCache<GeocodingCache>(GEOCODING_CACHE_KEY) || {}
export const updateGeocodingCache = (newItems: GeocodingCache) => {
  const current = getGeocodingCache()
  const updated = { ...current, ...newItems }
  setCache(GEOCODING_CACHE_KEY, updated)
}

// Scheme Coding
export const getSchemeCodingCache = (): SchemeCodingCache => getCache<SchemeCodingCache>(SCHEME_CODING_CACHE_KEY) || {}
export const updateSchemeCodingCache = (newItems: SchemeCodingCache) => {
  const current = getSchemeCodingCache()
  const updated = { ...current, ...newItems }
  setCache(SCHEME_CODING_CACHE_KEY, updated)
}

// Amendment Cache
export const getAmendmentCache = (): AmendmentCache => getCache<AmendmentCache>(AMENDMENT_CACHE_KEY) || {}
export const updateAmendmentCache = (newItems: AmendmentCache) => {
  const current = getAmendmentCache()
  const updated = { ...current, ...newItems }
  setCache(AMENDMENT_CACHE_KEY, updated)
}

// Clear All Caches
export const clearAllCaches = () => {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(LEARNED_HEADERS_KEY)
  window.localStorage.removeItem(GEOCODING_CACHE_KEY)
  window.localStorage.removeItem(SCHEME_CODING_CACHE_KEY)
  window.localStorage.removeItem(AMENDMENT_CACHE_KEY)
}
