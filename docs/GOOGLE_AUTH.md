# Google account access

Standalone login and signup can offer Google alongside email/password when `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`. The switch defaults to disabled and is compiled into the frontend build. Shopify merchants continue through the Shopify App Store and embedded authentication.

Google uses Supabase Auth with an isolated browser PKCE client. Existing email confirmation and password reset continue using the normal Supabase client. The Google callback and account-completion route is `/<locale>/signup/google`, for each supported interface locale (`ar`, `en`, `ur`, `es`, `fr`, `tr`). This route disables marketing scripts, has a no-referrer policy and removes callback credentials from the browser address.

New merchants select their order platform before Google authentication. If they started from login, users without an organization select their platform after authentication. Google supplies their name and email; they confirm their store name and accept the terms before organization provisioning. Existing organization membership remains authoritative. Selecting a different source never changes an existing organization's source or permissions.

## Provider setup

1. Create a Google Cloud Web OAuth client. Configure its audience, branding, privacy/terms URLs and the basic OpenID, email and profile scopes.
2. Set the authorized application origins for the intended environments. Register the Supabase project's `/auth/v1/callback` address as the Google redirect URI.
3. Enable Google in Supabase Authentication providers. Store the Google client ID and secret there. Never add the secret to a `NEXT_PUBLIC_` variable, application source, logs or chat.
4. Set the correct Supabase Site URL and allow the six exact frontend callback URLs for each intended origin. Avoid broad production redirect wildcards. For example, an English callback is `https://<frontend-origin>/en/signup/google`.
5. Build and deploy with `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true` after the provider is configured. Existing Supabase URL and public key configuration still applies; no additional public Google key is needed.

The OAuth attempt and verifier are tab-scoped. Pending authentication expires after ten minutes. An authenticated completion checkpoint lasts up to 24 hours and requires the same verified Supabase user. Browser storage must be available; a blocked-storage failure leaves email/password login available. Google does not require another activation email or an Akeed password.

Supabase handles verified-provider identity linking. Do not merge Akeed organizations based on matching email strings. Different Google email addresses do not authorize combining accounts.

## Verification and rollback

Verify a new Google signup with each enabled order source, an existing Google login, a verified same-email account, cancellation, callback refresh, expired attempts and switching accounts. Confirm the existing email/password, confirmation and reset flows still work. Use test accounts; do not send real WhatsApp messages or exercise live store/payment APIs during these checks.

New-account registration reporting uses a stable event ID so retries can be deduplicated. It is best-effort and never blocks onboarding. Existing Google logins are not reported as registrations.

To hide the Google option, set the frontend switch to false and rebuild/redeploy. Email/password remains available. Accounts with only a Google identity can use the existing password-reset flow to establish a password if Google remains unavailable.

Provider setup and real Google login are separate activation checks. Passing synthetic application tests does not prove provider configuration or live identity linking.

References: [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [Supabase identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking), [Google branding](https://developers.google.com/identity/branding-guidelines).
