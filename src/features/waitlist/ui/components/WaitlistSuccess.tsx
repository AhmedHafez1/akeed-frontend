import { CheckCircle } from 'lucide-react'

interface WaitlistSuccessProps {
  title: string
  info: string
}

export function WaitlistSuccess({ title, info }: WaitlistSuccessProps) {
  return (
    <div className="py-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle className="h-8 w-8 text-emerald-600" />
      </div>
      <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{info}</p>
    </div>
  )
}
