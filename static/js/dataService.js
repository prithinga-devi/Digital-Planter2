/**
 * Data Service - localStorage management for plants
 * Replaces Flask backend API endpoints
 */

const STORAGE_KEY = 'digital_planter_plants';

// Default plants (seeded on first load)
const DEFAULT_PLANTS = [
    { id: "41e64da4-b8ef-4024-9c85-1eac8de0ace0", name: "Oak Tree - Central Park Lawn, NYC", lat: 40.7829, lon: -73.9654, is_user_planted: false, photo_url: null, address: null, landmarks: [] },
    { id: "2ddffcd4-b360-4054-a3fd-0a5a48460d9d", name: "Rose Bush - Embarcadero Waterfront, SF", lat: 37.7955, lon: -122.3937, is_user_planted: false, photo_url: null, address: null, landmarks: [] },
    { id: "6808fb07-2f1c-43a4-9e30-e39fd697aac3", name: "Lavender - Tuileries Garden Path, Paris", lat: 48.8634, lon: 2.3275, is_user_planted: false, photo_url: null, address: null, landmarks: [] },
    { id: "d55a8eea-a887-42ef-9c12-1c2d37cc241d", name: "Jasmine - Rajpath Road, New Delhi", lat: 28.6143, lon: 77.2088, is_user_planted: false, photo_url: null, address: null, landmarks: [] },
    { id: "e5199213-b2df-4875-94e9-d826a4f22608", name: "Maple Tree - Bryant Park Lawn, NYC", lat: 40.7536, lon: -73.9832, is_user_planted: false, photo_url: null, address: null, landmarks: [] },
    { id: "8386283c-9d35-4699-b114-5eb2e606745d", name: "Sunflower - Hyde Park Corner, London", lat: 51.5027, lon: -0.1527, is_user_planted: false, photo_url: null, address: null, landmarks: [] },
    { id: "0460971c-29e5-403f-892f-def89bad08ce", name: "Petunia - Marina Beach Road, Chennai", lat: 13.0499, lon: 80.2824, is_user_planted: false, photo_url: null, address: null, landmarks: [] },
    { id: "37f4a051-cfd2-46a1-a740-98d3bc9b86a6", name: "Bamboo - Lodhi Garden Path, Delhi", lat: 28.5933, lon: 77.2197, is_user_planted: false, photo_url: null, address: null, landmarks: [] }
];

/**
 * Generate a UUID v4
 */
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Load all plants from localStorage
 * Seeds default plants on first load
 */
export function loadPlants() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error('Error parsing plants from localStorage:', e);
        }
    }
    // First load - seed defaults
    savePlants(DEFAULT_PLANTS);
    return [...DEFAULT_PLANTS];
}

/**
 * Save plants array to localStorage
 */
export function savePlants(plants) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plants));
}

/**
 * Add a new plant
 * @param {Object} plantData - Plant data (name, lat, lon, type, photo_url, address, landmarks)
 * @returns {Object} The created plant with ID
 */
export function addPlant(plantData) {
    const plants = loadPlants();

    const emoji = plantData.type === 'tree' ? '🌳' : '🌸';
    const fullName = `${plantData.name} ${emoji}`;

    const newPlant = {
        id: generateUUID(),
        user_id: null,
        name: fullName,
        lat: plantData.lat,
        lon: plantData.lon,
        is_user_planted: true,
        photo_url: plantData.photo_url || null,
        address: plantData.address || null,
        landmarks: plantData.landmarks || []
    };

    plants.push(newPlant);
    savePlants(plants);

    return newPlant;
}

/**
 * Delete a plant by ID
 * @param {string} id - Plant ID
 * @returns {boolean} True if deleted, false if not found
 */
export function deletePlant(id) {
    const plants = loadPlants();
    const initialLength = plants.length;
    const filtered = plants.filter(p => p.id !== id);

    if (filtered.length < initialLength) {
        savePlants(filtered);
        return true;
    }
    return false;
}

/**
 * Get a single plant by ID
 * @param {string} id - Plant ID
 * @returns {Object|null} The plant or null if not found
 */
export function getPlant(id) {
    const plants = loadPlants();
    return plants.find(p => p.id === id) || null;
}

/**
 * Get all plants
 */
export function getAllPlants() {
    return loadPlants();
}

/**
 * Get only user-planted plants
 */
export function getUserPlants() {
    return loadPlants().filter(p => p.is_user_planted);
}

/**
 * Check if user is near any plants
 * @param {number} userLat - User latitude
 * @param {number} userLon - User longitude
 * @returns {Object} { nearby: boolean, message: string }
 */
export function checkNearbyPlants(userLat, userLon) {
    const plants = loadPlants();

    for (const plant of plants) {
        const distance = calculateDistance(userLat, userLon, plant.lat, plant.lon);
        if (distance <= 50) { // 50 meters
            return {
                nearby: true,
                message: `Welcome to ${plant.name}! You are within ${distance.toFixed(2)} meters.`
            };
        }
    }

    return { nearby: false, message: 'No plants nearby.' };
}

/**
 * Calculate distance between two points in meters using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) ** 2 +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}
