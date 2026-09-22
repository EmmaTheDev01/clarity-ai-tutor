# Google Search Console launch checklist

The site is configured for the production domain `https://purelearn.vigilance.rw`.

1. Deploy these changes and confirm that `https://purelearn.vigilance.rw/robots.txt` and `https://purelearn.vigilance.rw/sitemap.xml` return HTTP 200 responses.
2. In [Google Search Console](https://search.google.com/search-console), add a **Domain** property for `vigilance.rw`, or a **URL prefix** property for `https://purelearn.vigilance.rw/`. Verify it with the DNS TXT record Google supplies.
3. This project declares `https://purelearn.vigilance.rw/` as canonical. Configure permanent redirects to this hostname for any alternate hostnames that serve the same site.
4. In Search Console, open **Sitemaps** and submit `https://purelearn.vigilance.rw/sitemap.xml`.
5. Use **URL inspection** for the home page, features, pricing, and blog pages, then request indexing after Google confirms each page can be crawled.
6. Add the Google-provided ownership verification meta tag only if DNS verification is unavailable. Never add a placeholder verification token.

## Search targets

Primary themes intentionally reflected in titles and descriptions:

- AI tutor and personalised learning
- Socratic learning and guided study
- Study notes, flashcards, and practice questions
- STEM tutoring
- ADHD-friendly and dyslexia-friendly learning

Authenticated, administrative, onboarding, and demo-request URLs are excluded from the sitemap and blocked from crawling. Do not place private or user-generated study material in a sitemap.
