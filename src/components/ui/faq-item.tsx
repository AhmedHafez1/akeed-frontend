import * as React from 'react'
import { AccordionContent, AccordionItem, AccordionTrigger } from './accordion'

export interface FAQItemProps {
  question: string
  answer: string
  value: string
}

export function FAQItem({ question, answer, value }: FAQItemProps) {
  return (
    <AccordionItem
      value={value}
      className="border-s-primary/20 border-s-4 ps-4"
    >
      <AccordionTrigger className="hover:text-primary text-start font-bold">
        {question}
      </AccordionTrigger>
      <AccordionContent className="text-muted-foreground">
        {answer}
      </AccordionContent>
    </AccordionItem>
  )
}
