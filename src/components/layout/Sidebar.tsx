import Link from 'next/link'

interface SidebarProps {
  locale?: string
  className?: string
}

export function Sidebar({ locale = 'en', className }: SidebarProps) {
  return (
    <aside
      className={
        className ??
        'relative hidden w-90 flex-col justify-between overflow-hidden border-r border-slate-200 bg-white p-10 lg:flex'
      }
    >
      <div>
        <Link
          href={`/${locale}`}
          className="text-2xl font-semibold tracking-tight text-slate-900"
        >
          Akeed
        </Link>
        <p className="mt-4 text-sm leading-relaxed text-slate-600">
          Focused onboarding for modern commerce teams.
        </p>
        <div className="mt-8 space-y-3 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Clean, distraction-free flow
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Secure access with modern UX
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Responsive on every screen
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-400">© 2026 Akeed</div>
    </aside>
  )
}
