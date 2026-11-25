'use client'

import { Store } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import type { ReactNode } from 'react'
import { getStartRoutes } from '@/shared/config/commerceSources'
import { cn } from '@/shared/lib/utils'

interface Channel {
  id: string
  label: string
  mark: ReactNode
  /** Wide marks need a wider box to read at the same optical size. */
  markClassName?: string
}

function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-full w-full">
      <path
        fill="#0866FF"
        d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"
      />
    </svg>
  )
}

function PngMark({ src, className }: { src: string; className?: string }) {
  return (
    <Image
      src={src}
      alt=""
      width={48}
      height={48}
      unoptimized
      draggable={false}
      className={cn('h-full w-full object-contain', className)}
    />
  )
}

function ChannelItem({ label, mark, markClassName }: Omit<Channel, 'id'>) {
  return (
    <>
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center',
          markClassName
        )}
      >
        {mark}
      </span>
      <span className="text-foreground/75 text-xs font-medium whitespace-nowrap sm:text-base">
        {label}
      </span>
    </>
  )
}

function Ecosystem() {
  const t = useTranslations('ecosystem')

  // A store appears only while its start route is switched on.
  const startRouteIds = new Set(getStartRoutes().map((route) => route.id))

  const allSources: Array<Channel & { requiresStartRoute?: boolean }> = [
    {
      id: 'shopify',
      label: 'Shopify',
      mark: <PngMark src="/images/landing/logos/shopify_icon_1.png" />,
    },
    {
      id: 'woocommerce',
      requiresStartRoute: true,
      label: 'WooCommerce',
      markClassName: 'w-11',
      mark: (
        <PngMark src="/images/landing/logos/woo.png" className="scale-[1.5]" />
      ),
    },
    {
      id: 'easyorders',
      requiresStartRoute: true,
      label: 'EasyOrders',
      // The source file is the full wordmark; show only its icon.
      mark: (
        <span className="block h-7 w-[1.47rem] overflow-hidden">
          <Image
            src="/images/landing/logos/easy-order.png"
            alt=""
            width={561}
            height={117}
            unoptimized
            draggable={false}
            className="h-7 w-auto max-w-none"
          />
        </span>
      ),
    },
    {
      id: 'independent',
      label: t('independent'),
      mark: (
        <span className="bg-muted text-foreground/80 flex h-8 w-8 items-center justify-center rounded-full">
          <Store aria-hidden className="h-5 w-5" strokeWidth={2} />
        </span>
      ),
    },
    { id: 'facebook', label: 'Facebook', mark: <FacebookMark /> },
  ]

  const sources = allSources.filter(
    (source) => !source.requiresStartRoute || startRouteIds.has(source.id)
  )

  return (
    <div className="w-full px-4 py-10 sm:px-6 sm:py-12 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-[0.18em] uppercase rtl:text-lg rtl:tracking-normal">
          {t('eyebrow')}
        </h2>

        <div className="flex w-full flex-col items-center gap-6 lg:flex-row lg:justify-center lg:gap-10">
          {/* Mobile: three per row, icon over label, so nothing is clipped. */}
          <ul
            aria-label={t('sources_label')}
            className="flex w-full max-w-sm flex-wrap justify-center gap-y-5 sm:max-w-none sm:gap-x-10 lg:w-auto"
          >
            {sources.map(({ id, ...source }) => (
              <li
                key={id}
                className="flex basis-1/3 flex-col items-center gap-1.5 sm:basis-auto sm:flex-row sm:gap-2.5"
              >
                <ChannelItem {...source} />
              </li>
            ))}
          </ul>

          <div
            aria-hidden
            className="bg-border h-px w-16 shrink-0 lg:h-10 lg:w-px"
          />

          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs font-medium sm:text-sm">
              {t('channel')}
            </span>
            <span className="flex items-center gap-2.5">
              <ChannelItem
                label="WhatsApp"
                mark={
                  <PngMark
                    src="/images/landing/logos/wa_icon_1.png"
                    className="scale-[1.35]"
                  />
                }
              />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ecosystem
