export interface RoofCoverType {
  type: string
  code: number
}

export const roofCoverTypes: RoofCoverType[] = [
  { type: "Unknown/default", code: 0 },
  { type: "Asphalt shingles", code: 1 },
  { type: "Wooden shingles", code: 2 },
  { type: "Clay/concrete tiles", code: 3 },
  { type: "Light metal panels", code: 4 },
  { type: "Slate", code: 5 },
  { type: "Built-up roof with gravel", code: 6 },
  { type: "Single ply membrane", code: 7 },
  { type: "Standing seam metal roofs", code: 8 },
  { type: "Built-up roof without gravel", code: 9 },
  { type: "Single ply membrane ballasted", code: 10 },
  { type: "Hurricane Wind-Rated Roof Coverings", code: 11 },
]
