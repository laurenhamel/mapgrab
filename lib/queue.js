// Load dependencies.
const _ = require('lodash');

// Export queue utility.
module.exports = {

  // Set limit on number of items that can be processed at once.
  limit: 2,

  // Store items in the queue.
  _queue: [],

  // Push items to the queue.
  push(request) {

    // Add the request to the queue.
    this._queue.push(request);

  },

  // Process the queue.
  process(callback) {

    // Split the queue into chunks.
    const queue = _.chunk(this._queue, this.limit);

    // Capture the status of the pending chunks.
    const chunks = [];

    // Capture the overall status of each chunk
    let wait = [];

    // Process the queue one chunck at a time.
    queue.forEach((requests, i) => {

      // Wait for the previous chunk to complete if processing started.
      if(chunks.length > 0) {

        // Initialize a new promise
        wait.push(new Promise((resolve) => {

          // Wait for the previous chunk to finish, then process the next chunk.
          Promise.all(chunks[i - 1])
            .then(() => {})
            .catch(() => {})
            .finally(() => {

              // Process the next chunk.
              chunks.push(requests.map((request) => callback(request)));

              // Resolve after the next chunk is finished.
              Promise.all(chunks[i])
                .then(() => {})
                .catch(() => {})
                .finally(() => resolve());

            });

        }));

      }

      // Otherwise, immediately start processing.
      else {

        // Initialize a new promise for the chunk.
        wait.push(new Promise((resolve) => {

          // Save the chunk.
          chunks.push(requests.map((request) => callback(request)));

          // Resolve the promise when the chunk is done.
          Promise.all(chunks[i])
            .then(() => {})
            .catch(() => {})
            .finally(() => resolve());

        }));

      }

    });

    // Return a promise.
    return Promise.all(wait);

  }

};
