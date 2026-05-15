import { motion } from 'framer-motion'
import Image from 'next/image'

interface HeaderLogoProps {
  onClick: () => void
}

export function HeaderLogo({ onClick }: HeaderLogoProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex cursor-pointer items-center gap-3"
      onClick={onClick}
    >
      <Image
        src="/images/akeed-web-logo-horizontal.png"
        alt="Akeed Logo"
        width={200}
        height={100}
        className="object-contain"
      />
    </motion.div>
  )
}
