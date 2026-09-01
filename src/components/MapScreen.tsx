import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import { fetchHeatmap, reportDiscomfort, type HeatmapCell } from '../lib/api'
import { getBestFix, useLocation } from '../lib/geolocation'

const CATEGORIES = ['Poor lighting', 'Felt followed', 'Harassment', 'Isolated area', 'Other']

export function MapScreen() {
  const { fix } = useLocation()
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMap = useRef<L.Map | null>(null)
  const heatLayer = useRef<L.LayerGroup | null>(null)
  const centeredOnFix = useRef(false)
  const [category, setCategory] = useState(CATEGORIES[0])
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return
    const start = fix ?? getBestFix()
    centeredOnFix.current = start != null
    const map = L.map(mapRef.current).setView(
      start ? [start.latitude, start.longitude] : [20, 0],
      start ? 14 : 2,
    )
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)
    heatLayer.current = L.layerGroup().addTo(map)
    leafletMap.current = map
    void loadHeatmap()

    return () => {
      map.remove()
      leafletMap.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (centeredOnFix.current || !fix || !leafletMap.current) return
    centeredOnFix.current = true
    leafletMap.current.setView([fix.latitude, fix.longitude], 14)
  }, [fix])

  async function loadHeatmap() {
    const cells = await fetchHeatmap()
    if (!heatLayer.current) return
    heatLayer.current.clearLayers()
    for (const cell of cells) {
      addHeatCell(heatLayer.current, cell)
    }
  }

  function addHeatCell(layer: L.LayerGroup, cell: HeatmapCell) {
    const radius = Math.min(8 + cell.count * 4, 40)
    L.circleMarker([cell.latitude, cell.longitude], {
      radius,
      color: '#e2242f',
      fillColor: '#e2242f',
      fillOpacity: 0.35,
      weight: 1,
      opacity: 0.6,
    })
      .bindPopup(`${cell.count} report${cell.count === 1 ? '' : 's'} nearby`)
      .addTo(layer)
  }

  const submitReport = async () => {
    const usedFix = fix ?? getBestFix()
    if (!usedFix) {
      setStatus('failed')
      return
    }
    setStatus('sending')
    const ok = await reportDiscomfort({
      latitude: usedFix.latitude,
      longitude: usedFix.longitude,
      category,
      note: note.trim() || undefined,
    })
    setStatus(ok ? 'sent' : 'failed')
    if (ok) {
      setNote('')
      void loadHeatmap()
    }
  }

  return (
    <div className="screen map-screen">
      <h1>Where people feel unsafe</h1>
      <p className="hint">
        Anonymous, crowdsourced. Reports only appear on the map once at least a few people have
        flagged the same area — no single report can be traced to a spot or a person.
      </p>

      <div ref={mapRef} className="map-canvas" />

      <div className="field">
        <span>Report this spot</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Optional note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="btn btn-danger" onClick={() => void submitReport()} disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Report this spot'}
        </button>
        {status === 'sent' && <span className="hint">Thanks — added anonymously.</span>}
        {status === 'failed' && (
          <span className="hint">
            Couldn't send — needs a location fix and a connection to the server.
          </span>
        )}
      </div>
    </div>
  )
}
