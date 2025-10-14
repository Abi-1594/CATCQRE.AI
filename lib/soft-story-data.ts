export interface SoftStoryType {
  type: string
  code: number
}

export const softStoryTypes: SoftStoryType[] = [
  { type: "Unknown/default", code: 0 },
  { type: "No", code: 1 },
  { type: "Yes", code: 2 },
]
