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
      className="mb-8 text-center sm:mb-12"
    >
      <h2 className="mb-3 text-2xl leading-tight font-black text-slate-700 sm:text-3xl md:text-4xl lg:text-5xl">
        {title}
      </h2>
      <div className="mx-auto h-1 w-24 rounded-full bg-linear-to-r from-emerald-500 to-emerald-600" />
    </motion.div>
  )
}
