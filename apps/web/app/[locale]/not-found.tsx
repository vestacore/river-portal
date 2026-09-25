import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

/** Friendly 404 (bilingual, since the locale may be unknown here). */
export default function NotFound() {
  return (
    <Container narrow className="py-28 text-center">
      <p className="font-display text-7xl font-extrabold text-river-200">404</p>
      <h1 className="mt-4 text-3xl font-extrabold">We could not find that page · Сторінку не знайдено</h1>
      <p className="mt-3 text-ink-500">The link may be old, or the page may have been taken down.</p>
      <div className="mt-8 flex justify-center gap-3"><Button href="/en-gb" variant="secondary">Home</Button><Button href="/uk" variant="ghost">На головну</Button></div>
    </Container>
  );
}
