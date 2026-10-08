'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/shared/lib/http'
import { createLogger } from '@/shared/lib/logger'
import {
  disconnectEasyOrders,
  fetchEasyOrdersConnection,
  resetEasyOrdersWebhookSecrets,
  saveEasyOrdersOrderSettings,
  saveEasyOrdersWebhookSecrets,
  startEasyOrdersInstall,
} from './easyOrdersApi'
import {
  resolveEasyOrdersConnectView,
  type EasyOrdersConnectionStatus,
  type EasyOrdersConnectView,
  type EasyOrdersOrderSettings,
  type EasyOrdersWebhookSecrets,
} from './easyOrders.types'

const logger = createLogger('Onboarding')

/** While the merchant is in the EasyOrders tab; the callback lands there. */
export const EASYORDERS_POLL_INTERVAL_MS = 4000

function errorCode(error: unknown): string {
  return error instanceof ApiError && error.code ? error.code : 'UNAVAILABLE'
}

/**
 * What to log for a failed call: the code plus the HTTP status, or the kind
 * of failure when no answer came. Never the server's message or the request.
 */
function failureSummary(error: unknown): string {
  const code = errorCode(error)
  if (error instanceof ApiError) return `${code} (HTTP ${error.status})`
  if (error instanceof Error) return `${code} (${error.name}: ${error.message})`
  return code
}

export interface EasyOrdersConnectionController {
  view: EasyOrdersConnectView
  status: EasyOrdersConnectionStatus | null
  canManage: boolean
  isStarting: boolean
  /** Why the last "Connect" click failed before EasyOrders was opened. */
  startErrorCode: string | null
  isSavingSecrets: boolean
  secretsErrorCode: string | null
  /** True right after a successful save, until the next one starts. */
  secretsSaved: boolean
  connect: () => Promise<void>
  /** The merchant says they did not accept in EasyOrders. */
  markCancelled: () => void
  reload: () => Promise<void>
  saveSecrets: (secrets: EasyOrdersWebhookSecrets) => Promise<boolean>
  isResettingSecrets: boolean
  resetSecretsErrorCode: string | null
  /** Forgets the stored secrets so Akeed learns them again. */
  resetSecrets: () => Promise<boolean>
  isSavingSettings: boolean
  settingsErrorCode: string | null
  /** True right after a successful save, until the next one starts. */
  settingsSaved: boolean
  saveSettings: (settings: EasyOrdersOrderSettings) => Promise<boolean>
  isDisconnecting: boolean
  disconnectErrorCode: string | null
  /** Resolves true once the source is disconnected. Reconnect is `connect`. */
  disconnect: () => Promise<boolean>
  clearDisconnectError: () => void
}

/**
 * The EasyOrders connection for the signed-in organization.
 *
 * EasyOrders calls Akeed back from the merchant's browser in its own tab and
 * may never redirect here, so this page does not wait for a redirect: it
 * polls the status while a request is open and when the tab regains focus.
 */
export function useEasyOrdersConnection(
  locale: 'ar' | 'en'
): EasyOrdersConnectionController {
  const [status, setStatus] = useState<EasyOrdersConnectionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [startErrorCode, setStartErrorCode] = useState<string | null>(null)
  const [isSavingSecrets, setIsSavingSecrets] = useState(false)
  const [secretsErrorCode, setSecretsErrorCode] = useState<string | null>(null)
  const [secretsSaved, setSecretsSaved] = useState(false)
  const [isResettingSecrets, setIsResettingSecrets] = useState(false)
  const [resetSecretsErrorCode, setResetSecretsErrorCode] = useState<
    string | null
  >(null)
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsErrorCode, setSettingsErrorCode] = useState<string | null>(
    null
  )
  const [settingsSaved, setSettingsSaved] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [disconnectErrorCode, setDisconnectErrorCode] = useState<string | null>(
    null
  )
  const activeRef = useRef(true)

  const reload = useCallback(async () => {
    try {
      const next = await fetchEasyOrdersConnection()
      if (!activeRef.current) return
      setStatus(next)
      setLoadFailed(false)
    } catch (error) {
      logger.error('Failed to load the EasyOrders connection', error)
      if (activeRef.current) setLoadFailed(true)
    } finally {
      if (activeRef.current) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    activeRef.current = true
    void reload()
    return () => {
      activeRef.current = false
    }
  }, [reload])

  const isPending = status?.state === 'pending'
  useEffect(() => {
    if (!isPending) return
    const timer = window.setInterval(
      () => void reload(),
      EASYORDERS_POLL_INTERVAL_MS
    )
    const onFocus = () => void reload()
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
    }
  }, [isPending, reload])

  const connect = useCallback(async () => {
    setIsStarting(true)
    setStartErrorCode(null)
    // Opened inside the click, before the request, or the browser blocks it.
    const tab = window.open('', '_blank')
    try {
      const started = await startEasyOrdersInstall(locale)
      if (tab) {
        tab.opener = null
        tab.location.replace(started.installUrl)
      } else {
        window.location.assign(started.installUrl)
      }
      setCancelled(false)
      await reload()
    } catch (error) {
      tab?.close()
      logger.error('Failed to start the EasyOrders install', error)
      if (activeRef.current) setStartErrorCode(errorCode(error))
    } finally {
      if (activeRef.current) setIsStarting(false)
    }
  }, [locale, reload])

  const markCancelled = useCallback(() => setCancelled(true), [])

  const saveSecrets = useCallback(async (secrets: EasyOrdersWebhookSecrets) => {
    setIsSavingSecrets(true)
    setSecretsErrorCode(null)
    setSecretsSaved(false)
    try {
      const next = await saveEasyOrdersWebhookSecrets(secrets)
      if (!activeRef.current) return true
      setStatus(next)
      setSecretsSaved(true)
      return true
    } catch (error) {
      // The error is logged by code only: the request carried the secrets.
      logger.error(
        'Failed to save the EasyOrders webhook secrets',
        failureSummary(error)
      )
      if (activeRef.current) setSecretsErrorCode(errorCode(error))
      return false
    } finally {
      if (activeRef.current) setIsSavingSecrets(false)
    }
  }, [])

  const resetSecrets = useCallback(async () => {
    setIsResettingSecrets(true)
    setResetSecretsErrorCode(null)
    setSecretsSaved(false)
    try {
      const next = await resetEasyOrdersWebhookSecrets()
      if (activeRef.current) setStatus(next)
      return true
    } catch (error) {
      logger.error(
        'Failed to reset the EasyOrders webhook secrets',
        failureSummary(error)
      )
      if (activeRef.current) setResetSecretsErrorCode(errorCode(error))
      return false
    } finally {
      if (activeRef.current) setIsResettingSecrets(false)
    }
  }, [])

  const saveSettings = useCallback(
    async (settings: EasyOrdersOrderSettings) => {
      setIsSavingSettings(true)
      setSettingsErrorCode(null)
      setSettingsSaved(false)
      try {
        const next = await saveEasyOrdersOrderSettings(settings)
        if (!activeRef.current) return true
        setStatus(next)
        setSettingsSaved(true)
        return true
      } catch (error) {
        logger.error(
          'Failed to save the EasyOrders order settings',
          failureSummary(error)
        )
        if (activeRef.current) setSettingsErrorCode(errorCode(error))
        return false
      } finally {
        if (activeRef.current) setIsSavingSettings(false)
      }
    },
    []
  )

  const disconnect = useCallback(async () => {
    setIsDisconnecting(true)
    setDisconnectErrorCode(null)
    try {
      const next = await disconnectEasyOrders()
      if (!activeRef.current) return true
      setStatus(next)
      setCancelled(false)
      setSecretsSaved(false)
      setSettingsSaved(false)
      return true
    } catch (error) {
      logger.error('Failed to disconnect EasyOrders', failureSummary(error))
      if (activeRef.current) setDisconnectErrorCode(errorCode(error))
      return false
    } finally {
      if (activeRef.current) setIsDisconnecting(false)
    }
  }, [])

  const clearDisconnectError = useCallback(
    () => setDisconnectErrorCode(null),
    []
  )

  return {
    view: resolveEasyOrdersConnectView(status, {
      isLoading,
      loadFailed,
      cancelled,
    }),
    status,
    canManage: status?.canManage ?? false,
    isStarting,
    startErrorCode,
    isSavingSecrets,
    secretsErrorCode,
    secretsSaved,
    connect,
    markCancelled,
    reload,
    saveSecrets,
    isResettingSecrets,
    resetSecretsErrorCode,
    resetSecrets,
    isSavingSettings,
    settingsErrorCode,
    settingsSaved,
    saveSettings,
    isDisconnecting,
    disconnectErrorCode,
    disconnect,
    clearDisconnectError,
  }
}
