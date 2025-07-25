/**
 * Core crossword puzzle generator
 */

class CrosswordGenerator {
  constructor() {
    this.grid = [];
    this.placedWords = [];
    this.clueNumber = 1;
  }

  /**
   * Generate a crossword puzzle from a list of words
   * @param {string[]} words - Array of words to use
   * @returns {Object} Generated puzzle data
   */
  generate(words) {
    if (!words || words.length === 0) {
      throw new Error("No words provided");
    }

    // Sort words by intersection potential (words with more common letters first)
    const sortedWords = this.sortWordsByIntersectionPotential(words);

    // Calculate grid size
    const gridSize = Utils.calculateGridSize(sortedWords);

    // Initialize empty grid
    this.initializeGrid(gridSize.rows, gridSize.cols);

    // Reset state
    this.placedWords = [];
    this.clueNumber = 1;

    // Place words on the grid
    this.placeWords(sortedWords);

    // Trim grid to remove empty rows and columns
    this.trimGrid();

    // Generate clues and statistics
    const puzzle = this.createPuzzleData();

    return puzzle;
  }

  /**
   * Initialize an empty grid
   * @param {number} rows - Number of rows
   * @param {number} cols - Number of columns
   */
  initializeGrid(rows, cols) {
    this.grid = [];
    for (let i = 0; i < rows; i++) {
      this.grid[i] = [];
      for (let j = 0; j < cols; j++) {
        this.grid[i][j] = null;
      }
    }
  }

  /**
   * Sort words by their potential for creating good intersections
   * @param {string[]} words - Words to sort
   * @returns {string[]} Sorted words
   */
  sortWordsByIntersectionPotential(words) {
    // Letter frequency in English (approximate)
    const letterFrequency = {
      E: 12.02,
      T: 9.1,
      A: 8.12,
      O: 7.68,
      I: 7.31,
      N: 6.95,
      S: 6.28,
      R: 6.02,
      H: 5.92,
      D: 4.32,
      L: 3.98,
      U: 2.88,
      C: 2.71,
      M: 2.61,
      W: 2.3,
      F: 2.11,
      G: 2.09,
      Y: 2.11,
      P: 1.82,
      B: 1.49,
      V: 1.11,
      K: 0.69,
      J: 0.1,
      X: 0.1,
      Q: 0.1,
      Z: 0.07,
    };

    return [...words].sort((a, b) => {
      const aScore = this.calculateWordIntersectionScore(a, letterFrequency);
      const bScore = this.calculateWordIntersectionScore(b, letterFrequency);

      // Sort by intersection potential first, then by length
      if (Math.abs(aScore - bScore) > 0.1) {
        return bScore - aScore;
      }
      return b.length - a.length;
    });
  }

  /**
   * Calculate intersection potential score for a word
   * @param {string} word - Word to score
   * @param {Object} letterFrequency - Letter frequency data
   * @returns {number} Intersection potential score
   */
  calculateWordIntersectionScore(word, letterFrequency) {
    let score = 0;
    const wordLength = word.length;

    for (let i = 0; i < wordLength; i++) {
      const letter = word[i].toUpperCase();
      const frequency = letterFrequency[letter] || 0;

      // Prefer middle positions for common letters
      const positionInWord = i / (wordLength - 1);
      const middlePreference = 1 - Math.abs(positionInWord - 0.5) * 2;

      score += frequency * middlePreference;
    }

    return score;
  }

  /**
   * Place words on the grid
   * @param {string[]} words - Words to place
   */
  placeWords(words) {
    // Place the first word in the center
    if (words.length > 0) {
      const firstWord = words[0];
      const centerRow = Math.floor(this.grid.length / 2);
      const centerCol = Math.floor((this.grid[0].length - firstWord.length) / 2);

      this.placeWord(firstWord, centerRow, centerCol, true);
      words.shift();
    }

    // Try to place remaining words
    let attempts = 0;
    const maxAttempts = words.length * 100; // Prevent infinite loops

    while (words.length > 0 && attempts < maxAttempts) {
      const word = words[0];
      const placed = this.tryPlaceWord(word);

      if (placed) {
        words.shift();
      } else {
        // Move word to end of list and try others
        words.push(words.shift());
      }

      attempts++;
    }
  }

  /**
   * Try to place a word on the grid
   * @param {string} word - Word to place
   * @returns {boolean} True if word was placed successfully
   */
  tryPlaceWord(word) {
    const positions = this.findValidPositions(word);

    if (positions.length === 0) {
      return false;
    }

    // Sort positions by quality (prefer middle intersections)
    positions.sort((a, b) => {
      const aScore = this.calculatePositionScore(word, a.row, a.col, a.isHorizontal);
      const bScore = this.calculatePositionScore(word, b.row, b.col, b.isHorizontal);
      return bScore - aScore;
    });

    // Try the best positions first
    for (const position of positions) {
      if (this.placeWord(word, position.row, position.col, position.isHorizontal)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find all valid positions for a word
   * @param {string} word - Word to find positions for
   * @returns {Array} Array of valid positions
   */
  findValidPositions(word) {
    const positions = [];
    const wordLength = word.length;

    // Try horizontal placement
    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col <= this.grid[0].length - wordLength; col++) {
        if (Utils.canPlaceWord(word, row, col, true, this.grid)) {
          positions.push({ row, col, isHorizontal: true });
        }
      }
    }

    // Try vertical placement
    for (let row = 0; row <= this.grid.length - wordLength; row++) {
      for (let col = 0; col < this.grid[0].length; col++) {
        if (Utils.canPlaceWord(word, row, col, false, this.grid)) {
          positions.push({ row, col, isHorizontal: false });
        }
      }
    }

    return positions;
  }

  /**
   * Count intersections for a word at a position
   * @param {string} word - Word to check
   * @param {number} row - Starting row
   * @param {number} col - Starting column
   * @param {boolean} isHorizontal - Whether word is horizontal
   * @returns {number} Number of intersections
   */
  countIntersections(word, row, col, isHorizontal) {
    let intersections = 0;

    for (let i = 0; i < word.length; i++) {
      const currentRow = isHorizontal ? row : row + i;
      const currentCol = isHorizontal ? col + i : col;

      if (this.grid[currentRow][currentCol] !== null) {
        intersections++;
      }
    }

    return intersections;
  }

  /**
   * Calculate a score for a word position that prefers middle intersections
   * @param {string} word - Word to check
   * @param {number} row - Starting row
   * @param {number} col - Starting column
   * @param {boolean} isHorizontal - Whether word is horizontal
   * @returns {number} Position score (higher is better)
   */
  calculatePositionScore(word, row, col, isHorizontal) {
    const wordLength = word.length;
    let totalScore = 0;
    let intersectionCount = 0;

    for (let i = 0; i < wordLength; i++) {
      const currentRow = isHorizontal ? row : row + i;
      const currentCol = isHorizontal ? col + i : col;

      if (this.grid[currentRow][currentCol] !== null) {
        intersectionCount++;

        // Calculate position within word (0 to 1, where 0.5 is the middle)
        const positionInWord = i / (wordLength - 1);

        // Prefer middle positions - create a bell curve centered at 0.5
        // This gives higher scores to intersections in the middle of the word
        const middlePreference = 1 - Math.abs(positionInWord - 0.5) * 2;

        // Add bonus for middle intersections
        totalScore += middlePreference;
      }
    }

    // Base score is the number of intersections
    // But we heavily weight the middle preference
    return intersectionCount * 10 + totalScore * 100;
  }

  /**
   * Place a word on the grid
   * @param {string} word - Word to place
   * @param {number} row - Starting row
   * @param {number} col - Starting column
   * @param {boolean} isHorizontal - Whether word is horizontal
   * @returns {boolean} True if word was placed successfully
   */
  placeWord(word, row, col, isHorizontal) {
    // Check if we can place the word
    if (!Utils.canPlaceWord(word, row, col, isHorizontal, this.grid)) {
      return false;
    }

    // Check if word follows proper crossword rules (except for first word)
    if (this.placedWords.length > 0 && !Utils.hasValidWordBoundaries(word, row, col, isHorizontal, this.grid)) {
      return false;
    }

    // Place the word
    for (let i = 0; i < word.length; i++) {
      const currentRow = isHorizontal ? row : row + i;
      const currentCol = isHorizontal ? col + i : col;
      this.grid[currentRow][currentCol] = word[i];
    }

    // Record the placed word
    this.placedWords.push({
      word: word,
      row: row,
      col: col,
      isHorizontal: isHorizontal,
      clueNumber: this.clueNumber,
    });

    this.clueNumber++;
    return true;
  }

  /**
   * Trim the grid to remove empty rows and columns
   */
  trimGrid() {
    // Find bounds of placed words
    let minRow = this.grid.length;
    let maxRow = -1;
    let minCol = this.grid[0].length;
    let maxCol = -1;

    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col < this.grid[0].length; col++) {
        if (this.grid[row][col] !== null) {
          minRow = Math.min(minRow, row);
          maxRow = Math.max(maxRow, row);
          minCol = Math.min(minCol, col);
          maxCol = Math.max(maxCol, col);
        }
      }
    }

    // Create new trimmed grid
    if (minRow <= maxRow && minCol <= maxCol) {
      const newGrid = [];
      for (let row = minRow; row <= maxRow; row++) {
        newGrid[row - minRow] = [];
        for (let col = minCol; col <= maxCol; col++) {
          newGrid[row - minRow][col - minCol] = this.grid[row][col];
        }
      }
      this.grid = newGrid;

      // Update word positions
      for (const placedWord of this.placedWords) {
        placedWord.row -= minRow;
        placedWord.col -= minCol;
      }
    }
  }

  /**
   * Create the final puzzle data structure
   * @returns {Object} Complete puzzle data
   */
  createPuzzleData() {
    const acrossWords = this.placedWords.filter((word) => word.isHorizontal);
    const downWords = this.placedWords.filter((word) => !word.isHorizontal);

    return {
      grid: this.grid,
      words: this.placedWords,
      across: acrossWords.map((word) => ({
        number: word.clueNumber,
        word: word.word,
        clue: Utils.generateClue(word.word),
        row: word.row,
        col: word.col,
      })),
      down: downWords.map((word) => ({
        number: word.clueNumber,
        word: word.word,
        clue: Utils.generateClue(word.word),
        row: word.row,
        col: word.col,
      })),
      statistics: {
        totalWords: this.placedWords.length,
        acrossWords: acrossWords.length,
        downWords: downWords.length,
        gridRows: this.grid.length,
        gridCols: this.grid[0].length,
        totalCells: this.grid.length * this.grid[0].length,
        filledCells: this.countFilledCells(),
      },
    };
  }

  /**
   * Count filled cells in the grid
   * @returns {number} Number of filled cells
   */
  countFilledCells() {
    let count = 0;
    for (let row = 0; row < this.grid.length; row++) {
      for (let col = 0; col < this.grid[0].length; col++) {
        if (this.grid[row][col] !== null) {
          count++;
        }
      }
    }
    return count;
  }
}
