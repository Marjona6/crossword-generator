# Crossword Puzzle Generator

A clean, well-organized crossword puzzle generator built with HTML, CSS, and JavaScript. This application takes a list of words and automatically generates a crossword puzzle with an approximately equal number of horizontal and vertical words.

## Features

- **Automatic Puzzle Generation**: Creates crossword puzzles from any list of words
- **Balanced Layout**: Strives for equal numbers of horizontal and vertical words
- **Interactive Interface**: Click on grid cells or clues to highlight corresponding words
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Clean Architecture**: Modular JavaScript code for easy extension
- **Real-time Statistics**: Shows puzzle statistics including word count and grid fill percentage

## How to Use

1. **Open the Application**: Simply open `index.html` in any modern web browser
2. **Enter Words**: Type or paste your words into the text area (one per line or separated by commas)
3. **Generate Puzzle**: Click "Generate Crossword" or press Ctrl+Enter
4. **Interact**: Click on grid cells or clues to highlight corresponding words
5. **Clear**: Use the "Clear" button to start over

## File Structure

```
crossword-generator/
├── index.html              # Main HTML file
├── styles.css              # CSS styling and responsive design
├── js/
│   ├── utils.js            # Utility functions for parsing and validation
│   ├── crossword-generator.js  # Core puzzle generation algorithm
│   ├── ui-controller.js    # User interface management
│   └── app.js              # Main application entry point
└── README.md               # This file
```

## Technical Details

### Algorithm Overview

The crossword generator uses a greedy algorithm that:

1. **Sorts words by length** (longest first) for better placement
2. **Places the first word** in the center of the grid
3. **Finds valid positions** for remaining words by checking intersections
4. **Prioritizes positions** with more intersections for better puzzle density
5. **Trims the grid** to remove empty rows and columns

### Key Classes

- **`Utils`**: Static utility functions for word parsing, validation, and grid operations
- **`CrosswordGenerator`**: Core algorithm for generating crossword puzzles
- **`UIController`**: Manages all user interface interactions and display updates

### Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Future Enhancements

The modular architecture makes it easy to add new features:

- **Custom Clues**: Allow users to provide their own clues for words
- **Difficulty Levels**: Adjust algorithm parameters for different puzzle complexities
- **Export Options**: Save puzzles as images or printable PDFs
- **Theme Support**: Generate puzzles around specific topics or themes
- **Advanced Algorithms**: Implement more sophisticated placement strategies
- **Undo/Redo**: Add ability to undo and redo puzzle generation steps

## Contributing

The code is organized with clear separation of concerns:

- **HTML**: Structure and semantic markup
- **CSS**: Styling and responsive design
- **JavaScript**: Modular classes for different responsibilities

To add new features:

1. Add new utility functions to `utils.js`
2. Extend the generator algorithm in `crossword-generator.js`
3. Add UI components in `ui-controller.js`
4. Update the main app initialization in `app.js`

## License

This project is open source and available under the MIT License.
