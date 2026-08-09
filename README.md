<h1 align="center">ARCANA Tarot</h1>

<p align="center">
  Trải bài Tarot tương tác với luận giải tiếng Việt từ Gemini.
</p>

<p align="center">
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Next.js-16.3-000000?style=for-the-badge&amp;logo=nextdotjs&amp;logoColor=white" height="28" alt="Next.js 16.3" />
  </a>
  <a href="https://react.dev/">
    <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&amp;logo=react&amp;logoColor=061A24" height="28" alt="React 19.2" />
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&amp;logo=typescript&amp;logoColor=white" height="28" alt="TypeScript 5" />
  </a>
  <a href="https://ai.google.dev/gemini-api/docs">
    <img src="https://img.shields.io/badge/Gemini-3.6-4285F4?style=for-the-badge&amp;logo=googlegemini&amp;logoColor=white" height="28" alt="Gemini 3.6" />
  </a>
  <a href="https://motion.dev/">
    <img src="https://img.shields.io/badge/Motion-13-FFF312?style=for-the-badge&amp;logo=framer&amp;logoColor=111111" height="28" alt="Motion 13" />
  </a>
  <a href="https://vercel.com/">
    <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&amp;logo=vercel&amp;logoColor=white" height="28" alt="Deployed on Vercel" />
  </a>
</p>

<p align="center">
  <a href="https://tarot.bincrydev.id.vn">Trải nghiệm phiên bản trực tuyến</a>
</p>

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Gemini diagnostics

Set `GEMINI_API_KEY` for the Vercel Production environment and redeploy after every key change. `GEMINI_MODEL` is optional; the app defaults to `gemini-3.6-flash` and can discover another text model available to the key when a model is retired.

The `/api/interpret` response includes safe diagnostic headers:

- `X-Tarot-AI-Mode: gemini` means the reading came from Gemini.
- `X-Tarot-AI-Mode: fallback` means the local Vietnamese fallback was used.
- `X-Tarot-AI-Code` identifies the failure without exposing the API key.

Common codes:

- `MISSING_KEY`: add the key to the correct Vercel environment and redeploy.
- `INVALID_KEY`, `BLOCKED_KEY`, `RESTRICTED_KEY`, `PERMISSION_DENIED`: replace the key or review its Google AI Studio restrictions.
- `FREE_TIER_UNAVAILABLE`, `DAILY_QUOTA_EXHAUSTED`, `RATE_LIMITED`, `QUOTA_EXHAUSTED`: review Gemini usage, billing, and rate limits.
- `MODEL_UNAVAILABLE`: remove an obsolete `GEMINI_MODEL`; automatic model discovery will try an accessible Flash model.
- `INVALID_REQUEST`, `EMPTY_RESPONSE`, `INVALID_RESPONSE`: inspect the Vercel function log entry named `API Interpretation Error`.
