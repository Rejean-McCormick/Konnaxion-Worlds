// FILE: frontend/components/map-components/Map.tsx
// C:\MyCode\Konnaxionv14\frontend\components\map-components\Map.tsx
'use client'

/**
 * Dynamic map view with geolocation control and draggable marker.
 * Controlled via `view` and `marker` props so parent pages own the state.
 */

import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import {
  FullscreenControl,
  GeolocateControl,
  type ViewState as MapViewState,
  Marker,
  NavigationControl,
  Map as ReactMapGL,
  type ViewStateChangeEvent,
} from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

import ControlPanel from './ControlPanel'
import MapMarker from './MapMarker'

/** Controls styling */
const fullscreenControlStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  padding: '10px',
}

const navStyle: CSSProperties = {
  position: 'absolute',
  top: 36,
  left: 0,
  padding: '10px',
}

const geolocateStyle: CSSProperties = {
  position: 'absolute',
  bottom: 30,
  right: 0,
  margin: 10,
}

/** Public shape expected by parent (keeps prop contract minimal) */
type ViewInput = {
  latitude: number
  longitude: number
  zoom: number
  pitch?: number
  bearing?: number
  /** Optional on input to avoid breaking callers; defaults inside component */
  padding?: { top: number; bottom: number; left: number; right: number }
}

type MarkerState = { markerLat: number; markerLng: number }

type Props = {
  view: ViewInput
  setView: (v: ViewInput) => void
  marker: MarkerState
  setMarker: (m: MarkerState) => void
}

const DEFAULT_PADDING: MapViewState['padding'] = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
}

export default function Map({ view, setView, marker, setMarker }: Props) {
  const token =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ??
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
    process.env.MAPBOX_ACCESS_TOKEN

  // Internal view that satisfies react-map-gl’s stricter ViewState typing
  const controlledView: MapViewState = useMemo(
    () => ({
      latitude: view.latitude,
      longitude: view.longitude,
      zoom: view.zoom,
      pitch: view.pitch ?? 0,
      bearing: view.bearing ?? 0,
      padding: view.padding ?? DEFAULT_PADDING,
    }),
    [view],
  )

  const handleMove = (evt: ViewStateChangeEvent) => {
    const vs = evt.viewState

    // Feed a relaxed shape back to parent while preserving optional fields
    setView({
      latitude: vs.latitude,
      longitude: vs.longitude,
      zoom: vs.zoom,
      pitch: vs.pitch,
      bearing: vs.bearing,
      padding: vs.padding,
    })
  }

  return (
    <ReactMapGL
      /** Uncontrolled startup values for first render */
      initialViewState={controlledView}
      /**
       * Keep it controlled. Cast only at the boundary to avoid
       * polluting the rest of your code with map-specific width/height typing.
       */
      viewState={
        controlledView as unknown as MapViewState & {
          width: number
          height: number
        }
      }
      onMove={handleMove}
      mapboxAccessToken={token}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      style={{ width: '100%', height: '100%' }}
    >
      <Marker
        longitude={marker.markerLng}
        latitude={marker.markerLat}
        draggable
        onDragEnd={e => {
          const { lng, lat } = e.lngLat
          setMarker({ markerLat: lat, markerLng: lng })
        }}
      >
        <MapMarker />
      </Marker>

      <div style={fullscreenControlStyle}>
        <FullscreenControl />
      </div>

      <div style={navStyle}>
        <NavigationControl />
      </div>

      <GeolocateControl
        style={geolocateStyle}
        positionOptions={{ enableHighAccuracy: true }}
        trackUserLocation
        showUserLocation
        onGeolocate={() =>
          setView({
            ...view,
            // keep or increase zoom to a sensible level
            zoom: Math.max(view.zoom ?? 0, 13),
          })
        }
      />

      <ControlPanel lat={marker.markerLat} lng={marker.markerLng} />
    </ReactMapGL>
  )
}
