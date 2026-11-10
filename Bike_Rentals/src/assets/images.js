// Image dictionary for React Native bundling
export const IMAGES = {
  'apex-sport': require('../../assets/images/apex-sport.jpg'),
  'cockpit': require('../../assets/images/cockpit.jpg'),
  'commuter': require('../../assets/images/commuter.jpg'),
  'engine': require('../../assets/images/engine.jpg'),
  'heritage-cruiser': require('../../assets/images/heritage-cruiser.jpg'),
  'hero-bike': require('../../assets/images/hero-bike.jpg'),
  'night-hawk-cruiser': require('../../assets/images/night-hawk-cruiser.jpg'),
  'phantom-sport': require('../../assets/images/phantom-sport.jpg'),
  'scooter': require('../../assets/images/scooter.jpg'),
  'workshop': require('../../assets/images/workshop.jpg'),
};

/**
 * Resolves an image path from the web data structure into a React Native compatible ImageSource
 * @param {string | object | number} source
 * @returns {object | number}
 */
export function resolveImage(source) {
  if (!source) {
    return IMAGES['hero-bike'];
  }

  if (typeof source === 'number' || (typeof source === 'object' && source.uri)) {
    return source;
  }

  if (typeof source === 'string') {
    if (
      source.startsWith('http://') ||
      source.startsWith('https://') ||
      source.startsWith('blob:') ||
      source.startsWith('data:')
    ) {
      return { uri: source };
    }

    // Extract filename without path and extension
    const cleanKey = source
      .replace(/^\/images\//, '')
      .replace(/^images\//, '')
      .replace(/\.(jpg|jpeg|png|webp|svg)$/i, '');

    if (IMAGES[cleanKey]) {
      return IMAGES[cleanKey];
    }

    if (source.includes('/') || source.includes('\\')) {
      return { uri: source };
    }
  }

  return IMAGES['hero-bike'];
}
