'use client'

const GLOBAL_ERROR_COLORS = `
  :root { color-scheme: light dark; --ge-bg: #fafafa; --ge-fg: #171717; --ge-muted: #737373; --ge-faint: #a3a3a3; }
  @media (prefers-color-scheme: dark) {
    :root { --ge-bg: #0b1120; --ge-fg: #f8fafc; --ge-muted: #94a3b8; --ge-faint: #64748b; }
  }
`

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <head>
        {/* Renders outside the app theme, so it follows the OS scheme directly. */}
        <style>{GLOBAL_ERROR_COLORS}</style>
      </head>
      <body
        style={{
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          margin: 0,
          backgroundColor: 'var(--ge-bg)',
          color: 'var(--ge-fg)',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--ge-muted)',
              marginBottom: '1.5rem',
              maxWidth: '400px',
            }}
          >
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: '0.75rem',
                color: 'var(--ge-faint)',
                marginBottom: '1rem',
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: '0.5rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: 500,
              backgroundColor: 'var(--ge-fg)',
              color: 'var(--ge-bg)',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
