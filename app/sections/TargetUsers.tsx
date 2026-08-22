const users = [
  {
    title: "Individual farmers",
    description:
      "Small and mid-size farms that need practical guidance and an organised record of every activity.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    title: "Commercial farms",
    description:
      "Agricultural businesses that need structured information, decision support, and team-wide records.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
      </svg>
    ),
  },
  {
    title: "Ecosystem partners",
    description:
      "Input suppliers, cooperatives, insurers, and extension services joining the platform over time.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
];

export default function TargetUsers() {
  return (
    <section className="w-full bg-white px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
      <div className="mx-auto max-w-7xl">
        <div className="reveal grid divide-y divide-agro-clay rounded-2xl border border-agro-clay bg-agro-mint/40 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {users.map((user) => (
            <div key={user.title} className="flex flex-col p-7 sm:p-8">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-agro-canopy ring-1 ring-agro-sprout">
                {user.icon}
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-agro-ink">
                {user.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-agro-slate">
                {user.description}
              </p>
            </div>
          ))}
        </div>

        <p className="reveal mt-6 text-center font-mono text-xs uppercase tracking-[0.18em] text-agro-canopy">
          Designed for farmers first — growing with the ecosystem
        </p>
      </div>
    </section>
  );
}
