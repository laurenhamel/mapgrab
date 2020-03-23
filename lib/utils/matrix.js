// Export matrix utility.
module.exports = {

  // Create an empty matrix with the given dimensions.
  make(rows, cols)  {

    // Create an empty matrix.
    return new Array(rows).fill(null).map(() => ([
      ...new Array(cols).fill(null)
    ]));

  },

  // Fill each empty cell within a matrix using a callback.
  fill(matrix, callback) {

    // Fill each row within the matrix.
    return matrix.map((row, r) => {

      // Fill each column within the matrix.
      return row.map((col, c) => {

        // Use the callback to fill the cell.
        return callback(row, col, r, c);

      });

    });

  },

  // Loop through each cell within a matrix.
  each(matrix, callback) {

    // Loop through each row.
    matrix.forEach((row, r) => {

      // Loop through each column.
      row.forEach((col, c) => {

        // Execute the callback.
        callback(row, col, r, c);

      });

    });

  },

  // Make and fill a matrix in one fell swoop.
  new(rows, cols, callback) {

    // Create an empty matrix, then fill it.
    const matrix = this.fill(this.make(rows, cols), callback);

    // Add prototype methods to the matrix.
    matrix.each = (callback) => this.each(matrix, callback);
    matrix.fill = (callback) => this.fill(matrix, callback);

    // Return the matrix.
    return matrix;

  }

};
