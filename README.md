# Cost Optimizer Admin

Next.js admin application scaffolded with TypeScript, Tailwind CSS, ESLint, the App Router, and a `src/` project layout.

## Getting Started

Install dependencies, then run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Scripts

- `npm run dev` starts the local development server.
- `npm run build` creates a production build.
- `npm run start` starts the production server after a build.
- `npm run lint` runs ESLint.
- `npm run format` formats files with Prettier.
- `npm run format:check` checks formatting without writing changes.

## Project Structure

- `src/app/layout.tsx` defines app metadata and the root layout.
- `src/app/page.tsx` contains the starter admin dashboard.
- `src/app/globals.css` imports Tailwind and defines global theme tokens.
- `postcss.config.mjs` wires Tailwind CSS through `@tailwindcss/postcss`.
- `prettier.config.mjs` configures Prettier with Tailwind class sorting.

## Notes

The app uses Tailwind CSS v4, so a separate `tailwind.config.*` file is not required for the default setup.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
