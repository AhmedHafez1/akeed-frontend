import { cn } from '@/shared/lib/utils'

interface WhatsAppTypingIndicatorProps {
  className?: string
}

/** Three bouncing dots in an incoming bubble: the business is typing. */
export function WhatsAppTypingIndicator({
  className,
}: WhatsAppTypingIndicatorProps) {
  return (
    <div
      className={cn(
        'flex w-fit gap-1 rounded-xl rounded-ss-sm bg-white px-3.5 py-3 shadow-sm dark:bg-[#202c33]',
        className
      )}
    >
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          style={{ animationDelay: `${delay}ms` }}
          className="h-2 w-2 rounded-full bg-slate-400 motion-safe:animate-bounce dark:bg-slate-500"
        />
      ))}
    </div>
  )
}
