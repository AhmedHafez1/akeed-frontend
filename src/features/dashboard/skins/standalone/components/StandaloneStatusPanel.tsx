interface StandaloneStatusPanelProps {
  activeLabel: string
  title: string
  description: string
  workflowTitle: string
  workflowDescription: string
  reviewTitle: string
  reviewDescription: string
}

export function StandaloneStatusPanel({
  activeLabel,
  title,
  description,
  workflowTitle,
  workflowDescription,
  reviewTitle,
  reviewDescription,
}: StandaloneStatusPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              {activeLabel}
            </span>
          </div>
          <p className="max-w-3xl text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">
            {workflowTitle}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {workflowDescription}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">{reviewTitle}</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {reviewDescription}
          </p>
        </div>
      </div>
    </section>
  )
}
