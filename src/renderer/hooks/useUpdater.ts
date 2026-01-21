import { useState, useEffect, useCallback } from 'react'
import type { UpdateState } from '../../shared/types'

const initialState: UpdateState = {
  status: 'not-available',
  info: null,
  progress: null,
  error: null
}

export function useUpdater() {
  const [updateState, setUpdateState] = useState<UpdateState>(initialState)
  const [dismissed, setDismissed] = useState(false)

  // Subscribe to update status events
  useEffect(() => {
    const unsubscribe = window.electronAPI.updater.onUpdateStatus((state) => {
      setUpdateState(state)
      // Reset dismissed when new update becomes available
      if (state.status === 'available') {
        setDismissed(false)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const checkForUpdates = useCallback(async () => {
    setDismissed(false)
    await window.electronAPI.updater.checkForUpdates()
  }, [])

  const downloadUpdate = useCallback(async () => {
    await window.electronAPI.updater.downloadUpdate()
  }, [])

  const installUpdate = useCallback(() => {
    window.electronAPI.updater.installUpdate()
  }, [])

  const dismiss = useCallback(() => {
    setDismissed(true)
  }, [])

  return {
    ...updateState,
    dismissed,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    dismiss
  }
}
