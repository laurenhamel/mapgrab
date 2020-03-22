// Load dependencies.
const _ = require('lodash');
const axios = require('axios');

// Load utilities.
const GlobalMercator = new (require('./GlobalMercator'))();

// Get environment variables.
const { MAPTILER_API_URL, MAPTILER_API_KEY, MAPTILER_MAP_ID } = process.env;

// Build API class.
class MapTiler {

  // Construct
  constructor (options) {

    // Save API URL.
    this.url = MAPTILER_API_URL;

    // Save API key.
    this.key = MAPTILER_API_KEY;

    // Save map ID.
    this.map = MAPTILER_MAP_ID;

    // Extend settings.
    this.settings = _.merge({
      zoom: 12.9,
      rotation: 0
    }, this.options);

    // Build API endpoints.
    this.endpoint = {
      maps: (lat, lng) => {

        // Output the maps API endpoint.
        return `${this.url}/maps/${this.map}/?key=${this.key}#${this.settings.zoom}/${lat}/${lng}/${this.settings.rotation}`;

      },
      geocoding: (dest) => {

        // Get URI-friendly destination name.
        dest = _.replace(encodeURI(dest), '%20', '+');

        // Output the geocoding API endpoint.
        return `${this.url}/geocoding/${dest}.json?key=${this.key}`;

       }
    };

  }

  // Get geocoding data for a destination.
  async GeocodingData (dest) {

    // Get geocoding data for the given destination.
    const response = await axios.get(this.endpoint.geocoding(dest));

    // Return data for the first location match.
    return response.data.features[0];

  }

  // Get map data for a destination.
  async MapData (dest) {

    // Get geocoding data.
    const geocoding = await this.GeocodingData(dest);

    // Return map data for the destination.
    return {
      geocoding,
      bounds: {
        SW: [geocoding.bbox[1], geocoding.bbox[0]],
        NE: [geocoding.bbox[3], geocoding.bbox[2]]
      },
      coords: [geocoding.center[1], geocoding.center[0]],
    };

  }

  // Get a map URL for a given latitude and longitude.
  MapURL (lat, lng) {

    // Return the URL.
    return this.endpoint.maps(lat, lng);

  }

}

// Export class.
module.exports = MapTiler;
