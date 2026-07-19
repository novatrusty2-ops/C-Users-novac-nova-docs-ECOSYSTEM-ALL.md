import { exportMnemonic } from '@/lib/keystore'
import { RecoveryPhraseReveal } from '@/components/settings/RecoveryPhraseReveal'

export function SettingsBackupPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-2xl text-signet-gold-light">Backup</h1>
      <p className="mt-2 text-sm text-signet-ink-muted">Never share your recovery phrase with anyone.</p>
      <div className="mt-6">
        <RecoveryPhraseReveal onReveal={(password) => exportMnemonic(password)} />
      </div>
    </div>
  )
}
