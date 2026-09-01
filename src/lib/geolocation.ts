import { useEffect, useSyncExternalStore } from 'react'

export interface Fix {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export type PermissionState = 'unknown' | 'granted' | 'denied' | 'unsupported'

interface LocationState {
  fix: Fix | null
  permission: PermissionState
}

// Module-level store, not component state: geolocation.watchPosition is
// started once, as early as possible (see startWarmup below), so that by
// the time someone taps SOS a fix is already sitting here — no cold-GPS
// wait during the emergency itself.
let state: LocationState = { fix: null, permission: 'unknown' }
const listeners = new Set<() => void>()
let watchId: number | null = null

function setState(patch: Partial<LocationState>) {
  state = { ...state, ...patch }
  for (const l of listeners) l()
}

export function startWarmup(): void {
  if (watchId !== null) return // already running
  if (!('geolocation' in navigator)) {
    setState({ permission: 'unsupported' })
    return
  }
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      setState({
        permission: 'granted',
        fix: {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        },
      })
    },
    (err) => {
      setState({ permission: err.code === err.PERMISSION_DENIED ? 'denied' : state.permission })
    },
    { enableHighAccuracy: true, maximumAge: 10_000, timeout: 20_000 },
  )
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): LocationState {
  return state
}

/** Live location state, warmed up in the background from app launch. */
export function useLocation(): LocationState {
  useEffect(() => {
    startWarmup()
  }, [])
  return useSyncExternalStore(subscribe, getSnapshot)
}

/** Best fix available right now, however stale — used at the moment SOS fires. */
export function getBestFix(): Fix | null {
  return state.fix
}
