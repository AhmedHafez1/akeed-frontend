import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import type { MouseEvent } from 'react'

interface HeaderLogoProps {
  href: string
  onClick: (event: MouseEvent<HTMLAnchorElement>) => void
}

export function HeaderLogo({ href, onClick }: HeaderLogoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex items-center gap-3"
    >
      <Link href={href} onClick={onClick} aria-label="Akeed home">
        <Image
          src="/images/akeed-web-logo-horizontal.png"
          alt="Akeed Logo"
          width={130}
          height={70}
          className="object-contain"
        />
      </Link>
    </motion.div>
  )
}
