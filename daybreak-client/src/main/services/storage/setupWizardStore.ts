import { setupWizardStateSchema } from '@shared/schemas'
import type { SetupWizardState } from '@shared/types'
import { JsonStore } from './jsonStore'
import { paths } from './paths'

function defaultState(): SetupWizardState {
  return { completed: false, language: null, javaPath: null, recommendedRamMb: null }
}

export const setupWizardStore = new JsonStore<SetupWizardState>(
  paths.setupWizardFile(),
  setupWizardStateSchema,
  defaultState
)
