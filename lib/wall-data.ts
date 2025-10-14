export interface WallType {
  type: string
  code: number
}

// Note: You provided soft story types for wall type, assuming this was an error
// Using generic wall type codes based on common construction materials
export const wallTypes: WallType[] = [
  { type: "Unknown/default", code: 0 },
  { type: "Wood frame", code: 1 },
  { type: "Masonry", code: 2 },
  { type: "Concrete", code: 3 },
  { type: "Steel", code: 4 },
  { type: "Stucco", code: 5 },
  { type: "Vinyl siding", code: 6 },
  { type: "Brick veneer", code: 7 },
  { type: "Stone veneer", code: 8 },
  { type: "Fiber cement", code: 9 },
]
