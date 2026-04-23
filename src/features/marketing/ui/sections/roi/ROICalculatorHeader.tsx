import { motion } from 'framer-motion'

interface ROICalculatorHeaderProps {
  title: string
}

export function ROICalculatorHeader({ title }: ROICalculatorHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="landing-section-header mb-10 sm:mb-12"
    >
      <h2 className="landing-section-title max-w-4xl">{title}</h2>
      <div className="mx-auto mt-1 h-1 w-24 rounded-full bg-linear-to-r from-emerald-500 to-emerald-600" />
    </motion.div>
  )
}
