import urllib.request
import json
import time

# Test APIs that provide route data with CORS support

print("Testing Free Flight APIs for Route Data\n")

# 1. OpenSky Network - Free, no key required, CORS enabled
print("="*60)
print("1. OpenSky Network (opensky-network.org)")
print("="*60)
try:
    # Get all flights in a bounding box
    url = "https://opensky-network.org/api/states/all?lamin=38.0&lomin=-77.5&lamax=39.5&lomax=-76.0"
    response = urllib.request.urlopen(url, timeout=10)
    data = json.loads(response.read())
    print(f"✓ Status: {response.status}")
    print(f"✓ States: {len(data.get('states', []))}")
    if data.get('states'):
        print(f"Sample flight: {data['states'][0]}")
    print("Note: Has CORS, but no route info in basic endpoint")
except Exception as e:
    print(f"✗ Error: {e}")

time.sleep(1)

# 2. Try AviationStack (needs API key but has free tier)
print("\n" + "="*60)
print("2. AviationStack (aviationstack.com)")
print("="*60)
print("Requires API key - Free tier: 500 requests/month")
print("Provides: departure, arrival airports, flight status")

time.sleep(1)

# 3. Try FlightAware AeroAPI
print("\n" + "="*60)
print("3. FlightAware AeroAPI")
print("="*60)
print("Requires API key - Limited free tier")
print("Provides: Full route data, track history")

# 4. Try ADS-B Exchange
print("\n" + "="*60)
print("4. ADS-B Exchange (adsbexchange.com)")
print("="*60)
try:
    # Their v2 API
    url = "https://adsbexchange.com/api/aircraft/json/lat/38.9/lon/-77.0/dist/25/"
    response = urllib.request.urlopen(url, timeout=10)
    data = json.loads(response.read())
    print(f"✓ Status: {response.status}")
    print(f"✓ Aircraft: {len(data.get('ac', []))}")
    if data.get('ac'):
        print(f"Sample fields: {list(data['ac'][0].keys())}")
        # Check if route info exists
        sample = data['ac'][0]
        if 'from' in sample or 'to' in sample:
            print("✓ Has route information!")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "="*60)
print("RECOMMENDATION")
print("="*60)
print("""
Best option for free route data:
1. OpenSky Network - No API key, CORS enabled, but limited route data
2. AviationStack API - 500 free requests/month, has departure/arrival
3. Parse from callsign patterns (e.g., AAL123 = American Airlines)

For flight paths/tracks:
- Store historical positions in browser (last 50 positions)
- Draw polyline on map when plane is clicked
""")
