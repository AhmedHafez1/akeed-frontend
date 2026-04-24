'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useReducedMotion } from 'framer-motion'

const logos = [
  { name: 'ExpandCart', src: '/images/landing/logos/exp-cart.png' },
  { name: 'EasyOrder', src: '/images/landing/logos/easy-order.png' },
  { name: 'Shopify', src: '/images/landing/logos/shopify.png' },
  { name: 'WooCommerce', src: '/images/landing/logos/woo.png' },
  { name: 'Salla', src: '/images/landing/logos/salla.png' },
  { name: 'Zid', src: '/images/landing/logos/zid.png' },
]

export function LogoTicker() {
  const pathname = usePathname()
  const locale = pathname?.split('/')[1] === 'en' ? 'en' : 'ar'
  const isRtl = locale === 'ar'

  return (
    <motion.div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-linear-to-r from-gray-50 via-white to-gray-50/80 py-4 shadow-sm shadow-slate-200/50 backdrop-blur-sm">
      <div className="container mx-auto">
        <div className="flex overflow-hidden mask-[linear-gradient(to_right,transparent_0,black_10%,black_90%,transparent_100%)]">
          <motion.div
            className="flex flex-none items-center gap-12 px-12 sm:gap-14 sm:px-14"
            animate={{
              x: isRtl ? ['0%', '50%'] : ['0%', '-50%'],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            {/* Render logos twice for seamless loop */}
            {[...logos, ...logos].map((logo, index) => (
              <div
                key={`${logo.name}-${index}`}
                className="flex h-12 min-w-31 shrink-0 items-center justify-center px-2"
              >
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={140}
                  height={40}
                  className="max-h-8 w-auto object-contain opacity-65 grayscale transition-[filter,opacity,transform] duration-300 hover:scale-[1.02] hover:opacity-100 hover:grayscale-0"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
