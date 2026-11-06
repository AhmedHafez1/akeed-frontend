'use client'

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query'
import {
  disconnectWhatsapp,
  getWhatsappConnection,
  getWhatsappSender,
  updateWhatsappThankYou,
  whatsappConnectionQueryKey,
  whatsappSenderQueryKey,
} from '../api/whatsappConnectApi'

/**
 * The sender availability and the connection behind the WhatsApp tab. Both
 * refetch when the merchant comes back to the tab, which is how the screen
 * catches up after the connect page finishes in another tab.
 */
export function useWhatsappSenderData(enabled = true) {
  const availability = useQuery({
    queryKey: whatsappSenderQueryKey,
    queryFn: getWhatsappSender,
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: true,
    enabled,
  })
  const connection = useQuery({
    queryKey: whatsappConnectionQueryKey,
    queryFn: getWhatsappConnection,
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: true,
    enabled,
  })
  return {
    availability: availability.data,
    connection: connection.data?.connection ?? null,
    isLoading: availability.isPending || connection.isPending,
    isError: availability.isError || connection.isError,
    retry: () => {
      void availability.refetch()
      void connection.refetch()
    },
  }
}

/**
 * Whether anything about the merchant's own number may be shown: connecting
 * is offered, or a connection already exists to manage. False while either
 * answer is still loading or failed, so nothing is promoted by mistake.
 */
export function useOwnNumberPresence(enabled = true): {
  visible: boolean
  /** A number is connected and active, so its allowance is open. */
  connected: boolean
  isLoading: boolean
} {
  const data = useWhatsappSenderData(enabled)
  return {
    visible: Boolean(data.availability?.available || data.connection),
    connected: data.connection?.state === 'active',
    isLoading: data.isLoading,
  }
}

function refresh(client: QueryClient) {
  // The prefix covers the availability and the connection.
  return client.invalidateQueries({ queryKey: whatsappSenderQueryKey })
}

export function useUpdateWhatsappThankYou() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: updateWhatsappThankYou,
    onSettled: () => refresh(client),
  })
}

export function useDisconnectWhatsapp() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: disconnectWhatsapp,
    onSettled: () => refresh(client),
  })
}
