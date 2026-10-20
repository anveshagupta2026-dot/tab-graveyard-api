import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react"

type Cause = "CRASH" | "UNRESPONSIVE" | "ACCIDENTAL_CLOSE" | "MEMORY_HOG"

type BuriedTab = {
  id: number
  title: string
  url: string
  cause: Cause
  buriedAt: number
  recoverable: boolean
}

const MINUTE = 60_000
const RECOVERY_WINDOW = 10 * MINUTE

const seedTabs: BuriedTab[] = [
  {
    id: 1,
    title: "React Performance Profiler",
    url: "react.dev/reference/react/Profiler",
    cause: "MEMORY_HOG",
    buriedAt: Date.now() - 4.3 * MINUTE,
    recoverable: true,
  },
  {
    id: 2,
    title: "WebSocket Debug Console",
    url: "localhost:3000/debug/socket",
    cause: "UNRESPONSIVE",
    buriedAt: Date.now() - 7.7 * MINUTE,
    recoverable: true,
  },
  {
    id: 3,
    title: "Tailwind CSS Documentation",
    url: "tailwindcss.com/docs",
    cause: "ACCIDENTAL_CLOSE",
    buriedAt: Date.now() - 12 * MINUTE,
    recoverable: false,
  },
  {
    id: 4,
    title: "Production Error Logs",
    url: "sentry.io/issues/5394102",
    cause: "CRASH",
    buriedAt: Date.now() - 31 * MINUTE,
    recoverable: false,
  },
  {
    id: 5,
    title: "The Ultimate TypeScript Guide",
    url: "typescriptlang.org/docs/handbook",
    cause: "MEMORY_HOG",
    buriedAt: Date.now() - 74 * MINUTE,
    recoverable: false,
  },
  {
    id: 6,
    title: "Figma — Dashboard Explorations",
    url: "figma.com/file/graveyard-v2",
    cause: "ACCIDENTAL_CLOSE",
    buriedAt: Date.now() - 3.1 * 60 * MINUTE,
    recoverable: false,
  },
]

const causes: Array<"All" | Cause> = [
  "All",
  "CRASH",
  "UNRESPONSIVE",
  "ACCIDENTAL_CLOSE",
  "MEMORY_HOG",
]

const causeLabels: Record<Cause, string> = {
  CRASH: "CRASH",
  UNRESPONSIVE: "UNRESPONSIVE",
  ACCIDENTAL_CLOSE: "ACCIDENTAL CLOSE",
  MEMORY_HOG: "MEMORY HOG",
}

function Icon({
  children,
  className = "size-5",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

function formatAgo(timestamp: number, now: number) {
  const minutes = Math.max(1, Math.floor((now - timestamp) / MINUTE))
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`
  const hours = Math.floor(minutes / 60)
  return `${hours} hr${hours === 1 ? "" : "s"} ago`
}

function formatCountdown(timestamp: number, now: number) {
  const remaining = Math.max(0, RECOVERY_WINDOW - (now - timestamp))
  const minutes = Math.floor(remaining / MINUTE)
  const seconds = Math.floor((remaining % MINUTE) / 1000)
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
}

function TabCard({
  tab,
  now,
  onResurrect,
}: {
  tab: BuriedTab
  now: number
  onResurrect: (id: number) => void
}) {
  const remaining = RECOVERY_WINDOW - (now - tab.buriedAt)
  const isActive = tab.recoverable && remaining > 0
  const progress = Math.max(
    0,
    Math.min(100, (remaining / RECOVERY_WINDOW) * 100),
  )

  return (
    <article
      className={`tomb-card ${
        isActive ? "tomb-card--active" : "tomb-card--dead"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={`site-mark ${isActive ? "" : "site-mark--dead"}`}>
          <Icon className="size-5">
            <path d="M8 2h8l4 4v16H4V6l4-4Z" />
            <path d="M8 2v5h8V2M8 12h8M8 16h5" />
          </Icon>
        </div>
        <span className={`cause-badge cause-${tab.cause.toLowerCase()}`}>
          {causeLabels[tab.cause]}
        </span>
      </div>

      <div className="mt-7 min-w-0">
        <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-slate-100">
          {tab.title}
        </h3>
        <p className="mt-1.5 truncate font-mono text-[11px] text-slate-500">
          {tab.url}
        </p>
      </div>

      <div className="my-5 h-px bg-slate-700/60" />

      <div className="flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1.5 font-medium text-slate-500">
          <Icon className="size-3.5">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </Icon>
          Buried {formatAgo(tab.buriedAt, now)}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">
          #{String(tab.id).padStart(4, "0")}
        </span>
      </div>

      {isActive ? (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-amber-400">
              <span className="size-1.5 animate-pulse rounded-full bg-amber-400" />
              Recovery window
            </span>
            <span className="font-mono text-xs font-semibold text-amber-300">
              {formatCountdown(tab.buriedAt, now)} remaining
            </span>
          </div>
          <div className="timer-track">
            <span style={{ width: `${progress}%` }} />
          </div>
          <button
            className="resurrect-button"
            onClick={() => onResurrect(tab.id)}
          >
            <Icon className="size-4">
              <path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z" />
            </Icon>
            Resurrect
          </button>
        </div>
      ) : (
        <div className="rip-status">
          <Icon className="size-4">
            <path d="M7 21V7a5 5 0 0 1 10 0v14M4 21h16M9.5 10h5M12 7v6" />
          </Icon>
          Resting in peace
        </div>
      )}
    </article>
  )
}

export default function App() {
  const [tabs, setTabs] = useState(seedTabs)
  const [filter, setFilter] = useState<"All" | Cause>("All")
  const [query, setQuery] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!modalOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setModalOpen(false)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [modalOpen])

  const visibleTabs = useMemo(() => {
    const search = query.trim().toLowerCase()
    return tabs.filter(
      (tab) =>
        (filter === "All" || tab.cause === filter) &&
        (!search ||
          tab.title.toLowerCase().includes(search) ||
          tab.url.toLowerCase().includes(search)),
    )
  }, [filter, query, tabs])

  const resurrect = (id: number) => {
    setTabs((current) => current.filter((tab) => tab.id !== id))
  }

  const buryTab = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const title = String(data.get("title") ?? "").trim()
    const url = String(data.get("url") ?? "").trim()
    const cause = String(data.get("cause")) as Cause
    if (!title || !url) return

    setTabs((current) => [
      {
        id: Math.max(0, ...current.map((tab) => tab.id)) + 1,
        title,
        url: url.replace(/^https?:\/\//, ""),
        cause,
        buriedAt: Date.now(),
        recoverable: true,
      },
      ...current,
    ])
    setModalOpen(false)
    event.currentTarget.reset()
  }

  return (
    <div className="app-shell min-h-screen text-slate-200">
      <header className="topbar">
        <div className="page-width flex h-full items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5">
              <div className="brand-mark">
                <Icon className="size-[18px]">
                  <path d="M7 21V7a5 5 0 0 1 10 0v14M4 21h16M9 10h6M12 7v6" />
                </Icon>
              </div>
              <h1 className="text-[17px] font-bold tracking-[-0.03em] text-white">
                Tab Graveyard
              </h1>
            </div>
            <div className="hidden h-5 w-px bg-slate-700/70 sm:block" />
            <div className="status-pill hidden sm:flex">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
              </span>
              API Connected
              <span className="text-emerald-700">·</span>
              <span className="font-mono text-emerald-400/80">
                localhost:8000
              </span>
            </div>
          </div>
          <button className="primary-button" onClick={() => setModalOpen(true)}>
            <Icon className="size-4">
              <path d="M12 5v14M5 12h14" />
            </Icon>
            Bury new tab
          </button>
        </div>
      </header>

      <main className="page-width pb-14 pt-9">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="eyebrow">Graveyard overview</p>
            <h2 className="mt-1.5 text-[26px] font-bold tracking-[-0.035em] text-white">
              Your closed tabs, memorialized.
            </h2>
          </div>
          <p className="hidden text-xs text-slate-600 md:block">
            Last sync · just now
          </p>
        </div>

        <section
          className="grid gap-3 md:grid-cols-3"
          aria-label="Analytics overview"
        >
          <div className="kpi-card">
            <div className="kpi-icon kpi-icon--purple">
              <Icon>
                <path d="M7 21V7a5 5 0 0 1 10 0v14M4 21h16M9 10h6M12 7v6" />
              </Icon>
            </div>
            <div>
              <p className="kpi-label">Total buried tabs</p>
              <p className="kpi-value">
                42 <span>tabs</span>
              </p>
            </div>
            <span className="kpi-change">+8 this week</span>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon kpi-icon--blue">
              <Icon>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </Icon>
            </div>
            <div>
              <p className="kpi-label">Avg. tab lifespan</p>
              <p className="kpi-value">
                3 <span>hr</span> 12 <span>min</span>
              </p>
            </div>
            <span className="kpi-meta">across 7 days</span>
          </div>
          <div className="kpi-card">
            <div className="kpi-icon kpi-icon--amber">
              <Icon>
                <path d="M12 3 2.8 19h18.4L12 3Z" />
                <path d="M12 9v4M12 16h.01" />
              </Icon>
            </div>
            <div>
              <p className="kpi-label">Top cause of death</p>
              <p className="kpi-value kpi-value--cause">MEMORY_HOG</p>
            </div>
            <span className="kpi-percentage">45%</span>
          </div>
        </section>

        <section className="mt-8" aria-labelledby="buried-tabs-heading">
          <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              <h2
                id="buried-tabs-heading"
                className="text-sm font-semibold text-slate-100"
              >
                Buried tabs
              </h2>
              <span className="count-pill">{visibleTabs.length}</span>
            </div>
            <label className="search-box">
              <Icon className="size-4 shrink-0">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </Icon>
              <span className="sr-only">Search buried tabs</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search buried tabs by title or URL..."
              />
              <kbd>⌘ K</kbd>
            </label>
          </div>

          <div className="filter-row">
            <Icon className="size-3.5 text-slate-600">
              <path d="M4 5h16M7 12h10M10 19h4" />
            </Icon>
            {causes.map((cause) => (
              <button
                key={cause}
                onClick={() => setFilter(cause)}
                className={`filter-pill ${
                  filter === cause ? "filter-pill--active" : ""
                }`}
              >
                {cause === "All" ? "All causes" : causeLabels[cause]}
              </button>
            ))}
          </div>

          {visibleTabs.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleTabs.map((tab) => (
                <TabCard
                  key={tab.id}
                  tab={tab}
                  now={now}
                  onResurrect={resurrect}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <Icon>
                  <path d="M7 21V7a5 5 0 0 1 10 0v14M4 21h16M9 10h6" />
                </Icon>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-300">
                No tabs found here
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Try another search or cause of death.
              </p>
            </div>
          )}
        </section>
      </main>

      {modalOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setModalOpen(false)
          }}
        >
          <section
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">New interment</p>
                <h2
                  id="modal-title"
                  className="mt-1 text-xl font-bold text-white"
                >
                  Bury a tab
                </h2>
                <p className="mt-1.5 text-xs leading-5 text-slate-500">
                  You’ll have ten minutes to change your mind.
                </p>
              </div>
              <button
                className="close-button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
              >
                <Icon>
                  <path d="m6 6 12 12M18 6 6 18" />
                </Icon>
              </button>
            </div>
            <form className="mt-6 space-y-4" onSubmit={buryTab}>
              <label className="form-field">
                <span>Tab title</span>
                <input
                  name="title"
                  autoFocus
                  required
                  placeholder="e.g. React documentation"
                />
              </label>
              <label className="form-field">
                <span>URL</span>
                <input
                  name="url"
                  type="url"
                  required
                  placeholder="https://example.com/page"
                />
              </label>
              <label className="form-field">
                <span>Cause of death</span>
                <select name="cause" defaultValue="MEMORY_HOG">
                  <option value="MEMORY_HOG">Memory hog</option>
                  <option value="CRASH">Crash</option>
                  <option value="UNRESPONSIVE">Unresponsive</option>
                  <option value="ACCIDENTAL_CLOSE">Accidental close</option>
                </select>
              </label>
              <button type="submit" className="bury-button">
                <Icon className="size-4">
                  <path d="M7 21V7a5 5 0 0 1 10 0v14M4 21h16M9 10h6M12 7v6" />
                </Icon>
                Bury tab
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
