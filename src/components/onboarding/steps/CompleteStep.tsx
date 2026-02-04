interface CompleteStepProps {
  t: (key: string) => string
}

export function CompleteStep({ t }: CompleteStepProps) {
  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <svg
          className="h-10 w-10 text-emerald-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900">
        {t('onboarding.allSet')}
      </h2>
      <p className="text-slate-600">{t('onboarding.readyToStart')}</p>
    </div>
  )
}
