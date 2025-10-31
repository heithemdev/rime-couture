// apps/web/app/page.tsx
export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold tracking-tight">bz-market</h1>
      <p className="text-muted-foreground">
        Next.js + Tailwind v4 starter (monorepo).
      </p>
      <a
        href="#"
        className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
      >
        Get started
      </a>
    </main>
  );
}
