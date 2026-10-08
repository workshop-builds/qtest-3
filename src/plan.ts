export interface Milestone {
  number: number
  title: string
  criteria: string[]
}

const HEADING = /^## Milestone (\d+): (.+)$/

/** Parses the "## Milestone N: <title>" sections of PLAN.md and their bullet criteria. */
export function parsePlan(markdown: string): Milestone[] {
  const milestones: Milestone[] = []
  let current: Milestone | null = null
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trimEnd()
    const heading = HEADING.exec(line)
    if (heading) {
      current = { number: Number(heading[1]), title: heading[2].trim(), criteria: [] }
      milestones.push(current)
    } else if (line.startsWith('## ')) {
      current = null
    } else if (current && line.startsWith('- ')) {
      current.criteria.push(line.slice(2).trim())
    }
  }
  return milestones
}
