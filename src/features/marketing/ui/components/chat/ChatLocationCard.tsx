import { MapPin } from 'lucide-react'

interface ChatLocationCardProps {
  title: string
  address: string
}

export function ChatLocationCard({ title, address }: ChatLocationCardProps) {
  return (
    <div className="overflow-hidden rounded-t-xl bg-slate-100">
      <div className="relative h-24 w-full overflow-hidden">
        <div className="absolute inset-0 bg-[#e5e7eb] bg-[radial-gradient(#9ca3af_1px,transparent_1px)] bg-size-[12px_12px]" />
        <div className="absolute top-3/4 left-0 h-3 w-full -translate-y-1/2 bg-white/60" />
        <div className="absolute top-0 left-2/3 h-full w-3 -translate-x-1/2 bg-white/60" />

        <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center">
          <div className="relative">
            <div className="absolute -bottom-1 left-1/2 h-2 w-4 -translate-x-1/2 rounded-[50%] bg-black/20 blur-[2px]" />
            <MapPin
              className="h-8 w-8 text-red-500 drop-shadow-md"
              fill="currentColor"
            />
          </div>
        </div>
      </div>

      <div className="bg-white/90 p-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <MapPin className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-slate-800">
              {title}
            </div>
            <div className="truncate text-[10px] text-slate-500">{address}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
