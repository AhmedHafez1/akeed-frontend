import { motion } from 'framer-motion'

export function ChatTypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="rounded-2xl rounded-bl-md border border-emerald-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          {[0, 0.2, 0.4].map((delay, i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay,
              }}
              className="bg-muted-foreground h-2 w-2 rounded-full"
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
