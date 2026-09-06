// FILE: frontend/components/map-components/ControlPanel.tsx
// C:\MyCode\Konnaxionv14\frontend\components\map-components\ControlPanel.tsx
/**
 * Map control panel shown on top of the interactive map.
 * Displays current coordinates and optionally exposes zoom, filters, view‑mode and layer controls.
 */

import React, { type CSSProperties } from 'react';

export type ViewMode = 'default' | 'satellite' | 'terrain';

export interface MapFilterOption {
  id: string;
  label: string;
}

export interface MapLayerOption {
  id: string;
  label: string;
  active: boolean;
}

export interface ControlPanelProps {
  /** Current marker latitude */
  lat: number;
  /** Current marker longitude */
  lng: number;

  /** Current zoom level (if provided, enables the zoom slider when paired with onZoomChange) */
  zoom?: number;
  /** Optional slider minimum for zoom control */
  minZoom?: number;
  /** Optional slider maximum for zoom control */
  maxZoom?: number;
  /** Called when zoom slider changes */
  onZoomChange?: (zoom: number) => void;

  /** Active base map style */
  viewMode?: ViewMode;
  /** Called when user selects a different base map view */
  onViewModeChange?: (mode: ViewMode) => void;

  /** Available filters for map content (projects, impact categories, etc.) */
  filters?: MapFilterOption[];
  /** Currently selected filter id; null/undefined means "All" */
  selectedFilterId?: string | null;
  /** Called when filter changes; null means "All" */
  onFilterChange?: (id: string | null) => void;

  /** Toggleable overlay layers (heatmap, markers, clusters, etc.) */
  layers?: MapLayerOption[];
  /** Called when a layer checkbox is toggled */
  onLayerToggle?: (id: string, active: boolean) => void;

  /** Optional recenter action (e.g. to recenter view on marker) */
  onRecenter?: () => void;

  /** Extra styling hooks */
  className?: string;
  style?: CSSProperties;
}

const basePanelStyle: CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  padding: 12,
  width: 260,
  maxWidth: 'calc(100% - 24px)',
  boxSizing: 'border-box',
  background: 'var(--ant-color-bg-container, rgba(255,255,255,0.95))',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  borderRadius: 4,
  fontSize: 12,
  lineHeight: 1.5,
};

const sectionTitleStyle: CSSProperties = {
  fontWeight: 600,
  marginBottom: 4,
};

const rowStyle: CSSProperties = {
  marginBottom: 8,
};

const chipContainerStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
};

const chipStyle: CSSProperties = {
  border: '1px solid rgba(0,0,0,0.15)',
  borderRadius: 16,
  padding: '2px 8px',
  fontSize: 11,
  background: 'var(--ant-color-bg-elevated, #fff)',
  cursor: 'pointer',
};

const chipActiveStyle: CSSProperties = {
  ...chipStyle,
  background: 'var(--ant-color-primary-bg, #e6f4ff)',
  borderColor: 'var(--ant-color-primary, #1677ff)',
  color: 'var(--ant-color-primary-text, #1677ff)',
};

const layerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  marginBottom: 4,
};

const ControlPanel: React.FC<ControlPanelProps> = ({
  lat,
  lng,
  zoom,
  minZoom = 1,
  maxZoom = 18,
  viewMode,
  onViewModeChange,
  filters,
  selectedFilterId,
  onFilterChange,
  layers,
  onLayerToggle,
  onZoomChange,
  onRecenter,
  className,
  style,
}) => {
  const zoomValue = typeof zoom === 'number' ? zoom : undefined;
  const hasZoomControl = zoomValue !== undefined && !!onZoomChange;
  const hasFilters = Array.isArray(filters) && filters.length > 0;
  const hasLayers = Array.isArray(layers) && layers.length > 0;
  const hasViewMode = !!viewMode && !!onViewModeChange;

  const formatCoord = (value: number): string =>
    Number.isFinite(value) ? value.toFixed(5) : '—';

  return (
    <div
      className={className}
      style={{
        ...basePanelStyle,
        ...style,
      }}
    >
      {/* Coordinates */}
      <div style={rowStyle}>
        <div style={sectionTitleStyle}>Location</div>
        <div>Latitude: {formatCoord(lat)}</div>
        <div>Longitude: {formatCoord(lng)}</div>
        {onRecenter && (
          <button
            type="button"
            onClick={onRecenter}
            style={{
              marginTop: 6,
              padding: '2px 8px',
              fontSize: 11,
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.15)',
              background: 'var(--ant-color-bg-elevated, #fff)',
              cursor: 'pointer',
            }}
          >
            Recenter map
          </button>
        )}
      </div>

      {/* Zoom control */}
      {hasZoomControl && zoomValue !== undefined && (
        <div style={rowStyle}>
          <div style={sectionTitleStyle}>Zoom</div>
          <input
            type="range"
            min={minZoom}
            max={maxZoom}
            step={0.1}
            value={zoomValue}
            onChange={(e) => onZoomChange?.(Number(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{ marginTop: 2 }}>Current: {zoomValue.toFixed(1)}</div>
        </div>
      )}

      {/* View mode selector */}
      {hasViewMode && (
        <div style={rowStyle}>
          <div style={sectionTitleStyle}>View</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['default', 'satellite', 'terrain'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onViewModeChange(mode)}
                style={viewMode === mode ? chipActiveStyle : chipStyle}
              >
                {mode === 'default'
                  ? 'Standard'
                  : mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      {hasFilters && (
        <div style={rowStyle}>
          <div style={sectionTitleStyle}>Filters</div>
          <div style={chipContainerStyle}>
            <button
              type="button"
              onClick={() => onFilterChange?.(null)}
              style={!selectedFilterId ? chipActiveStyle : chipStyle}
            >
              All
            </button>
            {(filters ?? []).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => onFilterChange?.(f.id)}
                style={
                  selectedFilterId === f.id ? chipActiveStyle : chipStyle
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Layer toggles */}
      {hasLayers && (
        <div style={rowStyle}>
          <div style={sectionTitleStyle}>Layers</div>
          {(layers ?? []).map((layer) => (
            <label key={layer.id} style={layerRowStyle}>
              <input
                type="checkbox"
                checked={!!layer.active}
                onChange={(e) =>
                  onLayerToggle?.(layer.id, e.target.checked)
                }
              />
              <span>{layer.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default ControlPanel;
