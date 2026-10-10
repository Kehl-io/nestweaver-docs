# Browser analytics verification

This site does not embed a manual browser analytics beacon or GA4. Cloudflare's existing `kehl.io` Web Analytics registration uses automatic injection excluding EU visitors. No account setting or regional preference was changed by the SEO correction.

A read-only check on October 10, 2026 confirmed that this repository targets the account containing that registration. Cloudflare documents that automatic setup normally covers subdomains and allows a verified apex registration to cover them. A separate `docs.nestweaver.kehl.io` token is not necessarily required.

The inspected production responses contained no beacon, and neither NestWeaver hostname appeared in the registration's last-30-day report. These findings do not establish whether absence is caused by visitor eligibility, injection rules, or a collection failure. The actual beacon token, rule details, and this hostname's collection remain unverified. Edge request counts are distinct from browser page views.

After an authorized deployment, verify one automatic beacon on eligible public pages, successful same-origin RUM requests, and hostname-specific activity under the intended registration. Preserve the existing EU exclusion. Do not install a manual fallback that could collect where automatic injection is intentionally suppressed, create another registration, or use an unrelated domain's token without separate authorization.

Use isolated browser sessions with collector requests intercepted for synthetic checks. Do not send invented ingestion payloads or submit forms to test analytics.

References: [Cloudflare setup](https://developers.cloudflare.com/web-analytics/get-started/) and [Cloudflare FAQ](https://developers.cloudflare.com/web-analytics/faq/).
