import { Card, CardContent } from './card'
import { Quote } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TestimonialCardProps {
  quote: string
  author: string
  role: string
  meta?: string
  className?: string
}

export function TestimonialCard({
  quote,
  author,
  role,
  meta,
  className,
}: TestimonialCardProps) {
  return (
    <Card
      className={cn(
        'border-s-primary border-s-4 transition-all hover:shadow-lg',
        className
      )}
    >
      <CardContent className="p-6">
        <Quote className="text-primary/40 mb-4 h-8 w-8" />
        <blockquote className="text-foreground mb-4 text-lg italic">
          &quot;{quote}&quot;
        </blockquote>
        <div>
          <p className="text-foreground font-bold">{author}</p>
          <p className="text-muted-foreground text-sm">{role}</p>
          {meta && <p className="text-muted-foreground mt-1 text-xs">{meta}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
