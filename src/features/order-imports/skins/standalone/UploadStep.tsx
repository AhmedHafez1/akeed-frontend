'use client'

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import Link from 'next/link'
import { Copy, FileSpreadsheet, Info, Upload, X } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { downloadBlob } from '@/shared/lib/download'
import { withLocale, type SupportedLocale } from '@/shared/lib/locale'
import { cn } from '@/shared/lib/utils'
import { Button, DialogClose, notify, Progress } from '@/shared/ui'
import { useUploadOrderImport } from '../../api/orderImportMutations'
import {
  downloadOrderImportTemplate,
  isOrderImportApiError,
  type OrderImportFormat,
} from '../../api/orderImportsApi'
import { describeFileError } from '../../domain/fileErrors'
import { formatFileSize } from '../../domain/format'
import {
  IMPORT_FILE_ACCEPT,
  MAX_IMPORT_ROWS,
  preCheckImportFile,
} from '../../domain/preCheck'
import { IMPORT_STEP_HEADING_ID } from './importHeading'
import { ImportNotice } from './ImportNotice'
import { ModalStepLayout } from './modal/ModalStepLayout'

type UploadState =
  | { phase: 'idle' }
  | { phase: 'sending'; file: File; percent: number }
  | { phase: 'reading'; file: File }
  | {
      phase: 'refused'
      code: string | undefined
      reference: string
      file?: File
    }

interface UploadStepProps {
  canEdit: boolean
  /** The file is a draft batch now: the modal moves on to checking it. */
  onUploaded: (batchId: string) => void
}

function referenceFor(error: unknown): string {
  const status = isOrderImportApiError(error) ? `HTTP ${error.status}` : 'NET'
  return `${status} · ${new Date().toISOString()}`
}

/** Step 1 (M1, M2): pick one file, check it, send it with progress. */
export function UploadStep({ canEdit, onUploaded }: UploadStepProps) {
  const t = useTranslations('orderImport')
  const locale = useLocale() as SupportedLocale
  const upload = useUploadOrderImport()
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [state, setState] = useState<UploadState>({ phase: 'idle' })
  const [dragging, setDragging] = useState(false)
  const busy = state.phase === 'sending' || state.phase === 'reading'

  // Closing the modal mid-upload abandons the file: no draft should land for
  // a modal nobody is looking at. One that already reached the server is
  // replaced by the merchant's next upload.
  useEffect(() => () => abortRef.current?.abort(), [])

  const chooseFile = () => inputRef.current?.click()

  const start = (file: File) => {
    const precheck = preCheckImportFile(file)
    if (precheck) {
      setState({ phase: 'refused', code: precheck, reference: '', file })
      return
    }
    const controller = new AbortController()
    abortRef.current = controller
    setState({ phase: 'sending', file, percent: 0 })
    upload.mutate(
      {
        file,
        signal: controller.signal,
        onProgress: (fraction) =>
          setState(
            fraction >= 1
              ? { phase: 'reading', file }
              : { phase: 'sending', file, percent: Math.round(fraction * 100) }
          ),
      },
      {
        onSuccess: (response) => onUploaded(response.batchId),
        onError: (error) => {
          if (controller.signal.aborted) {
            setState({ phase: 'idle' })
            return
          }
          setState({
            phase: 'refused',
            code: isOrderImportApiError(error) ? error.code : undefined,
            reference: referenceFor(error),
            file,
          })
        },
      }
    )
  }

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Reset so choosing the same file again still fires a change.
    event.target.value = ''
    if (file) start(file)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    if (!canEdit || busy) return
    const file = event.dataTransfer.files[0]
    if (file) start(file)
  }

  const downloadTemplate = async (format: OrderImportFormat) => {
    try {
      const template = await downloadOrderImportTemplate(format, locale)
      downloadBlob(template.blob, template.fileName)
    } catch {
      notify.error({ message: t('upload.templateFailed') })
    }
  }

  return (
    <ModalStepLayout
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {t('upload.autoAdvance')}
          </p>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="h-11 sm:h-10">
              {t('modal.cancel')}
            </Button>
          </DialogClose>
        </div>
      }
    >
      <h2
        id={IMPORT_STEP_HEADING_ID}
        tabIndex={-1}
        className="sr-only focus:outline-none"
      >
        {t('upload.heading')}
      </h2>

      <input
        ref={inputRef}
        type="file"
        accept={IMPORT_FILE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={onInputChange}
      />

      {!canEdit ? null : state.phase === 'refused' ? (
        <FileErrorCard
          code={state.code}
          reference={state.reference}
          fileName={state.file?.name}
          onChooseAnother={chooseFile}
          onRetry={() => state.file && start(state.file)}
        />
      ) : busy ? (
        <UploadProgressCard
          state={state}
          locale={locale}
          onCancel={() => abortRef.current?.abort()}
        />
      ) : (
        <div
          data-testid="order-import-dropzone"
          onDragOver={(event) => {
            event.preventDefault()
            if (canEdit) setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            'rounded-card flex flex-col items-center gap-4 border border-dashed px-6 py-10 text-center transition-colors motion-reduce:transition-none sm:py-14',
            dragging
              ? 'border-primary bg-primary-subtle'
              : 'border-border bg-muted/30'
          )}
        >
          <span className="bg-primary-subtle text-primary inline-flex size-16 items-center justify-center rounded-full">
            <Upload aria-hidden="true" className="size-7" />
          </span>
          <div className="space-y-1">
            <p className="text-foreground text-lg font-bold">
              {dragging ? t('upload.dropActive') : t('upload.dropTitle')}
            </p>
            <p className="text-muted-foreground text-sm">
              {t('upload.helper', { rows: MAX_IMPORT_ROWS })}
            </p>
          </div>
          <Button
            type="button"
            size="lg"
            className="h-12 w-full sm:w-auto"
            disabled={!canEdit}
            onClick={chooseFile}
          >
            {t('upload.choose')}
          </Button>
        </div>
      )}

      <p className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <Info aria-hidden="true" className="size-4 shrink-0" />
        <span>{t('upload.templatePrompt')}</span>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto min-h-11 p-0 sm:min-h-0"
          onClick={() => void downloadTemplate('xlsx')}
        >
          {t('upload.templateExcel')}
        </Button>
        <span aria-hidden="true">·</span>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto min-h-11 p-0 sm:min-h-0"
          onClick={() => void downloadTemplate('csv')}
        >
          {t('upload.templateCsv')}
        </Button>
      </p>
    </ModalStepLayout>
  )
}

function UploadProgressCard({
  state,
  locale,
  onCancel,
}: {
  state: Extract<UploadState, { phase: 'sending' | 'reading' }>
  locale: string
  onCancel: () => void
}) {
  const t = useTranslations('orderImport.upload')
  const reading = state.phase === 'reading'
  return (
    <div className="rounded-panel border-border bg-card space-y-4 border p-6">
      <div className="flex items-center gap-3">
        <FileSpreadsheet
          aria-hidden="true"
          className="text-primary size-6 shrink-0"
        />
        <p className="text-foreground min-w-0 flex-1 truncate text-sm font-medium">
          <bdi>{state.file.name}</bdi>
          <span className="text-muted-foreground">
            {' · '}
            {formatFileSize(state.file.size, locale)}
          </span>
        </p>
        {!reading && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <X aria-hidden="true" className="size-4" />
            {t('cancel')}
          </Button>
        )}
      </div>
      <Progress
        value={reading ? 100 : state.percent}
        aria-label={t('progressLabel')}
        indicatorClassName={reading ? 'animate-pulse' : undefined}
      />
      <p role="status" className="text-muted-foreground text-sm">
        {reading ? t('reading') : t('uploading', { percent: state.percent })}
      </p>
    </div>
  )
}

function FileErrorCard({
  code,
  reference,
  fileName,
  onChooseAnother,
  onRetry,
}: {
  code: string | undefined
  reference: string
  fileName?: string
  onChooseAnother: () => void
  onRetry: () => void
}) {
  const t = useTranslations('orderImport')
  const locale = useLocale()
  const description = describeFileError(code)
  const action = (() => {
    switch (description.action) {
      case 'chooseAnother':
        return (
          <Button type="button" onClick={onChooseAnother}>
            {t('fileErrors.actions.chooseAnother')}
          </Button>
        )
      case 'retry':
        return (
          <Button type="button" onClick={onRetry}>
            {t('fileErrors.actions.retry')}
          </Button>
        )
      case 'openSettings':
        return (
          <Button asChild>
            <Link href={withLocale('/settings', locale)}>
              {t('fileErrors.actions.openSettings')}
            </Link>
          </Button>
        )
      case 'contactSupport':
        return (
          <Button asChild variant="outline">
            <Link href={withLocale('/support', locale)}>
              {t('fileErrors.actions.contactSupport')}
            </Link>
          </Button>
        )
      case 'backToOrders':
        return (
          <Button asChild variant="outline">
            <Link href={withLocale('/verifications', locale)}>
              {t('fileErrors.actions.backToOrders')}
            </Link>
          </Button>
        )
    }
  })()

  return (
    <ImportNotice
      tone="critical"
      role="alert"
      className="rounded-panel p-6"
      title={t(`fileErrors.${description.key}.title`)}
    >
      <p>{t(`fileErrors.${description.key}.body`)}</p>
      {fileName && (
        <p className="mt-1 text-xs opacity-80">
          <bdi>{fileName}</bdi>
        </p>
      )}
      {description.showReference && reference && (
        <ReferenceLine reference={reference} />
      )}
      <div className="mt-4">{action}</div>
    </ImportNotice>
  )
}

function ReferenceLine({ reference }: { reference: string }) {
  const t = useTranslations('orderImport.fileErrors.generic')
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(reference)
      notify.success({ message: t('copied') })
    } catch {
      // The reference stays on screen to copy by hand.
    }
  }
  return (
    <p className="mt-2 flex flex-wrap items-center gap-2 text-xs">
      <span>
        {t('reference')}{' '}
        <bdi dir="ltr" className="font-mono">
          {reference}
        </bdi>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2"
        onClick={() => void copy()}
      >
        <Copy aria-hidden="true" className="size-3.5" />
        {t('copy')}
      </Button>
    </p>
  )
}
