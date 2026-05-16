import { createJsonLd } from '@/shared/lib/seo'

interface JsonLdProps {
  data: Record<string, unknown>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: createJsonLd(data) }}
    />
  )
}
