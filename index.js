#!/usr/bin/env node

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
const queue = require('./lib/queue');

// Load package data.
const pkg = require('./package.json');

// Set program version.
program.version(pkg.version);

// Define program options.
program
  .option('-l, --location <location>', 'The map location')
  .option('-t, --tile <number>', 'The tile number within the grid to regenerate');

// Parse program agurments.
program.parse(process.argv);

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

  // Output a message.
  console.log(`Capturing map of ${chalk.cyan(data.geocoding.place_name)}...`);

  // Calculate minimum and maximum coordinates to capture.
  config.lat.min = data.bounds.SW[0];
  config.lat.max = data.bounds.NE[0];
  config.lat.diff = Math.abs(config.lat.max - config.lat.min);
  config.lat.steps = Math.ceil(config.lat.diff / config.lat.offset);
  config.lng.min = data.bounds.SW[1];
  config.lng.max = data.bounds.NE[1];
  config.lng.diff = Math.abs(config.lng.max - config.lng.min);
  config.lng.steps = Math.ceil(config.lng.diff / config.lng.offset);

  // Generate an empty matrix for the image coordinates.
  let matrix = new Array(config.lat.steps).fill(null).map(() => ([
    ...new Array(config.lng.steps).fill(null)
  ]));

  // Fill the matrix with the range of coordinates.
  matrix = matrix.map((lat, x) => {

    // Calcualte the latitude coordinate.
    const _lat = config.lat.min + (x * config.lat.offset);

    // Return the calculated coordinates.
    return lat.map((lng, y) => {

      // Calculate the longitude coordinate.
      const _lng = config.lng.min + (y * config.lng.offset);

      // Return the new coordinates.
      return [_lat, _lng];

    });

  });

  // Get matrix dimensions.
  const grid = {
    x: config.lat.steps,
    y: config.lng.steps,
    n: config.lat.steps * config.lng.steps,
    i: 0
  };

  // Output a message.
  console.log(`Map area will be rendered as a ${chalk.magenta(grid.x)} x ${chalk.magenta(grid.y)} grid.`);

  // Initialize a progress bar.
  const progress = new ProgressBar.SingleBar({}, ProgressBar.Presets.shades_classic);

  // Start the progress bar.
  progress.start(program.tile ? 1 : grid.n);

  // Ensure the images folder is in place.
  fs.ensureDirSync('images/');

  // Build an array of request data.
  const requests = [];

  // Loop through the range of coordinates and grab screenshots.
  matrix.forEach((row, x) => {

    // Capture each column within the row.
    row.forEach((col, y) => {

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
            path: `images/${filename}.png`,
            coords: col
          });

        }

      }

      // Otherwise, add all tiles to the queue.
      else {

        // Add screen grabs to the queue.
        queue.push({
          url,
          path: `images/${filename}.png`,
          coords: col
        });

      }

    });

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
