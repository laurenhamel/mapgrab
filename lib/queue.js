// Load dependencies.
const _ = require('lodash');
const deferred = require('deferred');

// Export queue utility.
module.exports = {

  // Set limit on number of items that can be processed at once.
  limit: 2,

  // Set delay (in seconds) between batches.
  delay: 1,

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

    // Process the queue one chunck at a time.
    queue.forEach((requests, i) => {

      // Wait for the previous chunk to complete if processing started.
      if(chunks.length > 0) {

        // Initialize deferred promises for chunking.
        const chunking = deferred();

        // Save the deferred promise.
        chunks.push(chunking.promise);

        // Wait for the previous chunk to finish, then process the next chunk.
        chunks[i - 1]
          .then(() => {})
          .catch(() => {})
          .finally(() => {

            // Implement a delay between chunks.
            setTimeout(() => {

              // Process the next chunk.
              Promise.all(requests.map((request) => callback(request)))
                .then(() => {})
                .catch(() => {})
                .finally(() => chunking.resolve());

            }, this.delay * 1000);

          });

      }

      // Otherwise, immediately start processing.
      else {

        // Initialize deferred promises for chunking.
        const chunking = deferred();

        // Save the deferred promise.
        chunks.push(chunking.promise);

        // Execute the chunk.
        Promise.all(requests.map((request) => callback(request)))
          .then(() => {})
          .catch(() => {})
          .finally(() => chunking.resolve());

      }

    });

    // Return a promise.
    return Promise.all(chunks);

  }

};
