/**
 * Social Media Post Generation
 * Replaces Flask's generate_social_post endpoint
 */

import { generateMapLink } from './utils.js';

/**
 * Generate platform-specific social media posts
 * @param {Object} plant - Plant object with name, lat, lon, address, landmarks
 * @returns {Object} Templates for various platforms and plant info
 */
export function generateSocialPost(plant) {
    const mapLink = generateMapLink(plant.lat, plant.lon);

    // Determine plant type from emoji in name
    let plantType = 'plant';
    let plantEmoji = '🌱';
    if (plant.name.includes('🌳')) {
        plantType = 'tree';
        plantEmoji = '🌳';
    } else if (plant.name.includes('🌸')) {
        plantType = 'flower';
        plantEmoji = '🌸';
    }

    const cleanName = plant.name.replace('🌳', '').replace('🌸', '').trim();
    const locationInfo = plant.address || `${plant.lat.toFixed(4)}, ${plant.lon.toFixed(4)}`;
    const landmarksText = plant.landmarks && plant.landmarks.length > 0
        ? `Near: ${plant.landmarks.slice(0, 2).join(', ')}`
        : '';

    const templates = {
        short: `Just planted a new ${plantType} today! 🌿${plantEmoji}\nOne small step for a greener tomorrow. 🌍✨\n\n📍 ${cleanName}\n🗺️ ${mapLink}`,

        inspirational: `Today I planted a ${plantType} — a tiny act of kindness for our planet.\nLet's grow more green together! 🌱💚\n\n📍 ${cleanName}\n🗺️ ${locationInfo}\n🔗 ${mapLink}\n\n#PlantMore #GoGreen #DigitalPlanter`,

        social: `New plant baby added to my garden! ${plantEmoji}🌱\nEvery plant is a promise for a better future.\n\n📍 ${cleanName}\n🗺️ ${locationInfo}\n${landmarksText}\n🔗 ${mapLink}\n\n#NatureLove #PlantationDrive #GreenLife #EcoWarrior`,

        instagram: `Planted something beautiful today.\nHoping it grows strong and bright—just like dreams. ✨🌱\n\n${plantEmoji} ${cleanName}\n📍 ${locationInfo}\n${landmarksText}\n\nView on map: ${mapLink}\n\n#GardenVibes #PlantingDay #NatureMagic #GreenThumb #EcoFriendly`,

        detailed: `🌱 I planted a ${plantType} today!\n\n📍 ${cleanName}\n🗺️ ${locationInfo}\n📌 Coordinates: ${plant.lat.toFixed(4)}, ${plant.lon.toFixed(4)}\n${landmarksText ? `🏞️ ${landmarksText}` : ''}\n\nView on map: ${mapLink}\n\n#DigitalPlanter #PlantATree #GreenEarth #SaveThePlanet #ClimateAction`,

        whatsapp: `Planted a new ${plantType} today ${plantEmoji}\nLet's make the Earth greener, one plant at a time!\n\n📍 ${cleanName}\n${mapLink}`,

        youtube: `Planting a new ${plantType} today! 🌱\nJoin me in making the world greener.\n\n📍 ${cleanName}\n🗺️ ${locationInfo}\n${mapLink}\n\nLike, share, and comment what plant I should grow next! 🌿✨\n#shorts #planting #green #ecofriendly #nature`,

        professional: `I planted a new ${plantType} today as part of my commitment to environmental care.\nSmall actions create big impacts. 🌱🌍\n\n📍 Location: ${cleanName}\n🗺️ ${locationInfo}\n🔗 ${mapLink}\n\n#Sustainability #EcoFriendly #CorporateResponsibility #GreenInitiative`,

        twitter: `🌱 Just planted a ${plantType}!\n\n📍 ${cleanName}\n🗺️ ${mapLink}\n\n#PlantATree #GoGreen`
    };

    return {
        templates,
        map_link: mapLink,
        plant_info: {
            name: cleanName,
            type: plantType,
            emoji: plantEmoji,
            address: locationInfo,
            landmarks: plant.landmarks || [],
            coordinates: `${plant.lat.toFixed(4)}, ${plant.lon.toFixed(4)}`
        }
    };
}
