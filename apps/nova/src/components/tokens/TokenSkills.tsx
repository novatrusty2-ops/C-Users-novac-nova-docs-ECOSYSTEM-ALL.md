import { enabledSkills, type TokenSkillProfile } from '@/lib/tokenSkills'

interface TokenSkillsProps {
  profile: TokenSkillProfile
}

export function TokenSkills({ profile }: TokenSkillsProps) {
  const skills = enabledSkills(profile)
  if (skills.length === 0) {
    return <p className="text-sm text-nova-muted">No skills enabled for this asset.</p>
  }

  return (
    <section className="space-y-3">
      <h2 className="text-[11px] uppercase tracking-wider text-nova-muted">Skills</h2>
      <ul className="grid grid-cols-2 gap-2">
        {skills.map((s, i) => (
          <li
            key={s.id}
            className="rounded-xl bg-nova-surface px-3 py-3 animate-fade-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <p className="text-sm font-semibold text-nova-accent">{s.label}</p>
            <p className="mt-1 text-[11px] leading-snug text-nova-muted">{s.description}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
