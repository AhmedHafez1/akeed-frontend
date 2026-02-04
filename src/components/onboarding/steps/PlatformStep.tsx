import { PLATFORM_OPTIONS } from '@/config/onboarding'
import { PlatformId } from '@/types/onboarding.model'

interface PlatformStepProps {
  t: (key: string) => string
  selectedPlatforms: PlatformId[]
  onToggle: (platform: PlatformId) => void
}

export function PlatformStep({
  t,
  selectedPlatforms,
  onToggle,
}: PlatformStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">
        {t('onboarding.selectPlatforms')}
      </h2>
      <p className="text-sm text-slate-600">
        {t('onboarding.platformsDescription')}
      </p>

      <div className="grid grid-cols-2 gap-4">
        {PLATFORM_OPTIONS.map((platform) => (
          <button
            key={platform.id}
            type="button"
            onClick={() => onToggle(platform.id)}
            className={`flex items-center justify-center gap-3 rounded-xl border-2 p-6 text-center text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:outline-none ${
              selectedPlatforms.includes(platform.id)
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="text-3xl">{platform.icon}</span>
            <span className="font-medium">{platform.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
