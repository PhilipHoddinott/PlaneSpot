import urllib.request
import json

url = 'https://api.adsb.lol/v2/lat/38.9/lon/-77.0/dist/100'
print(f"Testing: {url}\n")

try:
    response = urllib.request.urlopen(url, timeout=10)
    data = json.loads(response.read())
    
    print(f"✓ Status: {response.status}")
    
    if 'ac' in data:
        print(f"✓ Found {len(data['ac'])} aircraft")
        print(f"\nResponse structure keys: {list(data.keys())}")
        
        # Show first aircraft with all fields
        if data['ac']:
            print("\n" + "="*60)
            print("First aircraft full data:")
            print("="*60)
            print(json.dumps(data['ac'][0], indent=2))
            
            print("\n" + "="*60)
            print("Second aircraft (if different):")
            print("="*60)
            if len(data['ac']) > 1:
                print(json.dumps(data['ac'][1], indent=2))
            
except Exception as e:
    print(f"✗ Error: {e}")
