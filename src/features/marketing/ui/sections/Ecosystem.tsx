'use client'

import { Store } from 'lucide-react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import type { ReactNode } from 'react'
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
    <div
      className={cn(
        'text-foreground/75 flex shrink-0 items-center gap-2.5 rounded-full px-3.5 py-1.5 font-medium whitespace-nowrap'
      )}
    >
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center',
          markClassName
        )}
      >
        {mark}
      </span>
      <span className="text-sm sm:text-base">{label}</span>
    </div>
  )
}

function Ecosystem() {
  const t = useTranslations('ecosystem')

  const channels: Channel[] = [
    {
      id: 'shopify',
      label: 'Shopify',
      mark: <PngMark src="/images/landing/logos/shopify_icon_1.png" />,
    },
    {
      id: 'independent',
      label: t('independent'),
      mark: (
        <span className="bg-muted text-foreground/80 flex h-7 w-7 items-center justify-center rounded-full">
          <Store className="h-6 w-6" strokeWidth={2} />
        </span>
      ),
    },
    { id: 'facebook', label: 'Facebook', mark: <FacebookMark /> },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      mark: (
        <PngMark
          src="/images/landing/logos/wa_icon_1.png"
          className="scale-[1.35]"
        />
      ),
    },
    {
      id: 'woocommerce',
      label: 'WooCommerce',
      markClassName: 'w-9',
      mark: (
        <PngMark src="/images/landing/logos/woo.png" className="scale-[1.5]" />
      ),
    },
    {
      id: 'easyorders',
      label: 'EasyOrders',
      // The source file is the full wordmark; show only its icon.
      mark: (
        <span className="block h-5 w-[1.05rem] overflow-hidden">
          <Image
            src="/images/landing/logos/easy-order.png"
            alt=""
            width={561}
            height={117}
            unoptimized
            draggable={false}
            className="h-5 w-auto max-w-none"
          />
        </span>
      ),
    },
  ]

  /*
   * Each group repeats the list twice so one group is always wider than the
   * viewport; the track holds two identical groups and slides by exactly
   * -50%, which lands the second group where the first began — no jump.
   */
  const group = (duplicate: boolean) => (
    <div
      className={cn(
        'flex shrink-0 items-center gap-x-6 pe-6 sm:gap-x-10 sm:pe-10',
        'motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:gap-y-3 motion-reduce:pe-0',
        duplicate && 'motion-reduce:hidden'
      )}
    >
      {[0, 1].map((copy) =>
        channels.map(({ id, ...channel }) => (
          <div
            key={`${copy}-${id}`}
            className={cn('contents', copy === 1 && 'motion-reduce:hidden')}
          >
            <ChannelItem {...channel} />
          </div>
        ))
      )}
    </div>
  )

  return (
    <div className="px-4 py-9 sm:px-6 sm:py-11 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-5 sm:gap-6">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-[0.18em] uppercase rtl:text-lg rtl:tracking-normal">
          {t('eyebrow')}
        </h2>

        {/* Screen readers get the plain list; the moving track is decorative. */}
        <ul className="sr-only">
          {channels.map(({ id, label }) => (
            <li key={id}>{label}</li>
          ))}
        </ul>

        <div
          aria-hidden
          dir="ltr"
          className="w-full overflow-hidden mask-[linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] motion-reduce:mask-none"
        >
          <div className="animate-marquee flex w-max py-1 hover:[animation-play-state:paused] motion-reduce:w-full motion-reduce:animate-none motion-reduce:justify-center">
            {group(false)}
            {group(true)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Ecosystem
