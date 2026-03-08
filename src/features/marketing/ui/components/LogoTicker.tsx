'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'

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
    <motion.div className="overflow-hidden border-y border-gray-200 bg-linear-to-r from-gray-50 to-white py-4">
      <div className="container mx-auto">
        <div className="flex overflow-hidden mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <motion.div
            className="flex flex-none gap-16 px-8" // Use px instead of pr to keep spacing even on both sides
            animate={{
              // If RTL, move 50% to the right. If LTR, move -50% to the left.
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
                className="flex shrink-0 items-center"
              >
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={140}
                  height={40}
                  className="h-10 w-auto object-contain opacity-70 transition-all duration-300 hover:opacity-100"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
