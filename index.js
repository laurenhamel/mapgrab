#!/usr/bin/env node

// Load environment variables.
require('dotenv').config();

// Load dependencies.
const _ = require('lodash');
const fs = require('fs-extra');
const { program } = require('commander');
const capture = require('capture-website');
const MapTiler = new (require('./lib/MapTiler'))();

// Load package data.
const pkg = require('./package.json');

// Set program version.
program.version(pkg.version);

// Define program options.
program.option('-l, --location <location>', 'The map location', async (dest) => {

  // Get data for the destination.
  const data = await MapTiler.MapData(dest);

  // Get the URL for the map.
  const url = MapTiler.MapURL(...data.coords);

  // Generate image file name.
  const filename = data.coords.map((coord) => _.replace(coord, '.', ',')).join('x');

  // Ensure the temporary folder is in place.
  fs.ensureDirSync('tmp/');

  // Take a screenshot of the map and save it to an image.
  const img = await capture.file(url, `tmp/${filename}.png`, {
    overwrite: true,
    hideElements: ['.mapboxgl-control-container']
  });

});

// Parse agurments.
program.parse(process.argv);
