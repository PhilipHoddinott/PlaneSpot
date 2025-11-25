# ✈️ PlateSpot - Live Flight Tracker

A real-time flight tracking web application that displays live aircraft positions on an interactive map.

## 🌐 Live Demo

**[View Live Site](https://philiphoddinott.github.io/PlaneSpot/)**

## 📖 About

PlateSpot tracks flights in real-time within a 100 nautical mile radius of Washington D.C. using data from the ADSB.lol API. Click on any aircraft marker to view detailed flight information including altitude, speed, heading, and more.

## ✨ Features

- **Real-time Flight Tracking**: Displays live aircraft positions updated every 10 seconds
- **Interactive Map**: Powered by Leaflet.js for smooth navigation and zooming
- **Detailed Flight Info**: Click any aircraft to see:
  - Flight callsign and hex code
  - Registration and aircraft type
  - Altitude, speed, and heading
  - Squawk code
- **Automatic Updates**: Flights refresh automatically to show current positions
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Technologies

- **HTML5/CSS3/JavaScript**: Pure client-side implementation
- **[Leaflet.js](https://leafletjs.com/)**: Interactive mapping library
- **[ADSB.lol API](https://adsb.lol/)**: Real-time aircraft data provider

## 📡 API Information

This project uses the ADSB.lol API v2:

**Endpoint**: `https://api.adsb.lol/v2/lat/{latitude}/lon/{longitude}/dist/{distance}`

- `latitude`: Center point latitude
- `longitude`: Center point longitude  
- `distance`: Search radius in nautical miles

**Example**: `https://api.adsb.lol/v2/lat/38.9/lon/-77.0/dist/100`

The API returns aircraft data including position, altitude, speed, heading, and identification information.

## 🚀 Getting Started

### View Locally

1. Clone this repository:
   ```bash
   git clone https://github.com/PhilipHoddinott/PlaneSpot.git
   cd PlaneSpot
   ```

2. Open `index.html` in your web browser

That's it! No build process or server required.

### Customize Tracking Area

Edit `script.js` to change the tracking location:

```javascript
const CONFIG = {
    mapCenter: [38.9072, -77.0369],  // [latitude, longitude]
    mapZoom: 9,                       // Initial zoom level
    searchRadius: 100                 // Nautical miles
};
```

## 📁 Project Structure

```
PlaneSpot/
├── index.html      # Main HTML page
├── style.css       # Styles and responsive design
├── script.js       # Flight tracking logic and API integration
└── README.md       # Documentation
```

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Flight data provided by [ADSB.lol](https://adsb.lol/)
- Map tiles from [OpenStreetMap](https://www.openstreetmap.org/)
- Built with [Leaflet.js](https://leafletjs.com/)

## 📧 Contact

Created by Philip - Feel free to reach out with questions or suggestions!

---

**Note**: This application requires an active internet connection to fetch real-time flight data.
