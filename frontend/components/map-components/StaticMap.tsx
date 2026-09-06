// FILE: frontend/components/map-components/StaticMap.tsx
'use client';

/**
 * Static map view
 */

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  FullscreenControl,
  GeolocateControl,
  type ViewState as MapViewState,
  Marker,
  Popup,
  Map as ReactMapGL,
  type ViewStateChangeEvent,
} from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

import MapMarker from './MapMarker';

const fullscreenControlStyle: CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  padding: '10px',
};

const geolocateStyle: CSSProperties = {
  position: 'absolute',
  bottom: 30,
  right: 0,
  margin: 10,
};

const DEFAULT_LOCATION = { latitude: -34.40581053569814, longitude: 150.87842788963476 };
const DEFAULT_PADDING: MapViewState['padding'] = { top: 0, right: 0, bottom: 0, left: 0 };

type Props = {
  markerLat?: number;
  markerLng?: number;
};

export default function MyStaticMap({ markerLat, markerLng }: Props) {
  const token =
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ??
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
    process.env.MAPBOX_ACCESS_TOKEN;

  // Keep a local controlled view so geolocate/drag gestures remain in sync
  const [vp, setVp] = useState<MapViewState>({
    latitude: markerLat ?? DEFAULT_LOCATION.latitude,
    longitude: markerLng ?? DEFAULT_LOCATION.longitude,
    zoom: 15,
    pitch: 50,
    bearing: 0,
    padding: DEFAULT_PADDING,
  });

  const initialView = useMemo(() => vp, []); // only for first paint

  const onMove = (evt: ViewStateChangeEvent) => {
    const vs = evt.viewState;
    setVp((prev) => ({
      ...prev,
      latitude: vs.latitude,
      longitude: vs.longitude,
      zoom: vs.zoom,
      pitch: vs.pitch,
      bearing: vs.bearing,
      padding: vs.padding ?? prev.padding,
    }));
  };

  return (
    <ReactMapGL
      initialViewState={initialView}
      // Keep controlled. Cast at the boundary to satisfy the library’s extra width/height typing.
      viewState={vp as unknown as MapViewState & { width: number; height: number }}
      onMove={onMove}
      mapboxAccessToken={token}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      style={{ width: '100%', height: '640px' }}
    >
      {markerLat != null && markerLng != null && (
        <>
          <Marker longitude={markerLng} latitude={markerLat}>
            <MapMarker />
          </Marker>

          <Popup
            anchor="bottom"
            latitude={markerLat}
            longitude={markerLng}
            closeOnClick={false}
            closeButton={false}
            offset={[0, -20]}
          >
            <div style={{ marginLeft: 5, marginRight: 5 }}>
              <div>Latitude: {markerLat}</div>
              <div>Longitude: {markerLng}</div>
            </div>
          </Popup>
        </>
      )}

      <div style={fullscreenControlStyle}>
        <FullscreenControl />
      </div>

      <GeolocateControl
        style={geolocateStyle}
        positionOptions={{ enableHighAccuracy: true }}
        trackUserLocation
        showUserLocation
        onGeolocate={() =>
          setVp((v) => ({
            ...v,
            zoom: Math.max(v.zoom ?? 0, 14),
          }))
        }
      />
    </ReactMapGL>
  );
}
