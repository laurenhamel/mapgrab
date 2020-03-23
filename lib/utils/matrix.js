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

  // Make an fill a matrix in one fell swoop.
  new(rows, cols, callback) {

    // Create an empty matrix, then fill it.
    return this.fill(this.make(rows, cols), callback);

  }

};
