#!/usr/bin/env node

// TODO: Add support for passing SW+NE boundary coordinates instead of location.

// Load environment variables.
require('dotenv').config();

// Load dependencies.
const _ = require('lodash');
const fs = require('fs-extra');
const chalk = require('chalk');
const { program } = require('commander');
const capture = require('capture-website');
const MapTiler = new (require('./lib/MapTiler'))();
const ProgressBar = require('cli-progress');
const matrix = require('./lib/utils/matrix');
const queue = require('./lib/utils/queue');

// Load package data.
const pkg = require('./package.json');

// Set program version.
program.version(pkg.version);

// Define program options, and run it.
program
  .option('-l, --location <location>', 'The map location')
  .option('-c, --coordinates <coordinates>', 'The SW and NE coordinates for the map area, given as `[SW Latitude, SW Longitude] [NE Latitude, NE Longitude]`')
  .option('-t, --tile <number>', 'The tile number within the grid to regenerate')
  .parse(process.argv);

// Run program asynchronously.
(async () => {

  // Configure the program.
  const config = {
    lat: {
      offset: .03
    },
    lng: {
      offset: .06
    }
  };

  // Get data for the destination.
  const data = await MapTiler.MapData(program.location);

  // Get the place name.
  const place = {
    long: data.geocoding.place_name,
    short: data.geocoding.text
  };

  // Output a message.
  console.log(`Capturing map of ${chalk.cyan(place.long)}...`);

  // Define coordinates.
  const coords = {
    SW: data.bounds.SW,
    NE: data.bounds.NE
  };

  // Parse and override coordinates if they were given.
  if(program.coordinates) {

    // Initialize a regex to help validate coordinates.
    const regex = /^(\[(\-?\d+(?:\.\d+)?)\, ?(\-?\d+(?:\.\d+)?)\]) (\[(\-?\d+(?:\.\d+)?)\, ?(\-?\d+(?:\.\d+)?)\])$/;

    // Initialize empty match set.
    let matches;

    // Validate that valid coordinates were given.
    if((matches = program.coordinates.trim().match(regex))) {

      // Capture the SW and NE coordinates.
      coords.SW = [+matches[2], +matches[3]];
      coords.NE = [+matches[5], +matches[6]];

    }

  }

  // Calculate minimum and maximum coordinates to capture.
  config.lat.min = coords.SW[0];
  config.lat.max = coords.NE[0];
  config.lat.diff = Math.abs(config.lat.max - config.lat.min);
  config.lat.steps = Math.ceil(config.lat.diff / config.lat.offset);
  config.lng.min = coords.SW[1];
  config.lng.max = coords.NE[1];
  config.lng.diff = Math.abs(config.lng.max - config.lng.min);
  config.lng.steps = Math.ceil(config.lng.diff / config.lng.offset);

  // Generate an matrix of image coordinates.
  const range = matrix.new(config.lat.steps, config.lng.steps, (lat, lng, x, y) => {

    // Calcualte the latitude and longitude coordinate.
    const _lat = config.lat.min + (x * config.lat.offset);
    const _lng = config.lng.min + (y * config.lng.offset);

    // Return the new coordinates.
    return [_lat, _lng];

  });

  // Get matrix dimensions.
  const grid = {
    x: config.lat.steps,
    y: config.lng.steps,
    n: config.lat.steps * config.lng.steps,
    i: 0
  };

  // Output a message.
  console.log(`Map area will be rendered as a ${chalk.magenta(grid.x)} x ${chalk.magenta(grid.y)} grid (${chalk.magenta(grid.x * grid.y)} total tiles).`);

  // Initialize a progress bar.
  const progress = new ProgressBar.SingleBar({}, ProgressBar.Presets.shades_classic);

  // Start the progress bar.
  progress.start(program.tile ? 1 : grid.n);

  // Get coordinates as strings.
  coords.SW.toString = () => coords.SW.map((coord) => _.replace(coord, '.', ',')).join('x');
  coords.NE.toString = () => coords.NE.map((coord) => _.replace(coord, '.', ',')).join('x');

  // Create a directory for saving the images.
  const dir = `images/${_.replace(place.short, / /g, '-')}_${coords.SW.toString()}_${coords.NE.toString()}`;

  // Ensure the images folder is in place.
  fs.ensureDirSync(dir);

  // Build an array of request data.
  const requests = [];

  // Loop through the range of coordinates and grab screenshots.
  range.each((row, col, x, y) => {

    // Get the map URL for the coordinate.
    const url = MapTiler.MapURL(...col);

    // Increment the grid step.
    grid.i++;

    // Generate an image file name.
    const filename = `${_.padStart(grid.i, 2, '0')}_${x + 1}x${y + 1}_${col.map((coord) => _.replace(col, '.', ',')).join('x')}`;

    // If a tile number was given, then use it.
    if(program.tile) {

      // Only add the requested tile number to the queue.
      if(grid.i === +program.tile) {

        // Add screen grabs to the queue.
        queue.push({
          url,
          path: `${dir}/${filename}.png`,
          coords: col
        });

      }

    }

    // Otherwise, add all tiles to the queue.
    else {

      // Add screen grabs to the queue.
      queue.push({
        url,
        path: `${dir}/${filename}.png`,
        coords: col
      });

    }

  });

  // Capture statuses of images.
  const success = [];
  const errors = [];

  // Process each request.
  queue.process((request) => {

    // Capture data about the request.
    const { url, path, coords } = request;

      // Take a screenshot of the map image.
      return capture.file(url, path, {
        overwrite: true,
        hideElements: ['.mapboxgl-control-container'],
        delay: 2.5,
        timeout: 0
      }).then(() => {

        // Capture data about the saved image.
        success.push({
          coords,
          path
        });

      }).catch((error) => {

        // Capture any errors.
        errors.push({
          coords,
          path,
          error: error.message
        });

      }).finally(() => {

        // Update the progress bar.
        progress.increment();

      });

  })
    .then(() => {})
    .catch(() => {})
    .finally(() => {

      // Stop the progress bar.
      progress.stop();

      // Determine if errors occurred.
      if(errors.length) {

        // Output a message.
        console.log(chalk.red(`Map images saved, but ${errors.length} errors occurred.`));

        // Output errors.
        errors.forEach((error) => console.log(error));

      }

      // Otherwise, everything worked.
      else {

        // Output a message.
        console.log(chalk.green(`Map images saved successfully.`));

      }

    });

})();
