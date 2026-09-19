'use client'

import { Switch, type SwitchProps } from '@/shared/ui/switch'

/** Mirrors the standalone Settings switch so both surfaces read identically. */
export function OnboardingSwitch(props: Omit<SwitchProps, 'className'>) {
  return <Switch {...props} />
}
