import { Zap } from 'lucide-react'

interface ChatInputBarProps {
  placeholder: string
}

export function ChatInputBar({ placeholder }: ChatInputBarProps) {
  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2.5">
        <span className="flex-1 text-sm text-gray-400">{placeholder}</span>
        <Zap className="h-5 w-5 text-emerald-500" />
      </div>
    </div>
  )
}
