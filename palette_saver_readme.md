# Palette Saver

Palette Saver is a feature-rich, modern Chrome extension designed for developers, designers, and creators who need a fast, persistent way to collect, organize, and export color palettes right from their browser's side panel.

## Key Features

* **Chrome Side Panel Integration:** Stays persistently open alongside your browser tabs as you browse and design.
* **Screen Color Picker:** Uses the native Eyedropper API to instantly sample any color from your screen.
* **Image Color Extraction:** Simply drop any image into the panel to automatically extract its dominant color palette.
* **Multiple Palettes & Management:** Create, rename, delete, and switch between multiple custom color palettes.
* **Smart Color Cards:**
  * Custom naming and official color name matching.
  * Interactive color harmonies (Complementary, Analogous, Triad, etc.).
  * WCAG contrast ratio badges (Pass/Fail indicators).
  * Drag-and-drop color reordering.
* **Instant Exports:** Copy selected colors with a single click to:
  * **CSS** (`:root` custom properties)
  * **Tailwind** (JSON config structure)
  * **SCSS** (Sass variables)
  * **JSON** (Complete structured backup data)
* **Recent History:** Automatically tracks your last 20 picked colors.
* **Custom Themes:** Personalize the look and feel of the side panel interface.

## Installation & Local Development

To run or test Palette Saver locally in Google Chrome:

1. **Clone or Download** this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. In the top-right corner, toggle **Developer mode** to **On**.
4. Click the **Load unpacked** button in the top-left corner.
5. Select the folder containing your extension files.
6. Pin Palette Saver to your Chrome toolbar and click to open the side panel!

## Project Structure

```
├── manifest.json       # Extension manifest (v3)
├── sidepanel.html      # Side panel layout markup
├── style.css           # Modern dark-themed styling & layout
├── sidepanel.js        # Core logic, state management, and UI interactions
├── util.js             # Color conversion, harmonies, and naming utilities
└── icons/              # Extension icons
```

## License

This project is open-source and available under the [MIT License](LICENSE).