# Trip Estimate

Aviation cost estimation application built with SvelteKit, Tailwind CSS, and Supabase.

## Features

- **Flight Legs** - Track multiple flight legs with origin, destination, flight time, and fuel burn
- **Crew Management** - Add pilots and flight attendants with customizable daily rates
- **Cost Categories** - Track fuel, maintenance, airport fees, catering, and miscellaneous expenses
- **Aircraft Profiles** - 5 preset profiles + custom profile creation with default values
- **Save/Load Estimates** - Persist estimates to your account
- **Share Estimates** - Generate shareable read-only links
- **PDF Export** - Download professional PDF reports
- **Guest Mode** - Calculator works without authentication (saving requires sign-in)

## Tech Stack

- **Frontend**: SvelteKit 5, TypeScript, Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Hosting**: Cloudflare Pages
- **PDF Generation**: jsPDF

## Setup

### Prerequisites

- Node.js 18+
- Supabase account

### Installation

1. Clone the repository and install dependencies:

```sh
npm install
```

2. Create a Supabase project at [supabase.com](https://supabase.com)

3. Run the database schema:
   - Go to Supabase Dashboard > SQL Editor
   - Copy contents of `supabase/schema.sql` and run it

4. Create `.env` file with your Supabase credentials:

```sh
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

> Note: For new Supabase projects (Nov 2025+), use the `sb_publishable_...` key from Settings > API. For older projects, you can use the anon key but should plan to migrate.

5. Start the development server:

```sh
npm run dev
```

## Deployment

### Cloudflare Pages

1. Connect your GitHub repository to Cloudflare Pages
2. Set build command: `npm run build`
3. Set output directory: `.svelte-kit/cloudflare`
4. Add environment variables in Cloudflare dashboard

## Project Structure

```
src/
├── lib/
│   ├── components/    # Svelte components
│   ├── stores/        # Svelte stores (auth, calculator, profiles, ui)
│   ├── types/         # TypeScript types
│   ├── utils/         # Utility functions (PDF generation)
│   └── supabase.ts    # Supabase client
├── routes/
│   ├── calculator/    # Main calculator page
│   ├── estimates/     # Saved estimates list
│   ├── profiles/      # Aircraft profiles management
│   └── share/[token]/ # Public share view
└── app.css            # Tailwind CSS imports
```

## License

MIT
