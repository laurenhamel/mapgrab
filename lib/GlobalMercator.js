// Define constants.
const pi_div_360 = Math.PI / 360.0;
const pi_div_180 = Math.PI / 180.0;
const pi_div_2 = Math.PI / 2.0;
const pi_4 = Math.PI * 4;
const pi_2 = Math.PI * 2;
const pi = Math.PI;
const _180_div_pi = 180 / Math.PI;

// Build class.
class GlobalMercator {

  // Construct
    constructor() {
      this.tileSize = 512;
      this.initialResolution = pi_2 * 6378137 / this.tileSize;
      this.originShift = pi_2 * 6378137 / 2.0;
    }

    // Convert coordinates to meters.
    CoordsToMeters(lat, lng) {
        // Converts given lat/lng in WGS84 Datum to XY in Spherical Mercator EPSG:900913
        let mx = lng * this.originShift / 180.0;
        let my = Math.log(Math.tan((90 + lat) * pi_div_360)) / pi_div_180;

        my = my * this.originShift / 180.0;
        return { mx: mx, my: my };
    }

    // Convert meters to coordinates.
    MetersToCoords(mx, my) {
        // Converts XY point from Spherical Mercator EPSG:900913 to lat/lng in WGS84 Datum
        let lng = mx / this.originShift * 180.0;
        let lat = my / this.originShift * 180.0;
        lat =
            _180_div_pi *
            (2 * Math.atan(Math.exp(lat * pi_div_180)) - pi_div_2);
        return { lat: lat, lng: lng };
    }

    // Convert meters to pixels.
    MetersToPixels(mx, my, zoom) {
        // Converts EPSG:900913 to pyramid pixel coordinates in given zoom level
        var res = this.Resolution(zoom);
        var px = (mx + this.originShift) / res;
        var py = (my + this.originShift) / res;
        return { px: px, py: py };
    }

    // Get resolution (meters/pixel) from zoom.
    Resolution(zoom) {
        // Resolution (meters/pixel) for given zoom level (measured at Equator)
        return this.initialResolution / Math.pow(2, zoom);
    }

    // Get tile boundaries.
    TileBounds(tx, ty, zoom) {
        // Returns bounds of the given tile in EPSG:900913 coordinates
        let minx, miny, maxx, maxy;
        minx = this.PixelsToMeters(
            tx * this.tileSize,
            ty * this.tileSize,
            zoom
        )["mx"];
        miny = this.PixelsToMeters(
            tx * this.tileSize,
            ty * this.tileSize,
            zoom
        )["my"];
        maxx = this.PixelsToMeters(
            (tx + 1) * this.tileSize,
            (ty + 1) * this.tileSize,
            zoom
        )["mx"];
        maxy = this.PixelsToMeters(
            (tx + 1) * this.tileSize,
            (ty + 1) * this.tileSize,
            zoom
        )["my"];
        return { minx: minx, miny: miny, maxx: maxx, maxy: maxy };
    }

    // Convert pixels to meters.
    PixelsToMeters(px, py, zoom) {
        // Converts pixel coordinates in given zoom level of pyramid to EPSG:900913
        var res, mx, my;
        res = this.Resolution(zoom);
        mx = px * res - this.originShift;
        my = py * res - this.originShift;
        return { mx: mx, my: my };
    }

    // Convert pixels to tiles.
    PixelsToTile(px, py) {
        // Returns a tile covering region in given pixel coordinates
        var tx, ty;
        tx = Math.round(Math.ceil(px / this.tileSize) - 1);
        ty = Math.round(Math.ceil(py / this.tileSize) - 1);
        return { tx: tx, ty: ty };
    }

    // Get pixels of map to raster.
    PixelsToRaster(px, py, zoom) {
        // Move the origin of pixel coordinates to top-left corner
        var mapSize;
        mapSize = this.tileSize << zoom;
        return { x: px, y: mapSize - py };
    }

    // Get coordinates of map to tile.
    CoordsToTile(lat, lng, zoom) {
        var meters = this.CoordsToMeters(lat, lng);
        var pixels = this.MetersToPixels(meters.mx, meters.my, zoom);
        return this.PixelsToTile(pixels.px, pixels.py);
    }

    // Get meters of map to tile.
    MetersToTile(mx, my, zoom) {
        var pixels = this.MetersToPixels(mx, my, zoom);
        return this.PixelsToTile(pixels.px, pixels.py);
    }

    // Convert TMS tiles coordinates to Google tile coordinates.
    GoogleTile(tx, ty, zoom) {
        // Converts TMS tile coordinates to Google Tile coordinates
        // coordinate origin is moved from bottom-left to top-left corner of the extent
        return { tx: tx, ty: Math.pow(2, zoom) - 1 - ty };
    }

    // Convert TMS coordinates to QuadTree coordinates.
    QuadKey(tx, ty, zoom) {
        // Converts TMS tile coordinates to Microsoft QuadTree
        let quadKey = "";
        ty = 2 ** zoom - 1 - ty;
        for (let i = zoom; i > 0; i--) {
            let digit = 0;
            let mask = 1 << (i - 1);
            if ((tx & mask) != 0) {
                digit += 1;
            }
            if ((ty & mask) != 0) {
                digit += 2;
            }
            quadKey += digit.toString();
        }
        return quadKey;
    }

    // Convert QuadKey coordinates to TMS coordinates.
    QuadKeyToTile(quadKey) {
        // Transform quadkey to tile coordinates
        let tx = 0;
        let ty = 0;
        let zoom = quadKey.length;
        for (let i = 0; i < zoom; i++) {
            let bit = zoom - i;
            let mask = 1 << (bit - 1);
            if (quadKey[zoom - bit] === "1") {
                tx |= mask;
            }
            if (quadKey[zoom - bit] == "2") {
                ty |= mask;
            }
            if (quadKey[zoom - bit] == "3") {
                tx |= mask;
                ty |= mask;
            }
        }
        ty = 2 ** zoom - 1 - ty;
        return { tx: tx, ty: ty, zoom: zoom };
    }

}

// Export class.
module.exports = GlobalMercator;
