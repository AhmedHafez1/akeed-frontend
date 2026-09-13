import { Zap } from 'lucide-react'

interface ChatInputBarProps {
  placeholder: string
}

export function ChatInputBar({ placeholder }: ChatInputBarProps) {
  return (
    <div className="border-border border-t bg-white px-4 py-3">
      <div className="border-border bg-muted flex items-center gap-2 rounded-full border px-4 py-2.5">
        <span className="text-muted-foreground flex-1 text-sm">
          {placeholder}
        </span>
        <Zap className="h-5 w-5 text-emerald-500" />
      </div>
    </div>
  )
}
