import { SendHorizontal, Smile } from 'lucide-react'

interface ChatInputBarProps {
  placeholder: string
}

export function ChatInputBar({ placeholder }: ChatInputBarProps) {
  return (
    <div className="flex items-center gap-2 px-2.5 pt-1 pb-4">
      <div className="flex flex-1 items-center gap-2 rounded-full bg-white px-3 py-2.5 shadow-sm">
        <Smile className="h-5 w-5 shrink-0 text-slate-400" />
        <span className="flex-1 truncate text-sm text-slate-400">
          {placeholder}
        </span>
      </div>
      <span className="bg-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm">
        <SendHorizontal className="h-4.5 w-4.5 rtl:-scale-x-100" />
      </span>
    </div>
  )
}
