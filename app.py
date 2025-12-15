from flask import Flask, request, jsonify, render_template, send_from_directory, redirect
from digital_planter import DigitalPlanter
from werkzeug.utils import secure_filename
import json
import os
import requests
import time
import math

app = Flask(__name__)
app.secret_key = "SUPER_SECRET_KEY" 

app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

PLANTS_FILE = 'plants.json'

def load_plants():
    """Load plants from JSON file."""
    if os.path.exists(PLANTS_FILE):
        try:
            with open(PLANTS_FILE, 'r') as f:
                data = json.load(f)
                return [DigitalPlanter(

                    p['name'], p['lat'], p['lon'], 
                    p.get('is_user_planted', False), 
                    p.get('id'),
                    p.get('user_id'),
                    p.get('photo_url'),
                    p.get('address'),
                    p.get('landmarks')
                ) for p in data]
        except:
            pass
    # Default plants - Open public spaces (parks, streets, gardens)
    return [
        DigitalPlanter("Oak Tree - Central Park Lawn, NYC", 40.7829, -73.9654, False),
        DigitalPlanter("Rose Bush - Embarcadero Waterfront, SF", 37.7955, -122.3937, False),
        DigitalPlanter("Lavender - Tuileries Garden Path, Paris", 48.8634, 2.3275, False),
        DigitalPlanter("Jasmine - Rajpath Road, New Delhi", 28.6143, 77.2088, False),
        DigitalPlanter("Maple Tree - Bryant Park Lawn, NYC", 40.7536, -73.9832, False),
        DigitalPlanter("Sunflower - Hyde Park Corner, London", 51.5027, -0.1527, False),
        DigitalPlanter("Petunia - Marina Beach Road, Chennai", 13.0499, 80.2824, False),
        DigitalPlanter("Bamboo - Lodhi Garden Path, Delhi", 28.5933, 77.2197, False)
    ]

# Load existing plants
planters = load_plants()

def save_plants():
    """Save plants to JSON file."""
    data = [{
        'id': p.id, 
        'user_id': p.user_id,
        'name': p.name, 
        'lat': p.lat, 
        'lon': p.lon, 
        'is_user_planted': p.is_user_planted,
        'photo_url': p.photo_url,
        'address': p.address,
        'landmarks': p.landmarks
    } for p in planters]
    with open(PLANTS_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def reverse_geocode(lat, lon):
    """Get address from coordinates using Nominatim API."""
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json"
        headers = {'User-Agent': 'DigitalPlanterApp/1.0'}
        time.sleep(1)  # Rate limit: 1 request per second
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            data = response.json()
            address = data.get('display_name', 'Unknown location')
            
            # Extract detailed address components
            address_parts = data.get('address', {})
            landmarks = []
            
            # Extract landmarks
            if 'road' in address_parts:
                landmarks.append(address_parts['road'])
            if 'suburb' in address_parts:
                landmarks.append(address_parts['suburb'])
            if 'city' in address_parts:
                landmarks.append(address_parts['city'])
            elif 'town' in address_parts:
                landmarks.append(address_parts['town'])
            
            # Extract pin code/postal code
            pin_code = address_parts.get('postcode', None)
            
            return address, landmarks, pin_code, address_parts
    except:
        pass
    return None, [], None, {}

def get_nearby_places(lat, lon, radius=500):
    """Search for nearby places using Nominatim."""
    try:
        # Nominatim doesn't have a dedicated nearby search, but we can use reverse geocoding
        # to get the area and extract points of interest
        url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&addressdetails=1&extratags=1"
        headers = {'User-Agent': 'DigitalPlanterApp/1.0'}
        time.sleep(1)
        response = requests.get(url, headers=headers, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            address_parts = data.get('address', {})
            
            # Extract notable places from address components
            places = []
            for key, value in address_parts.items():
                if key in ['amenity', 'tourism', 'shop', 'leisure', 'building']:
                    places.append(value)
            
            # Also search nearby using bounding box
            # Calculate rough bbox (approx 500m radius)
            offset = radius / 111000  # Rough degrees offset for radius in meters
            bbox_url = f"https://nominatim.openstreetmap.org/search?format=json&limit=10&bounded=1&viewbox={lon-offset},{lat+offset},{lon+offset},{lat-offset}"
            time.sleep(1)
            bbox_response = requests.get(bbox_url, headers=headers, timeout=5)
            
            if bbox_response.status_code == 200:
                nearby_data = bbox_response.json()
                for place in nearby_data[:5]:  # Limit to 5 places
                    if place.get('display_name'):
                        places.append(place['display_name'].split(',')[0])
            
            return list(set(places))[:10]  # Return unique places, max 10
    except:
        pass
    return []

def calculate_distance_km(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in kilometers."""
    R = 6371  # Earth's radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c

def get_distance_alert(distance_km):
    """Get proximity alert message based on distance."""
    if distance_km < 0.05:  # 50 meters
        return "You've arrived at your plant! 🎉", "arrived"
    elif distance_km < 1:
        return "Your plant is very close! Less than 1 km away! 🌱", "very_close"
    elif distance_km < 5:
        return "Your plant is nearby - within 5 km! 🌿", "nearby"
    elif distance_km < 10:
        return "You're approaching your plant - within 10 km.", "approaching"
    elif distance_km < 15:
        return "Getting closer to your plant - within 15 km.", "closer"
    elif distance_km < 20:
        return "You're in the same region as your plant - within 20 km.", "same_region"
    else:
        return f"Your plant is {distance_km:.1f} km away.", "far"

def generate_map_link(lat, lon, plant_name):
    """Generate Google Maps shareable link."""
    return f"https://www.google.com/maps?q={lat},{lon}&ll={lat},{lon}&z=15"

def generate_social_post(plant, distance_km=None):
    """Generate platform-specific social media posts with multiple style options."""
    map_link = generate_map_link(plant.lat, plant.lon, plant.name)
    plant_type = "tree" if "🌳" in plant.name else "flower" if "🌸" in plant.name else "plant"
    plant_emoji = "🌳" if plant_type == "tree" else "🌸"
    clean_name = plant.name.replace("🌳", "").replace("🌸", "").strip()
    location_info = plant.address if plant.address else f'{plant.lat:.4f}, {plant.lon:.4f}'
    landmarks_text = f"Near: {', '.join(plant.landmarks[:2])}" if plant.landmarks else ""
    
    # Multiple template styles for variety
    templates = {
        'short': f"Just planted a new {plant_type} today! 🌿{plant_emoji}\nOne small step for a greener tomorrow. 🌍✨\n\n📍 {clean_name}\n🗺️ {map_link}",
        'inspirational': f"Today I planted a {plant_type} — a tiny act of kindness for our planet.\nLet's grow more green together! 🌱💚\n\n📍 {clean_name}\n🗺️ {location_info}\n🔗 {map_link}\n\n#PlantMore #GoGreen #DigitalPlanter",
        'social': f"New plant baby added to my garden! {plant_emoji}🌱\nEvery plant is a promise for a better future.\n\n📍 {clean_name}\n🗺️ {location_info}\n{landmarks_text}\n🔗 {map_link}\n\n#NatureLove #PlantationDrive #GreenLife #EcoWarrior",
        'instagram': f"Planted something beautiful today.\nHoping it grows strong and bright—just like dreams. ✨🌱\n\n{plant_emoji} {clean_name}\n📍 {location_info}\n{landmarks_text}\n\nView on map: {map_link}\n\n#GardenVibes #PlantingDay #NatureMagic #GreenThumb #EcoFriendly",
        'detailed': f"🌱 I planted a {plant_type} today!\n\n📍 {clean_name}\n🗺️ {location_info}\n📌 Coordinates: {plant.lat:.4f}, {plant.lon:.4f}\n{f'🏞️ {landmarks_text}' if landmarks_text else ''}\n\nView on map: {map_link}\n\n#DigitalPlanter #PlantATree #GreenEarth #SaveThePlanet #ClimateAction",
        'whatsapp': f"Planted a new {plant_type} today {plant_emoji}\nLet's make the Earth greener, one plant at a time!\n\n📍 {clean_name}\n{map_link}",
        'youtube': f"Planting a new {plant_type} today! 🌱\nJoin me in making the world greener.\n\n📍 {clean_name}\n🗺️ {location_info}\n{map_link}\n\nLike, share, and comment what plant I should grow next! 🌿✨\n#shorts #planting #green #ecofriendly #nature",
        'professional': f"I planted a new {plant_type} today as part of my commitment to environmental care.\nSmall actions create big impacts. 🌱🌍\n\n📍 Location: {clean_name}\n🗺️ {location_info}\n🔗 {map_link}\n\n#Sustainability #EcoFriendly #CorporateResponsibility #GreenInitiative",
        'twitter': f"🌱 Just planted a {plant_type}!\n\n📍 {clean_name}\n🗺️ {map_link}\n\n#PlantATree #GoGreen"
    }
    
    return {
        'templates': templates,
        'map_link': map_link,
        'plant_info': {
            'name': clean_name,
            'type': plant_type,
            'emoji': plant_emoji,
            'address': location_info,
            'landmarks': plant.landmarks,
            'coordinates': f'{plant.lat:.4f}, {plant.lon:.4f}'
        }
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login():
    return render_template('login.html')

@app.route('/logged')
def logged():
    return render_template('logged.html')

@app.route('/locations')
def locations():
    """Display all planted locations in a list view."""
    return render_template('locations.html')


@app.route('/get_plants', methods=['GET'])
def get_plants():
    """Return all planted locations."""
    plants_data = [{'name': p.name, 'lat': p.lat, 'lon': p.lon, 'is_user_planted': p.is_user_planted} for p in planters]
    return jsonify({'plants': plants_data})

@app.route('/get_user_plants', methods=['GET'])
def get_user_plants():
    """Return only user-planted locations with full details."""
    user_plants = [p for p in planters if p.is_user_planted]
    plants_data = [{
        'id': p.id, 
        'name': p.name, 
        'lat': p.lat, 
        'lon': p.lon,
        'photo_url': p.photo_url,
        'address': p.address,
        'landmarks': p.landmarks
    } for p in user_plants]
    return jsonify({'plants': plants_data})

@app.route('/plant/<plant_id>')
def plant_detail(plant_id):
    """Serve the plant detail page."""
    return render_template('plant_detail.html', plant_id=plant_id)

@app.route('/get_plant_details/<plant_id>', methods=['GET'])
def get_plant_details(plant_id):
    """Return details for a specific plant."""
    plant = next((p for p in planters if p.id == plant_id), None)
    
    if not plant:
        return jsonify({'error': 'Plant not found'}), 404
        
    return jsonify({
        'success': True,
        'plant': {
            'id': plant.id,
            'name': plant.name,
            'lat': plant.lat,
            'lon': plant.lon,
            'photo_url': plant.photo_url,
            'address': plant.address,
            'landmarks': plant.landmarks,
            'is_user_planted': plant.is_user_planted
        }
    })

@app.route('/delete_plant', methods=['POST'])
def delete_plant():
    """Delete a plant by ID."""
    data = request.get_json()
    if not data or 'id' not in data:
        return jsonify({'error': 'Invalid data'}), 400
    
    plant_id = data['id']
    global planters
    
    # Find and remove the plant
    initial_count = len(planters)
    planters = [p for p in planters if p.id != plant_id]
    
    if len(planters) < initial_count:
        save_plants()
        return jsonify({'success': True, 'message': 'Plant deleted successfully'})
    else:
        return jsonify({'error': 'Plant not found'}), 404


@app.route('/check_location', methods=['POST'])
def check_location():
    data = request.get_json()
    if not data or 'lat' not in data or 'lon' not in data:
        return jsonify({'error': 'Invalid data'}), 400

    try:
        user_lat = float(data['lat'])
        user_lon = float(data['lon'])
    except ValueError:
        return jsonify({'error': 'Invalid coordinates'}), 400

    message = None
    for planter in planters:
        msg = planter.is_near_location(user_lat, user_lon)
        if msg:
            message = msg
            break # Return the first match
    
    if message:
        return jsonify({'message': message, 'nearby': True})
    else:
        return jsonify({'message': 'No plants nearby.', 'nearby': False})

@app.route('/plant_location', methods=['POST'])
def plant_location():
    """Plant a new location with optional photo."""
    # Handle file upload if present
    photo_url = None
    if 'photo' in request.files:
        file = request.files['photo']
        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            # Add timestamp to avoid conflicts
            filename = f"{int(time.time())}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
            file.save(filepath)
            photo_url = f"/uploads/{filename}"
    
    # Get form data
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form.to_dict()
    
    if not data or 'name' not in data or 'lat' not in data or 'lon' not in data or 'type' not in data:
        return jsonify({'error': 'Invalid data'}), 400

    plant_name = data['name'].strip()
    plant_type = data['type'].strip()
    
    if not plant_name:
        return jsonify({'error': 'Plant name cannot be empty'}), 400
    
    if plant_type not in ['tree', 'flower']:
        return jsonify({'error': 'Invalid plant type'}), 400

    try:
        user_lat = float(data['lat'])
        user_lon = float(data['lon'])
    except ValueError:
        return jsonify({'error': 'Invalid coordinates'}), 400

    # Get address and landmarks
    address, landmarks, pin_code, address_parts = reverse_geocode(user_lat, user_lon)
    
    # Create full plant name with emoji
    emoji = '🌳' if plant_type == 'tree' else '🌸'
    full_name = f"{plant_name} {emoji}"
    
    # Add new plant
    new_plant = DigitalPlanter(
        full_name, user_lat, user_lon, 
        is_user_planted=True,
        photo_url=photo_url,
        address=address,
        landmarks=landmarks
    )
    planters.append(new_plant)
    
    # Save to file
    save_plants()
    
    return jsonify({
        'message': f'Successfully planted {plant_type} "{plant_name}" at this location!',
        'success': True,
        'plant_id': new_plant.id,
        'address': address,
        'landmarks': landmarks
    })

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    """Serve uploaded files."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/calculate_distances', methods=['POST'])
def calculate_distances():
    """Calculate distances from current location to all user plants."""
    data = request.get_json()
    if not data or 'lat' not in data or 'lon' not in data:
        return jsonify({'error': 'Invalid data'}), 400
    
    try:
        user_lat = float(data['lat'])
        user_lon = float(data['lon'])
    except ValueError:
        return jsonify({'error': 'Invalid coordinates'}), 400
    
    user_plants = [p for p in planters if p.is_user_planted]
    distances = []
    
    for plant in user_plants:
        distance_km = calculate_distance_km(user_lat, user_lon, plant.lat, plant.lon)
        alert_message, alert_level = get_distance_alert(distance_km)
        
        distances.append({
            'plant_id': plant.id,
            'plant_name': plant.name,
            'distance_km': round(distance_km, 2),
            'alert_message': alert_message,
            'alert_level': alert_level
        })
    
    # Sort by distance
    distances.sort(key=lambda x: x['distance_km'])
    
    return jsonify({'distances': distances})

@app.route('/generate_social_post', methods=['POST'])
def generate_social_post_endpoint():
    """Generate social media posts for a planted location."""
    data = request.get_json()
    if not data or 'plant_id' not in data:
        return jsonify({'error': 'Plant ID required'}), 400
    
    plant_id = data['plant_id']
    plant = next((p for p in planters if p.id == plant_id), None)
    
    if not plant:
        return jsonify({'error': 'Plant not found'}), 404
    
    posts = generate_social_post(plant)
    
    return jsonify({
        'success': True,
        'posts': posts,
        'plant_name': plant.name,
        'photo_url': plant.photo_url
    })

@app.route('/my_location', methods=['POST'])
def my_location():
    """Get detailed information about current location - Google Maps style."""
    data = request.get_json()
    if not data or 'lat' not in data or 'lon' not in data:
        return jsonify({'error': 'Location coordinates required'}), 400
    
    try:
        lat = float(data['lat'])
        lon = float(data['lon'])
        accuracy = data.get('accuracy', None)  # GPS accuracy in meters
    except ValueError:
        return jsonify({'error': 'Invalid coordinates'}), 400
    
    # Get full address details
    address, landmarks, pin_code, address_parts = reverse_geocode(lat, lon)
    
    # Generate shareable map link
    map_link = generate_map_link(lat, lon, "My Location")
    
    # Build detailed location response
    location_info = {
        'success': True,
        'coordinates': {
            'latitude': lat,
            'longitude': lon,
            'accuracy_meters': accuracy
        },
        'address': {
            'full_address': address,
            'pin_code': pin_code,
            'components': {
                'road': address_parts.get('road'),
                'suburb': address_parts.get('suburb'),
                'city': address_parts.get('city') or address_parts.get('town'),
                'state': address_parts.get('state'),
                'country': address_parts.get('country')
            }
        },
        'landmarks': landmarks,
        'map_link': map_link,
        'formatted_display': f"{lat:.6f}, {lon:.6f}"
    }
    
    if pin_code:
        location_info['address']['pin_code'] = pin_code
    
    return jsonify(location_info)

@app.route('/nearby_places', methods=['POST'])
def nearby_places():
    """Find nearby places within specified radius."""
    data = request.get_json()
    if not data or 'lat' not in data or 'lon' not in data:
        return jsonify({'error': 'Location coordinates required'}), 400
    
    try:
        lat = float(data['lat'])
        lon = float(data['lon'])
        radius =  int(data.get('radius', 500))  # Default 500 meters
    except ValueError:
        return jsonify({'error': 'Invalid parameters'}), 400
    
    # Get nearby places
    places = get_nearby_places(lat, lon, radius)
    
    # Get current location address
    address, landmarks, pin_code, address_parts = reverse_geocode(lat, lon)
    
    return jsonify({
        'success': True,
        'current_location': address,
        'nearby_places': places,
        'landmarks': landmarks,
        'search_radius_meters': radius,
        'total_found': len(places)
    })

@app.route('/share_location', methods=['POST'])
def share_location():
    """Generate shareable location link."""
    data = request.get_json()
    if not data or 'lat' not in data or 'lon' not in data:
        return jsonify({'error': 'Location coordinates required'}), 400
    
    try:
        lat = float(data['lat'])
        lon = float(data['lon'])
        label = data.get('label', 'Shared Location')
    except ValueError:
        return jsonify({'error': 'Invalid coordinates'}), 400
    
    # Generate map link
    map_link = generate_map_link(lat, lon, label)
    
    # Get address for sharing
    address, landmarks, pin_code, _ = reverse_geocode(lat, lon)
    
    # Create shareable messages
    share_text = f"📍 {label}\n🗺️ {address if address else f'{lat:.6f}, {lon:.6f}'}\n🔗 {map_link}"
    
    return jsonify({
        'success': True,
        'share_link': map_link,
        'share_text': share_text,
        'address': address,
        'coordinates': f'{lat:.6f}, {lon:.6f}'
    })

if __name__ == '__main__':
    app.run(debug=True)
