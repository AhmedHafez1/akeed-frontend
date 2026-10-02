import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MarkdownContent } from './MarkdownContent'

function renderDoc(content: string) {
  return render(
    <MarkdownContent content={content} locale="en" currentSlug="demo" />
  )
}

describe('MarkdownContent code blocks', () => {
  it('keeps a code block left to right on an Arabic page', () => {
    const { container } = render(
      <MarkdownContent
        content={'```bash\ncurl -i "$AKEED_API_URL/api/v1/orders"\n```'}
        locale="ar"
        currentSlug="server-api"
      />
    )

    const block = container.querySelector('pre')
    expect(block?.getAttribute('dir')).toBe('ltr')
    expect(block?.textContent).toContain('curl -i')
  })

  it('prints a placeholder in angle brackets as text', () => {
    const { container } = renderDoc(
      '```http\nX-Correlation-Id: <CORRELATION_ID>\n```\n\nSend `<ORDER_ID>` to support.'
    )

    expect(container.textContent).toContain('<CORRELATION_ID>')
    expect(container.textContent).toContain('<ORDER_ID>')
  })
})

describe('MarkdownContent callouts', () => {
  it('renders a label followed by text in the same blockquote paragraph', () => {
    const { container } = renderDoc('> [!INFO]\n> Akeed is built for COD.')

    expect(container.querySelector('blockquote')).toBeNull()
    expect(container.textContent).toContain('Akeed is built for COD.')
    expect(container.textContent).not.toContain('[!INFO]')
    expect(container.querySelector('div.border-info-border')).not.toBeNull()
  })

  it('renders a label on its own line before a separate paragraph', () => {
    const { container } = renderDoc('> [!WARNING]\n>\n> Credits are used up.')

    expect(container.textContent).toContain('Credits are used up.')
    expect(container.textContent).not.toContain('[!WARNING]')
    expect(container.querySelector('div.border-warning-border')).not.toBeNull()
  })

  it('keeps inline formatting after the label', () => {
    const { container } = renderDoc('> [!SUCCESS]\n> All **orders** imported.')

    expect(container.querySelector('strong')?.textContent).toBe('orders')
    expect(container.textContent).not.toContain('[!SUCCESS]')
  })

  it('leaves an ordinary blockquote untouched', () => {
    const { container } = renderDoc('> Just a quote.')

    expect(container.querySelector('blockquote')).not.toBeNull()
    expect(container.textContent).toContain('Just a quote.')
  })
})
