// Configuration
const CONFIG = {
    // Map center (Washington D.C.)
    mapCenter: [38.9072, -77.0369],
    mapZoom: 9,
    updateInterval: 10000, // 10 seconds
    // API v2 uses lat/lon/distance format (distance in nautical miles)
    apiUrl: 'https://api.adsb.lol/v2',
    searchRadius: 100 // nautical miles
};

// Global variables
let map;
let markers = {};
let autoRefreshInterval;

// Initialize the map
function initMap() {
    map = L.map('map').setView(CONFIG.mapCenter, CONFIG.mapZoom);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Draw a circle showing the tracking radius
    L.circle(CONFIG.mapCenter, {
        color: '#667eea',
        weight: 2,
        fillOpacity: 0.05,
        radius: CONFIG.searchRadius * 1852 // Convert nautical miles to meters
    }).addTo(map);
}

// Create custom airplane icon
function createAirplaneIcon(heading) {
    const rotation = heading || 0;
    return L.divIcon({
        html: `<div style="transform: rotate(${rotation}deg); font-size: 24px;">✈️</div>`,
        className: 'airplane-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
}

// Format flight data for popup
function createPopupContent(flight) {
    const callsign = flight.flight || flight.hex || 'Unknown';
    const altitude = flight.alt_baro !== undefined ? `${flight.alt_baro} ft` : 'N/A';
    const speed = flight.gs !== undefined ? `${flight.gs} knots` : 'N/A';
    const squawk = flight.squawk || 'N/A';
    const track = flight.track !== undefined ? `${flight.track}°` : 'N/A';
    const registration = flight.r || 'N/A';
    const aircraftType = flight.t || 'N/A';
    
    return `
        <div class="popup-title">${callsign.trim()}</div>
        <div class="popup-info">
            <div class="popup-row">
                <span class="popup-label">Hex:</span>
                <span class="popup-value">${flight.hex}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Registration:</span>
                <span class="popup-value">${registration}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Aircraft Type:</span>
                <span class="popup-value">${aircraftType}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Altitude:</span>
                <span class="popup-value">${altitude}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Speed:</span>
                <span class="popup-value">${speed}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Heading:</span>
                <span class="popup-value">${track}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Squawk:</span>
                <span class="popup-value">${squawk}</span>
            </div>
        </div>
    `;
}

// Fetch flight data from ADSB.lol API
async function fetchFlights() {
    const [lat, lon] = CONFIG.mapCenter;
    const url = `${CONFIG.apiUrl}/lat/${lat}/lon/${lon}/dist/${CONFIG.searchRadius}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // API v2 uses 'ac' instead of 'aircraft'
        return data.ac || [];
    } catch (error) {
        console.error('Error fetching flight data:', error);
        updateFlightCount('Error loading flights');
        return [];
    }
}

// Update or create markers for flights
function updateMarkers(flights) {
    const currentHexCodes = new Set();
    
    flights.forEach(flight => {
        // Skip flights without position data
        if (!flight.lat || !flight.lon) {
            return;
        }
        
        const hex = flight.hex;
        currentHexCodes.add(hex);
        
        const position = [flight.lat, flight.lon];
        const icon = createAirplaneIcon(flight.track);
        const popupContent = createPopupContent(flight);
        
        if (markers[hex]) {
            // Update existing marker
            markers[hex].setLatLng(position);
            markers[hex].setIcon(icon);
            markers[hex].getPopup().setContent(popupContent);
        } else {
            // Create new marker
            const marker = L.marker(position, { icon: icon })
                .addTo(map)
                .bindPopup(popupContent);
            markers[hex] = marker;
        }
    });
    
    // Remove markers for flights that are no longer in the data
    Object.keys(markers).forEach(hex => {
        if (!currentHexCodes.has(hex)) {
            map.removeLayer(markers[hex]);
            delete markers[hex];
        }
    });
    
    // Update flight count
    updateFlightCount(`${flights.length} flights tracked`);
    updateLastUpdateTime();
}

// Update flight count display
function updateFlightCount(text) {
    const countElement = document.getElementById('flight-count');
    countElement.textContent = text;
    countElement.classList.remove('loading');
}

// Update last update time
function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('last-update').textContent = `Last updated: ${timeString}`;
}

// Main update function
async function updateFlights() {
    const countElement = document.getElementById('flight-count');
    countElement.classList.add('loading');
    
    const flights = await fetchFlights();
    updateMarkers(flights);
}

// Start auto-refresh
function startAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    autoRefreshInterval = setInterval(updateFlights, CONFIG.updateInterval);
}

// Stop auto-refresh
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// Event Listeners
document.getElementById('refresh-btn').addEventListener('click', () => {
    updateFlights();
    // Reset the auto-refresh timer
    startAutoRefresh();
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    updateFlights();
    startAutoRefresh();
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});
