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
    </motion.div>
  )
}
