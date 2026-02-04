import { motion } from 'framer-motion'

interface ROICalculatorNoteProps {
  noteLabel: string
}

export function ROICalculatorNote({ noteLabel }: ROICalculatorNoteProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3 }}
      className="mt-6 sm:mt-8 md:mt-10"
    >
      <div className="rounded-xl border-2 border-emerald-100 bg-linear-to-r from-emerald-50/50 to-transparent p-4 sm:p-5">
        <p className="text-center text-sm leading-relaxed text-slate-600 sm:text-base lg:text-lg">
          <span className="font-bold text-emerald-700">💡 {noteLabel}</span>
        </p>
      </div>
    </motion.div>
  )
}
