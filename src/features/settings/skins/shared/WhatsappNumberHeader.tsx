import Image from 'next/image'
import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ConnectionView } from '@/features/whatsapp-connect'
import styles from './WhatsappNumberHeader.module.css'

export function WhatsappNumberHeader({
  connection,
}: {
  connection: ConnectionView
}) {
  const t = useTranslations('whatsappConnect.tab.number')
  const connected = connection.progress.rows.some(
    (row) => row.id === 'number' && row.status === 'connected'
  )

  return (
    <header className={styles.header}>
      <Image
        src="/images/akeed-web-app-icon-512.png"
        width={44}
        height={44}
        alt="Akeed"
        className={styles.logo}
      />
      <span aria-hidden="true" className={styles.connector}>
        {connected && (
          <span className={styles.check}>
            <Check size={19} strokeWidth={3} />
          </span>
        )}
      </span>
      <div className={styles.identity}>
        <p>{t('title')}</p>
        <h2>
          {connection.phone ? (
            <bdi dir="ltr">{connection.phone}</bdi>
          ) : (
            t('noNumber')
          )}
        </h2>
      </div>
    </header>
  )
}
