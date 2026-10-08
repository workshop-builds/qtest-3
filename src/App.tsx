import planText from '../PLAN.md?raw'
import { parsePlan, type Milestone } from './plan.ts'

const PROJECT = {
  name: 'Quiet Test',
  ticker: 'QTEST',
  product: 'Pixel Badge',
  // The launcher's short description, quoted as written.
  shortDescription: 'Test token. No roadmap, no promises',
}

const FEATURES = [
  '32x32 pixel grid with a 16-color palette: draw and erase by click or touch',
  'Fill, undo, redo and left-right mirror',
  'Ticker of up to 10 characters in a pixel font, with 3 frame styles',
  'Crisp 512x512 badge PNG and 1500x500 banner PNG',
  'Six editable starter templates',
  'Your last badge is saved in your browser and restored on reload',
]

export default function App({ milestones = parsePlan(planText) }: { milestones?: Milestone[] }) {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8 text-neutral-100">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-widest text-amber-300 uppercase">
          {PROJECT.name} (${PROJECT.ticker})
        </p>
        <h1 className="mt-1 text-4xl font-black tracking-tight text-white">{PROJECT.product}</h1>
        <p className="mt-2 text-neutral-300">{PROJECT.shortDescription}</p>
      </header>

      <section aria-labelledby="what-heading" className="mb-8">
        <h2 id="what-heading" className="mb-3 text-xl font-bold text-white">
          What it will be
        </h2>
        <p className="mb-3 text-neutral-200">
          A small web app for making a pixel-art badge for a coin or a community, right in your browser. Make a clean
          avatar or banner for X, Telegram or Discord without design tools, even on your phone.
        </p>
        <ul className="list-disc space-y-1 pl-5 text-neutral-200">
          {FEATURES.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
        <p className="mt-3 rounded border border-neutral-700 bg-neutral-900 p-3 text-sm text-neutral-200">
          No accounts, no server, no tracking, no wallet. Everything stays in your browser.
        </p>
      </section>

      <section aria-labelledby="plan-heading">
        <h2 id="plan-heading" className="mb-3 text-xl font-bold text-white">
          The plan
        </h2>
        <ol className="space-y-3">
          {milestones.map((m) => (
            <li key={m.number} className="rounded border border-neutral-700 bg-neutral-900 p-4">
              <h3 className="font-bold text-white">
                <span className="text-amber-300">Milestone {m.number}:</span> {m.title}
              </h3>
              <details className="mt-2 text-sm text-neutral-300">
                <summary className="min-h-11 cursor-pointer py-2 text-neutral-200">
                  Acceptance criteria ({m.criteria.length})
                </summary>
                <ul className="list-disc space-y-1 pl-5">
                  {m.criteria.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </details>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-neutral-400">Status: project set up. Milestone 1 is next.</p>
      </section>
    </main>
  )
}
