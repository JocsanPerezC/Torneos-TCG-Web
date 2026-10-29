import { LockKeyhole } from 'lucide-react';

const panel = 'app-panel';

export function AccountLock({ title, description }: { title: string; description: string }) {
  return (
    <section className={`${panel} mx-auto max-w-xl text-center`}>
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-[#eee9ff] text-[#5B1FE0]">
        <LockKeyhole size={22} />
      </span>
      <h2 className="mt-4 text-2xl font-bold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
    </section>
  );
}
