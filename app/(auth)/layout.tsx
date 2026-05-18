import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream-bg flex flex-col">
      <header className="px-6 py-5 border-b border-stone-200">
        <Link
          href="/"
          className="font-display text-2xl text-forest-deep tracking-tight"
        >
          Sovereign
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
