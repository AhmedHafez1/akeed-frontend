import { motion } from 'framer-motion'
import { ChevronDownIcon } from 'lucide-react'
import { useReducedMotion } from 'framer-motion'

interface ScrollDownArrowProps {
  to?: string
  className?: string
}

export function ScrollDownArrow({ to, className = '' }: ScrollDownArrowProps) {
  const shouldReduceMotion = useReducedMotion()

  const handleClick = () => {
    if (to) {
      document
        .getElementById(to)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: 0.3 }}
      className={`z-10 -translate-x-1/2 cursor-pointer sm:bottom-6 md:bottom-8 ${className}`}
      onClick={handleClick}
    >
      <ChevronDownIcon
        className={`h-6 w-6 text-emerald-600 sm:h-7 sm:w-7 md:h-8 md:w-8 ${
          shouldReduceMotion ? '' : 'animate-bounce'
        }`}
      />
    </motion.div>
  )
}

export default ScrollDownArrow
