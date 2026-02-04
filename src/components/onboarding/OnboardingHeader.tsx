interface OnboardingHeaderProps {
  title: string
  subtitle: string
}

export function OnboardingHeader({ title, subtitle }: OnboardingHeaderProps) {
  return (
    <div className="space-y-2 text-center">
      <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
      <p className="text-sm text-slate-600">{subtitle}</p>
    </div>
  )
}
