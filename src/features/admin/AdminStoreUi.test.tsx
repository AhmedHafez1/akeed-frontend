import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { AdminStore } from './admin.model'
import { CustomerCountryMarker, customerCountriesLabel } from './AdminStoreUi'

const storeWith = (customer_countries?: AdminStore['customer_countries']) =>
  ({ customer_countries }) as AdminStore

describe('customer countries', () => {
  it('renders nothing when the API omits customer countries', () => {
    const store = storeWith(undefined)
    expect(customerCountriesLabel(store)).toBeNull()
    expect(
      render(<CustomerCountryMarker store={store} />).container.innerHTML
    ).toBe('')
  })

  it('labels the top country, its share and the rest', () => {
    const store = storeWith({ top: 'GT', share: 82, count: 3 })
    expect(customerCountriesLabel(store)).toBe('Guatemala 82% · 3 countries')
    expect(
      render(<CustomerCountryMarker store={store} />).container.textContent
    ).toBe('GT 82% +2')
  })
})
