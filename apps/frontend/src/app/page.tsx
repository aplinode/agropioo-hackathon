export default function Index() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4 text-center text-white">
      <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-1 text-sm font-medium text-emerald-400">
        Agropioo
      </span>
      <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
        Welcome to <span className="text-emerald-400">@org/frontend</span>
      </h1>
      <p className="mt-4 max-w-md text-lg text-gray-400">
        Next.js + Tailwind CSS + TypeScript, powered by Nx.
      </p>
      <a
        href="/api/hello"
        className="mt-8 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-gray-950 transition-colors hover:bg-emerald-400"
      >
        Try the API route
      </a>
    </main>
  );
}
