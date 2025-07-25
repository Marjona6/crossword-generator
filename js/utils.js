/**
 * Utility functions for the crossword puzzle generator
 */

class Utils {
  /**
   * Parse and clean words from input text
   * @param {string} input - Raw input text
   * @returns {string[]} Array of cleaned words
   */
  static parseWords(input) {
    if (!input || typeof input !== "string") {
      return [];
    }

    // Split by newlines and commas, then clean each word
    const words = input
      .split(/[\n,]+/)
      .map((word) => word.trim().toLowerCase())
      .filter((word) => word.length > 0)
      .filter((word) => /^[a-z]+$/.test(word)); // Only letters

    // Remove duplicates while preserving order
    return [...new Set(words)];
  }

  /**
   * Validate if a word can be placed on the grid
   * @param {string} word - Word to validate
   * @param {number} row - Starting row position
   * @param {number} col - Starting column position
   * @param {boolean} isHorizontal - Whether the word is horizontal
   * @param {Array} grid - Current grid state
   * @returns {boolean} True if word can be placed
   */
  static canPlaceWord(word, row, col, isHorizontal, grid) {
    const wordLength = word.length;
    const gridRows = grid.length;
    const gridCols = grid[0].length;

    // Check if word fits within grid bounds
    if (isHorizontal) {
      if (col + wordLength > gridCols) return false;
    } else {
      if (row + wordLength > gridRows) return false;
    }

    // Check each position where the word would be placed
    for (let i = 0; i < wordLength; i++) {
      const currentRow = isHorizontal ? row : row + i;
      const currentCol = isHorizontal ? col + i : col;
      const currentCell = grid[currentRow][currentCol];
      const currentChar = word[i];

      // If cell is empty, we can place the word
      if (currentCell === null) continue;

      // If cell already has the same character, it's a valid intersection
      if (currentCell === currentChar) continue;

      // If cell has a different character, we can't place the word
      return false;
    }

    return true;
  }

  /**
   * Check if placing a word creates valid intersections
   * @param {string} word - Word to check
   * @param {number} row - Starting row position
   * @param {number} col - Starting column position
   * @param {boolean} isHorizontal - Whether the word is horizontal
   * @param {Array} grid - Current grid state
   * @returns {boolean} True if word creates valid intersections
   */
  static hasValidIntersections(word, row, col, isHorizontal, grid) {
    const wordLength = word.length;
    let hasIntersection = false;

    for (let i = 0; i < wordLength; i++) {
      const currentRow = isHorizontal ? row : row + i;
      const currentCol = isHorizontal ? col + i : col;

      // Check if this position already has a letter (intersection)
      if (grid[currentRow][currentCol] !== null) {
        hasIntersection = true;
        continue;
      }

      // Check adjacent cells for potential conflicts
      const adjacentPositions = this.getAdjacentPositions(currentRow, currentCol, isHorizontal);

      for (const [adjRow, adjCol] of adjacentPositions) {
        if (this.isValidPosition(adjRow, adjCol, grid) && grid[adjRow][adjCol] !== null) {
          hasIntersection = true;
          break;
        }
      }
    }

    return hasIntersection;
  }

  /**
   * Get adjacent positions to a cell (excluding the word direction)
   * @param {number} row - Row position
   * @param {number} col - Column position
   * @param {boolean} isHorizontal - Whether the word is horizontal
   * @returns {Array} Array of [row, col] positions
   */
  static getAdjacentPositions(row, col, isHorizontal) {
    const positions = [];

    if (isHorizontal) {
      // For horizontal words, check above and below
      positions.push([row - 1, col], [row + 1, col]);
    } else {
      // For vertical words, check left and right
      positions.push([row, col - 1], [row, col + 1]);
    }

    return positions;
  }

  /**
   * Check if a position is within grid bounds
   * @param {number} row - Row position
   * @param {number} col - Column position
   * @param {Array} grid - Grid to check against
   * @returns {boolean} True if position is valid
   */
  static isValidPosition(row, col, grid) {
    return row >= 0 && row < grid.length && col >= 0 && col < grid[0].length;
  }

  /**
   * Calculate grid dimensions based on words
   * @param {string[]} words - Array of words
   * @returns {Object} Object with rows and cols properties
   */
  static calculateGridSize(words) {
    if (!words || words.length === 0) {
      return { rows: 10, cols: 10 };
    }

    const maxWordLength = Math.max(...words.map((word) => word.length));
    const totalWords = words.length;

    // Estimate grid size based on word count and length
    const estimatedSize = Math.max(maxWordLength + 2, Math.ceil(Math.sqrt(totalWords * maxWordLength * 2)));

    return {
      rows: Math.min(estimatedSize, 30), // Cap at reasonable size
      cols: Math.min(estimatedSize, 30),
    };
  }

  /**
   * Generate a simple clue for a word
   * @param {string} word - Word to generate clue for
   * @returns {string} Generated clue
   */
  static generateClue(word) {
    // Simple clue generation - can be enhanced later
    return `A ${word.length}-letter word`;
  }

  /**
   * Deep clone an object or array
   * @param {*} obj - Object to clone
   * @returns {*} Cloned object
   */
  static deepClone(obj) {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepClone(item));
    }

    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = this.deepClone(obj[key]);
      }
    }

    return cloned;
  }
}
