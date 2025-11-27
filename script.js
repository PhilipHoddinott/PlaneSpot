// Configuration
const CONFIG = {
    // Map center (Washington D.C.)
    mapCenter: [38.9072, -77.0369],
    mapZoom: 9,
    updateInterval: 10000, // 10 seconds
    // API v2 uses lat/lon/distance format (distance in nautical miles)
    // Using codetabs CORS proxy
    apiUrl: 'https://api.codetabs.com/v1/proxy?quest=https://api.adsb.lol/v2',
    searchRadius: 100 // nautical miles
};

// Global variables
let map;
let markers = {};
let autoRefreshInterval;
let flightRoutes = {}; // Cache for flight routes
let allFlights = []; // Store all flights for filtering
let searchFilter = ''; // Current search filter
let flightPaths = {}; // Store historical positions for each flight
let pathLines = {}; // Store polyline objects for flight paths
const MAX_PATH_POINTS = 50; // Maximum number of historical points to store

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
function createAirplaneIcon(heading, speed, aircraftType) {
    const rotation = heading || 0;
    const isOnGround = speed !== undefined && speed < 20;
    
    // Determine if it's a helicopter based on aircraft type
    const helicopterTypes = ['H25B', 'H60', 'EC35', 'EC45', 'HELI', 'B06', 'B407', 'B429', 'AS50', 'AS65', 'EC30', 'S76'];
    const isHelicopter = aircraftType && helicopterTypes.some(type => aircraftType.includes(type));
    
    // Choose emoji based on type and status
    let emoji = '✈️';
    let fontSize = '24px';
    let style = '';
    
    if (isHelicopter) {
        emoji = '🚁';
    }
    
    if (isOnGround) {
        fontSize = '20px';
        style = `filter: grayscale(50%) brightness(0.7); text-shadow: 0 0 3px rgba(0,0,0,0.8);`;
    }
    
    return L.divIcon({
        html: `<div style="transform: rotate(${rotation}deg); font-size: ${fontSize}; ${style}">${emoji}</div>`,
        className: 'airplane-icon',
        iconSize: isOnGround ? [20, 20] : [24, 24],
        iconAnchor: isOnGround ? [10, 10] : [12, 12]
    });
}

// Store flight path history
function updateFlightPath(flight) {
    if (!flight.lat || !flight.lon) return;
    
    const hex = flight.hex;
    
    // Initialize path array if it doesn't exist
    if (!flightPaths[hex]) {
        flightPaths[hex] = [];
    }
    
    // Add current position with timestamp
    const position = {
        lat: flight.lat,
        lon: flight.lon,
        timestamp: Date.now(),
        altitude: flight.alt_baro
    };
    
    // Check if position has changed (avoid duplicates)
    const lastPos = flightPaths[hex][flightPaths[hex].length - 1];
    if (!lastPos || lastPos.lat !== position.lat || lastPos.lon !== position.lon) {
        flightPaths[hex].push(position);
        
        // Keep only last MAX_PATH_POINTS positions
        if (flightPaths[hex].length > MAX_PATH_POINTS) {
            flightPaths[hex].shift();
        }
    }
}

// Toggle flight path display
function toggleFlightPath(hex, flight) {
    // If path is already shown, hide it
    if (pathLines[hex]) {
        map.removeLayer(pathLines[hex]);
        delete pathLines[hex];
        return;
    }
    
    // Get historical positions
    const positions = flightPaths[hex];
    if (!positions || positions.length < 2) {
        console.log('Not enough position data for path');
        return;
    }
    
    // Create coordinates array for polyline
    const coords = positions.map(pos => [pos.lat, pos.lon]);
    
    // Create polyline with gradient effect (older = more transparent)
    const polyline = L.polyline(coords, {
        color: '#667eea',
        weight: 3,
        opacity: 0.7,
        smoothFactor: 1
    }).addTo(map);
    
    // Add decorators (arrows) to show direction
    const decorator = L.polylineDecorator(polyline, {
        patterns: [
            {
                offset: '100%',
                repeat: 0,
                symbol: L.Symbol.arrowHead({
                    pixelSize: 12,
                    polygon: false,
                    pathOptions: {
                        stroke: true,
                        weight: 2,
                        color: '#667eea'
                    }
                })
            }
        ]
    });
    
    // Store both polyline and decorator
    pathLines[hex] = L.layerGroup([polyline, decorator]).addTo(map);
    
    // Add path info to popup
    const pathInfo = `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd;">
        <small style="color: #667eea;">📍 Path: ${positions.length} positions tracked</small>
    </div>`;
    
    return pathInfo;
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
    
    // Calculate last seen time
    const lastSeen = flight.seen !== undefined ? 
        (flight.seen < 60 ? `${Math.round(flight.seen)}s ago` : `${Math.round(flight.seen / 60)}m ago`) : 
        'N/A';
    
    // Route info - to be implemented with proper API
    const departure = 'N/A';
    const destination = 'N/A';
    
    const pathCount = flightPaths[flight.hex] ? flightPaths[flight.hex].length : 0;
    const pathHint = pathCount >= 2 ? 
        `<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e9ecef; text-align: center;">
            <small style="color: #667eea;">💡 Click marker again to toggle flight path (${pathCount} positions)</small>
        </div>` : '';
    
    return `
        <div class="popup-title">${callsign.trim()}</div>
        <div class="popup-info">
            <div class="popup-row">
                <span class="popup-label">Departure:</span>
                <span class="popup-value">${departure}</span>
            </div>
            <div class="popup-row">
                <span class="popup-label">Destination:</span>
                <span class="popup-value">${destination}</span>
            </div>
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
            <div class="popup-row">
                <span class="popup-label">Last Observed:</span>
                <span class="popup-value">${lastSeen}</span>
            </div>
        </div>
        ${pathHint}
    `;
}

// Fetch flight data from ADSB.lol API
async function fetchFlights() {
    const [lat, lon] = CONFIG.mapCenter;
    const url = `${CONFIG.apiUrl}/lat/${lat}/lon/${lon}/dist/${CONFIG.searchRadius}`;
    
    console.log('Fetching flights from:', url);
    
    try {
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Data received:', data);
        console.log('Number of aircraft:', data.ac ? data.ac.length : 0);
        
        // API v2 uses 'ac' instead of 'aircraft'
        return data.ac || [];
    } catch (error) {
        console.error('Error fetching flight data:', error);
        updateFlightCount('Error loading flights');
        return [];
    }
}

// Filter flights based on search query
function filterFlights(flights, searchQuery) {
    if (!searchQuery) return flights;
    
    const query = searchQuery.toLowerCase().trim();
    
    // Check for specific filter formats
    if (query.startsWith('des:')) {
        const airport = query.substring(4).toUpperCase();
        return flights.filter(f => f.destination === airport);
    }
    
    if (query.startsWith('dep:')) {
        const airport = query.substring(4).toUpperCase();
        return flights.filter(f => f.departure === airport);
    }
    
    // General search - match callsign, registration, or hex
    return flights.filter(f => {
        const callsign = (f.flight || '').toLowerCase();
        const registration = (f.r || '').toLowerCase();
        const hex = (f.hex || '').toLowerCase();
        return callsign.includes(query) || registration.includes(query) || hex.includes(query);
    });
}

// Update or create markers for flights
function updateMarkers(flights) {
    console.log('updateMarkers called with', flights.length, 'flights');
    
    // Apply search filter
    const filteredFlights = filterFlights(flights, searchFilter);
    console.log('After filtering:', filteredFlights.length, 'flights');
    
    const currentHexCodes = new Set();
    
    let skippedCount = 0;
    filteredFlights.forEach(flight => {
        // Skip flights without position data
        if (!flight.lat || !flight.lon) {
            skippedCount++;
            return;
        }
        
        const hex = flight.hex;
        currentHexCodes.add(hex);
        
        const position = [flight.lat, flight.lon];
        const icon = createAirplaneIcon(flight.track, flight.gs, flight.t);
        const popupContent = createPopupContent(flight);
        
        // Update flight path history
        updateFlightPath(flight);
        
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
            
            // Add click handler to toggle flight path
            marker.on('click', function() {
                const pathInfo = toggleFlightPath(hex, flight);
            });
            
            markers[hex] = marker;
        }
    });
    
    // Remove markers for flights that are no longer in the data
    Object.keys(markers).forEach(hex => {
        if (!currentHexCodes.has(hex)) {
            map.removeLayer(markers[hex]);
            delete markers[hex];
            
            // Also remove path line if it exists
            if (pathLines[hex]) {
                map.removeLayer(pathLines[hex]);
                delete pathLines[hex];
            }
            
            // Clean up old path data (keep for 5 minutes after disappearing)
            setTimeout(() => {
                delete flightPaths[hex];
            }, 300000);
        }
    });
    
    console.log('Skipped', skippedCount, 'flights without position data');
    console.log('Total markers on map:', Object.keys(markers).length);
    
    // Update flight count
    const displayCount = searchFilter ? 
        `${Object.keys(markers).length} of ${flights.length} flights` : 
        `${flights.length} flights tracked`;
    updateFlightCount(displayCount);
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
    allFlights = flights; // Store for filtering
    updateMarkers(flights);
}

// Handle search input
function handleSearch(query) {
    searchFilter = query;
    updateMarkers(allFlights);
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

// Update location and refresh
function updateLocation(lat, lon, radius) {
    CONFIG.mapCenter = [lat, lon];
    CONFIG.searchRadius = radius;
    
    // Update map view
    map.setView(CONFIG.mapCenter, CONFIG.mapZoom);
    
    // Remove old circle
    map.eachLayer((layer) => {
        if (layer instanceof L.Circle) {
            map.removeLayer(layer);
        }
    });
    
    // Draw new circle
    L.circle(CONFIG.mapCenter, {
        color: '#667eea',
        weight: 2,
        fillOpacity: 0.05,
        radius: CONFIG.searchRadius * 1852
    }).addTo(map);
    
    // Clear all existing markers and paths
    Object.keys(markers).forEach(hex => {
        map.removeLayer(markers[hex]);
        if (pathLines[hex]) {
            map.removeLayer(pathLines[hex]);
        }
    });
    markers = {};
    pathLines = {};
    flightPaths = {};
    
    // Fetch new flights
    updateFlights();
    startAutoRefresh();
}

// Modal functions
function openLocationModal() {
    const modal = document.getElementById('location-modal');
    modal.classList.add('active');
    
    // Pre-fill current values
    document.getElementById('lat-input').value = CONFIG.mapCenter[0];
    document.getElementById('lon-input').value = CONFIG.mapCenter[1];
    document.getElementById('radius-input').value = CONFIG.searchRadius;
}

function closeLocationModal() {
    const modal = document.getElementById('location-modal');
    modal.classList.remove('active');
}

// Event Listeners
document.getElementById('refresh-btn').addEventListener('click', () => {
    updateFlights();
    // Reset the auto-refresh timer
    startAutoRefresh();
});

// Location button
document.getElementById('location-btn').addEventListener('click', openLocationModal);

// Modal controls
document.getElementById('close-modal').addEventListener('click', closeLocationModal);
document.getElementById('cancel-modal').addEventListener('click', closeLocationModal);

document.getElementById('apply-location').addEventListener('click', () => {
    const lat = parseFloat(document.getElementById('lat-input').value);
    const lon = parseFloat(document.getElementById('lon-input').value);
    const radius = parseInt(document.getElementById('radius-input').value);
    
    if (isNaN(lat) || isNaN(lon) || isNaN(radius)) {
        alert('Please enter valid numbers for all fields');
        return;
    }
    
    if (lat < -90 || lat > 90) {
        alert('Latitude must be between -90 and 90');
        return;
    }
    
    if (lon < -180 || lon > 180) {
        alert('Longitude must be between -180 and 180');
        return;
    }
    
    if (radius < 10 || radius > 250) {
        alert('Radius must be between 10 and 250 nautical miles');
        return;
    }
    
    updateLocation(lat, lon, radius);
    closeLocationModal();
});

// Preset buttons
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const lat = parseFloat(btn.dataset.lat);
        const lon = parseFloat(btn.dataset.lon);
        const radius = parseInt(btn.dataset.radius);
        
        document.getElementById('lat-input').value = lat;
        document.getElementById('lon-input').value = lon;
        document.getElementById('radius-input').value = radius;
    });
});

// Close modal on outside click
document.getElementById('location-modal').addEventListener('click', (e) => {
    if (e.target.id === 'location-modal') {
        closeLocationModal();
    }
});

// Search functionality
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });
    
    // Clear search
    const clearBtn = document.getElementById('clear-search');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            handleSearch('');
        });
    }
}

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
