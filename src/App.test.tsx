import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import planText from '../PLAN.md?raw'
import App from './App.tsx'
import { parsePlan } from './plan.ts'

describe('parsePlan', () => {
  it('reads milestone headings and their criteria', () => {
    const md = [
      '# Plan',
      '- not a criterion',
      '## Milestone 1: First',
      '- a',
      '- b',
      '## Milestone 2: Second',
      '- c',
      '## Notes',
      '- ignored',
    ].join('\n')
    expect(parsePlan(md)).toEqual([
      { number: 1, title: 'First', criteria: ['a', 'b'] },
      { number: 2, title: 'Second', criteria: ['c'] },
    ])
  })

  it('finds milestones in PLAN.md, numbered from 1 in order', () => {
    const milestones = parsePlan(planText)
    expect(milestones.length).toBeGreaterThan(0)
    milestones.forEach((m, i) => {
      expect(m.number).toBe(i + 1)
      expect(m.criteria.length).toBeGreaterThan(0)
    })
  })
})

describe('project page', () => {
  it('shows the project name, what it will be, and the plan', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Pixel Badge' })).toBeInTheDocument()
    expect(screen.getByText('Quiet Test ($QTEST)')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'What it will be' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'The plan' })).toBeInTheDocument()
    for (const m of parsePlan(planText)) {
      expect(screen.getByRole('heading', { level: 3, name: `Milestone ${m.number}: ${m.title}` })).toBeInTheDocument()
    }
  })
})
