/**
 * Data Service - Firestore management for plants
 * Replaces localStorage and Flask backend
 */

import { db, auth } from './config.js';
import {
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    query,
    where,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

const COLLECTION_NAME = 'plants';

// Default plants (static data, not stored in Firestore unless needed)
const DEFAULT_PLANTS = [
    { id: "41e64da4-b8ef-4024-9c85-1eac8de0ace0", name: "Oak Tree - Central Park Lawn, NYC 🌳", lat: 40.7829, lon: -73.9654, is_user_planted: false, photo_url: null, address: "Central Park, NYC", landmarks: ["The Mall", "Sheep Meadow"], type: 'tree' },
    { id: "2ddffcd4-b360-4054-a3fd-0a5a48460d9d", name: "Rose Bush - Embarcadero Waterfront, SF 🌸", lat: 37.7955, lon: -122.3937, is_user_planted: false, photo_url: null, address: "Embarcadero, San Francisco", landmarks: ["Ferry Building"], type: 'flower' },
    { id: "6808fb07-2f1c-43a4-9e30-e39fd697aac3", name: "Lavender - Tuileries Garden Path, Paris 🌸", lat: 48.8634, lon: 2.3275, is_user_planted: false, photo_url: null, address: "Tuileries Garden, Paris", landmarks: ["Louvre Museum"], type: 'flower' },
    { id: "d55a8eea-a887-42ef-9c12-1c2d37cc241d", name: "Jasmine - Rajpath Road, New Delhi 🌸", lat: 28.6143, lon: 77.2088, is_user_planted: false, photo_url: null, address: "Rajpath, New Delhi", landmarks: ["India Gate"], type: 'flower' },
    { id: "e5199213-b2df-4875-94e9-d826a4f22608", name: "Maple Tree - Bryant Park Lawn, NYC 🌳", lat: 40.7536, lon: -73.9832, is_user_planted: false, photo_url: null, address: "Bryant Park, NYC", landmarks: ["Public Library"], type: 'tree' },
    { id: "8386283c-9d35-4699-b114-5eb2e606745d", name: "Sunflower - Hyde Park Corner, London 🌸", lat: 51.5027, lon: -0.1527, is_user_planted: false, photo_url: null, address: "Hyde Park, London", landmarks: ["Serpentine"], type: 'flower' },
    { id: "0460971c-29e5-403f-892f-def89bad08ce", name: "Petunia - Marina Beach Road, Chennai 🌸", lat: 13.0499, lon: 80.2824, is_user_planted: false, photo_url: null, address: "Marina Beach, Chennai", landmarks: ["Light House"], type: 'flower' },
    { id: "37f4a051-cfd2-46a1-a740-98d3bc9b86a6", name: "Bamboo - Lodhi Garden Path, Delhi 🌳", lat: 28.5933, lon: 77.2197, is_user_planted: false, photo_url: null, address: "Lodhi Garden, Delhi", landmarks: ["Tomb"], type: 'tree' }
];

/**
 * Fetch all plants (defaults + Firestore)
 */
export async function getAllPlants() {
    const firestorePlants = await getFirestorePlants();
    return [...DEFAULT_PLANTS, ...firestorePlants];
}

/**
 * Fetch plants for the current user
 */
export async function getUserPlants() {
    if (!auth.currentUser) return [];
    return await getFirestorePlants(auth.currentUser.uid);
}

/**
 * Common fetch logic for Firestore plants
 */
async function getFirestorePlants(userId = null) {
    try {
        let q;
        if (userId) {
            q = query(collection(db, COLLECTION_NAME), where("user_id", "==", userId));
        } else {
            q = query(collection(db, COLLECTION_NAME));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (e) {
        console.error("Error fetching plants from Firestore:", e);
        return [];
    }
}

/**
 * Add a new plant to Firestore
 */
export async function addPlant(plantData) {
    if (!auth.currentUser) {
        throw new Error("User must be authenticated to add plants.");
    }

    const emoji = plantData.type === 'tree' ? '🌳' : '🌸';
    const fullName = `${plantData.name} ${emoji}`;

    const newPlant = {
        user_id: auth.currentUser.uid,
        name: fullName,
        lat: plantData.lat,
        lon: plantData.lon,
        is_user_planted: true,
        photo_url: plantData.photo_url || null,
        address: plantData.address || null,
        landmarks: plantData.landmarks || [],
        type: plantData.type,
        timestamp: serverTimestamp()
    };

    try {
        const docRef = await addDoc(collection(db, COLLECTION_NAME), newPlant);
        return { id: docRef.id, ...newPlant };
    } catch (e) {
        console.error("Error adding plant to Firestore:", e);
        throw e;
    }
}

/**
 * Delete a plant from Firestore
 */
export async function deletePlant(id) {
    try {
        await deleteDoc(doc(db, COLLECTION_NAME, id));
        return true;
    } catch (e) {
        console.error("Error deleting plant from Firestore:", e);
        return false;
    }
}

/**
 * Get a single plant by ID
 */
export async function getPlant(id) {
    // Check defaults first
    const defaultPlant = DEFAULT_PLANTS.find(p => p.id === id);
    if (defaultPlant) return defaultPlant;

    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (e) {
        console.error("Error getting plant from Firestore:", e);
        return null;
    }
}

/**
 * Check if user is near any plants
 */
export async function checkNearbyPlants(userLat, userLon) {
    const plants = await getAllPlants();

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
