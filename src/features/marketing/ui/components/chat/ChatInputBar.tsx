import { SendHorizontal, Smile } from 'lucide-react'

interface ChatInputBarProps {
  placeholder: string
}

export function ChatInputBar({ placeholder }: ChatInputBarProps) {
  return (
    <div className="flex items-center gap-2 px-2.5 pt-1 pb-4">
      <div className="bg-card flex flex-1 items-center gap-2 rounded-full px-3 py-2.5 shadow-sm dark:bg-[#202c33]">
        <Smile className="text-muted-foreground/70 h-5 w-5 shrink-0" />
        <span className="text-muted-foreground/70 flex-1 truncate text-sm">
          {placeholder}
        </span>
      </div>
      <span className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm">
        <SendHorizontal className="h-4.5 w-4.5 rtl:-scale-x-100" />
      </span>
    </div>
  )
}
