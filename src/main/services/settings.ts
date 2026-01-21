import Store from 'electron-store'
import type { TranscriberSettings } from '../../shared/types'

interface StoreSchema {
  transcriber: TranscriberSettings
}

const defaults: StoreSchema = {
  transcriber: {
    method: 'local',
    selectedModel: 'base'
  }
}

class SettingsService {
  private _store: Store<StoreSchema> | null = null

  private get store(): Store<StoreSchema> {
    if (!this._store) {
      this._store = new Store<StoreSchema>({
        name: 'vidtsx-settings',
        defaults,
        encryptionKey: 'vidtsx-secure-storage-key-2024'
      })
    }
    return this._store
  }

  getTranscriberSettings(): TranscriberSettings {
    return this.store.get('transcriber')
  }

  saveTranscriberSettings(settings: Partial<TranscriberSettings>): void {
    const current = this.getTranscriberSettings()
    this.store.set('transcriber', { ...current, ...settings })
  }
}

export const settingsService = new SettingsService()
