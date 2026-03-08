'use client'

import dynamic from 'next/dynamic'
import { Container } from '@/components/ui/container'
import { Section } from '@/components/ui/section'
import { PricingHeader } from './pricing/PricingHeader'
import { PricingMobileCards } from './pricing/PricingMobileCards'
import { PricingDesktopTable } from './pricing/PricingDesktopTable'
import { usePricing } from '@/features/marketing/hooks/usePricing'

const ReservationModal = dynamic(
  () => import('./ReservationModal').then((mod) => mod.ReservationModal),
  { ssr: false }
)

export default function Pricing() {
  const {
    t,
    tiers,
    checks,
    isReservationModalOpen,
    openReservationModal,
    closeReservationModal,
  } = usePricing()

  return (
    <Section id="pricing" className="px-4 sm:px-6 md:px-12 lg:px-24 xl:px-48">
      <Container>
        <PricingHeader
          title={t('title')}
          subtitle={t('subtitle')}
          checks={checks}
        />

        <PricingMobileCards tiers={tiers} t={t} />

        <PricingDesktopTable
          tiers={tiers}
          t={t}
          onCtaClick={openReservationModal}
        />
      </Container>

      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={closeReservationModal}
      />
    </Section>
  )
}
