// Fleet map — real-time vehicle tracking for community admins
class FleetMap {
  constructor() {
    this.map = null;
    this.markers = {};
    this.pollInterval = null;
    this.POLL_MS = 15000; // 15 seconds
    this.DEFAULT_CENTER = [10.4806, -66.9036]; // Fallback: Caracas
    this.DEFAULT_ZOOM = 13;
  }

  // Initialize the Leaflet map inside #map-container
  init(center) {
    if (this.map) {
      this.map.invalidateSize();
      return;
    }
    const mapCenter = center || this.DEFAULT_CENTER;
    this.map = L.map('map-container').setView(mapCenter, this.DEFAULT_ZOOM);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map);
  }

  // Fetch units and update the map
  async refresh() {
    try {
      const data = await api.getOnlineUnits();
      if (data.success) {
        // On first load, center the map on the hub location if provided
        if (data.center && this.map && Object.keys(this.markers).length === 0) {
          this.map.setView([data.center.lat, data.center.lng], this.DEFAULT_ZOOM);
        }
        this.updateMarkers(data.units || []);
      }
      const el = document.getElementById('map-last-updated');
      if (el) {
        const time = new Date().toLocaleTimeString();
        el.textContent = `${t('fleetMap.lastUpdated')}: ${time}`;
      }
    } catch (error) {
      console.error('Fleet map refresh error:', error);
    }
  }

  // Add, move, or remove markers based on current unit list
  updateMarkers(units) {
    const statusColors = {
      driving: '#22c55e',
      idle:    '#eab308',
      offline: '#ef4444'
    };

    const seen = new Set();

    units.forEach(unit => {
      seen.add(unit.username);
      const color = statusColors[unit.status] || '#6b7280';
      const latlng = [unit.location.lat, unit.location.lng];

      if (this.markers[unit.username]) {
        // Update existing marker position and popup
        this.markers[unit.username].setLatLng(latlng);
        this.markers[unit.username].setStyle({ fillColor: color });
        this.markers[unit.username].setPopupContent(this.buildPopup(unit));
      } else {
        // Create new marker
        const marker = L.circleMarker(latlng, {
          radius: 10,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        }).bindPopup(this.buildPopup(unit));
        marker.addTo(this.map);
        this.markers[unit.username] = marker;
      }
    });

    // Remove markers for units no longer in the response
    Object.keys(this.markers).forEach(username => {
      if (!seen.has(username)) {
        this.map.removeLayer(this.markers[username]);
        delete this.markers[username];
      }
    });
  }

  // Build popup HTML for a unit
  buildPopup(unit) {
    const statusLabel = unit.status.charAt(0).toUpperCase() + unit.status.slice(1);
    const lastSeen = new Date(unit.lastSeen).toLocaleTimeString();
    return `
      <div class="fleet-popup">
        <strong>${unit.displayName}</strong><br>
        <span>@${unit.username}</span><br>
        <span>${statusLabel}</span><br>
        <small>${t('fleetMap.lastSeen')}: ${lastSeen}</small>
      </div>
    `;
  }

  // Begin polling (fetches immediately, then every POLL_MS)
  startPolling() {
    this.refresh();
    this.pollInterval = setInterval(() => this.refresh(), this.POLL_MS);
  }

  // Stop polling
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}

const fleetMap = new FleetMap();
