/**
 * Utility functions for Digital Planter
 * Replaces Python backend utility functions
 */

/**
 * Calculate distance between two points in kilometers using Haversine formula
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
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

/**
 * Get proximity alert message based on distance
 */
export function getDistanceAlert(distanceKm) {
    if (distanceKm < 0.05) { // 50 meters
        return { message: "You've arrived at your plant! 🎉", level: "arrived" };
    } else if (distanceKm < 1) {
        return { message: "Your plant is very close! Less than 1 km away! 🌱", level: "very_close" };
    } else if (distanceKm < 5) {
        return { message: "Your plant is nearby - within 5 km! 🌿", level: "nearby" };
    } else if (distanceKm < 10) {
        return { message: "You're approaching your plant - within 10 km.", level: "approaching" };
    } else if (distanceKm < 15) {
        return { message: "Getting closer to your plant - within 15 km.", level: "closer" };
    } else if (distanceKm < 20) {
        return { message: "You're in the same region as your plant - within 20 km.", level: "same_region" };
    } else {
        return { message: `Your plant is ${distanceKm.toFixed(1)} km away.`, level: "far" };
    }
}

/**
 * Generate Google Maps shareable link
 */
export function generateMapLink(lat, lon) {
    return `https://www.google.com/maps?q=${lat},${lon}&ll=${lat},${lon}&z=15`;
}

/**
 * Reverse geocode coordinates to address using Nominatim API
 * @returns {Promise<{address: string, landmarks: string[], pinCode: string|null, addressParts: Object}>}
 */
export async function reverseGeocode(lat, lon) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
        const response = await fetch(url, {
            headers: { 'User-Agent': 'DigitalPlanterApp/1.0' }
        });

        if (!response.ok) throw new Error('Geocoding failed');

        const data = await response.json();
        const address = data.display_name || 'Unknown location';
        const addressParts = data.address || {};

        // Extract landmarks
        const landmarks = [];
        if (addressParts.road) landmarks.push(addressParts.road);
        if (addressParts.suburb) landmarks.push(addressParts.suburb);
        if (addressParts.city) landmarks.push(addressParts.city);
        else if (addressParts.town) landmarks.push(addressParts.town);

        const pinCode = addressParts.postcode || null;

        return { address, landmarks, pinCode, addressParts };
    } catch (error) {
        console.error('Reverse geocode error:', error);
        return { address: null, landmarks: [], pinCode: null, addressParts: {} };
    }
}

/**
 * Get detailed location information
 */
export async function getMyLocationInfo(lat, lon, accuracy = null) {
    const { address, landmarks, pinCode, addressParts } = await reverseGeocode(lat, lon);
    const mapLink = generateMapLink(lat, lon);

    return {
        success: true,
        coordinates: { latitude: lat, longitude: lon, accuracy_meters: accuracy },
        address: {
            full_address: address,
            pin_code: pinCode,
            components: {
                road: addressParts.road || null,
                suburb: addressParts.suburb || null,
                city: addressParts.city || addressParts.town || null,
                state: addressParts.state || null,
                country: addressParts.country || null
            }
        },
        landmarks,
        map_link: mapLink,
        formatted_display: `${lat.toFixed(6)}, ${lon.toFixed(6)}`
    };
}

/**
 * Generate shareable location data
 */
export async function shareLocation(lat, lon, label = 'Shared Location') {
    const { address } = await reverseGeocode(lat, lon);
    const mapLink = generateMapLink(lat, lon);

    const shareText = `📍 ${label}\n🗺️ ${address || `${lat.toFixed(6)}, ${lon.toFixed(6)}`}\n🔗 ${mapLink}`;

    return {
        success: true,
        share_link: mapLink,
        share_text: shareText,
        address,
        coordinates: `${lat.toFixed(6)}, ${lon.toFixed(6)}`
    };
}
