# Vlog — Full-Stack Social Vlog Platform

A modern, vibrant multi-user vlog platform built with **Next.js 14** (App Router), **Supabase**, **Tailwind CSS**, and **TanStack Query**. Feels like a single-page app with smooth transitions and no full page reloads.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database & Auth:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Data:** TanStack React Query (infinite scroll, optimistic updates)
- **Content:** Markdown (react-markdown)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase

1. Create a project at [Supabase](https://supabase.com).
2. In the SQL Editor, run the scripts in order:
   - `supabase/schema.sql` — tables, RLS, triggers
   - `supabase/storage-policies.sql` — `post-images` bucket and policies
3. In **Authentication → Providers → Email**, enable **Email**. To let users sign in right after sign-up without confirming email, turn **off** «Confirm email».
4. In **Project Settings → API**, copy your **Project URL** and **anon public** key.

### 3. Environment variables

Copy the example env and add your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Auth:** Email/password via Supabase; profile created on sign-up (username from metadata).
- **Global feed:** Infinite scroll, search (title/content), tag filter chips.
- **Create post:** Title, tags, Markdown body, cover image + multiple body images (upload to `post-images`).
- **Post page:** Full content, image gallery, like button, comments with up/down vote; comments sorted by score (highest first).

## Project structure

- `src/app/` — App Router pages (home, dashboard, post/[id], profile/[id])
- `src/components/` — Header, AuthModal, Feed, PostCard, PostDetail, CreatePostForm
- `src/lib/supabase/` — Browser/server clients and middleware
- `src/lib/types/` — Shared types
- `supabase/` — SQL schema and storage policies

## Build

```bash
npm run build
```

Ensure `.env.local` exists with valid Supabase URL and anon key so static generation can run.
