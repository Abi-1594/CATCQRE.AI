import { occupancyData } from "./occupancy-data"
import { constructionData } from "./construction-data"
import type { OccupancyItem, ConstructionItem, SearchResult } from "./types"

// TF-IDF Implementation for text similarity
class TFIDFSearch<T extends { description: string }> {
  private documents: T[]
  private vocabulary: string[]
  private idf: Record<string, number>
  private tfIdfVectors: number[][]

  constructor(documents: T[]) {
    this.documents = documents
    this.vocabulary = []
    this.idf = {}
    this.tfIdfVectors = []
    this.buildIndex()
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2)
  }

  private buildIndex() {
    // Build vocabulary
    const allTokens = new Set<string>()
    const documentTokens = this.documents.map((doc) => {
      const tokens = this.tokenize(doc.description)
      tokens.forEach((token) => allTokens.add(token))
      return tokens
    })

    this.vocabulary = Array.from(allTokens)

    // Calculate IDF
    this.vocabulary.forEach((term) => {
      const docsWithTerm = documentTokens.filter((tokens) => tokens.includes(term)).length
      this.idf[term] = Math.log(this.documents.length / (docsWithTerm + 1))
    })

    // Calculate TF-IDF vectors
    this.tfIdfVectors = documentTokens.map((tokens) => {
      const termFreq: Record<string, number> = {}
      tokens.forEach((token) => {
        termFreq[token] = (termFreq[token] || 0) + 1
      })

      return this.vocabulary.map((term) => {
        const tf = (termFreq[term] || 0) / tokens.length
        return tf * this.idf[term]
      })
    })
  }

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0)
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0))
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0))

    if (magnitude1 === 0 || magnitude2 === 0) return 0
    return dotProduct / (magnitude1 * magnitude2)
  }

  search(query: string, limit = 5): SearchResult<T>[] {
    if (!query.trim()) return []

    const queryTokens = this.tokenize(query)
    const queryVector = this.vocabulary.map((term) => {
      const tf = queryTokens.filter((token) => token === term).length / queryTokens.length
      return tf * this.idf[term]
    })

    const similarities = this.tfIdfVectors.map((docVector, index) => ({
      item: this.documents[index],
      score: this.cosineSimilarity(queryVector, docVector),
    }))

    return similarities
      .filter((result) => result.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }
}

// Create search instances
const occupancySearch = new TFIDFSearch(occupancyData.filter((item) => item.scheme === "AIR"))
const constructionSearch = new TFIDFSearch(constructionData.filter((item) => item.scheme === "AIR"))

// Export search functions
export { occupancySearch, constructionSearch }

// Helper functions for backwards compatibility
export function searchOccupancy(query: string): SearchResult<OccupancyItem> | null {
  const results = occupancySearch.search(query, 1)
  return results.length > 0 ? results[0] : null
}

export function searchConstruction(query: string): SearchResult<ConstructionItem> | null {
  const results = constructionSearch.search(query, 1)
  return results.length > 0 ? results[0] : null
}
