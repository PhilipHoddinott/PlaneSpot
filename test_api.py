import urllib.request
import json

# Test tar1090 data endpoint
url = 'https://adsb.lol/data/aircraft.json'
print(f"Testing tar1090 endpoint: {url}\n")

try:
    response = urllib.request.urlopen(url, timeout=10)
    data = json.loads(response.read())
    
    print(f"✓ Status: {response.status}")
    print(f"✓ Keys: {list(data.keys())}")
    
    if 'aircraft' in data:
        print(f"✓ Found {len(data['aircraft'])} aircraft")
        print("\nFirst aircraft sample:")
        print(json.dumps(data['aircraft'][0], indent=2))
    
except Exception as e:
    print(f"✗ Error: {e}")
