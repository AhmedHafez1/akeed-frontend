import { AlertCircle } from 'lucide-react'

interface WaitlistErrorProps {
  message: string
}

export function WaitlistError({ message }: WaitlistErrorProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
