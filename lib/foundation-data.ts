export interface FoundationType {
  type: string
  code: number
}

export const foundationTypes: FoundationType[] = [
  { type: "Unknown/default", code: 0 },
  { type: "Masonry basement", code: 1 },
  { type: "Concrete basement", code: 2 },
  { type: "Masonry wall", code: 3 },
  { type: "Crawl space cripple wall", code: 4 },
  { type: "Crawl space masonry", code: 5 },
  { type: "Post & pier", code: 6 },
  { type: "Footing", code: 7 },
  { type: "Mat / slab", code: 8 },
  { type: "Pile", code: 9 },
  { type: "No basement", code: 10 },
  { type: "Engineering foundation", code: 11 },
  { type: "Crawlspace – raised (wood)", code: 12 },
]
