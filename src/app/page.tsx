import { Feed } from '@/components/Feed';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <section className="text-center py-8 md:py-12">
        <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Discover Stories
        </h1>
        <p className="mt-2 text-foreground/70 text-lg">
          Infinite scroll, search, and filter by tags.
        </p>
      </section>
      <Feed />
    </div>
  );
}
