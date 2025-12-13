# Satellite Latency Map - 3D Globe

## Short Description

A real-time 3D visualization application that displays active satellites and ground stations on an interactive globe. Built with Three.js, this web application fetches live satellite data from CelesTrak, renders orbital paths, and provides an intuitive interface for exploring space infrastructure. The application features a space-themed UI with customizable settings, search functionality, and interactive controls for both satellites and ground stations.

## Installation Instructions

### Prerequisites

- **Node.js** (v14 or higher recommended)
- **npm** (comes with Node.js)
- A modern web browser with WebGL support (Chrome, Firefox, Edge, Safari)

### Step-by-Step Installation

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd latencymapper.space
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   
   This will install:
   - `three` (^0.182.0) - 3D graphics library
   - `satellite.js` (^6.0.1) - Satellite position calculations

3. **Start the development server**
   ```bash
   npm start
   ```
   
   Or for automatic browser opening:
   ```bash
   npm run dev
   ```

4. **Access the application**
   - The application will be available at `http://localhost:1234`
   - Open your browser and navigate to the URL

### Alternative: Static File Server

If you prefer not to use npm, you can use any static file server:

```bash
# Using Python 3
python -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using PHP
php -S localhost:8000
```

Then access the application at `http://localhost:8000`

## Usage

### Basic Navigation

- **Rotate the globe**: Click and drag with your mouse
- **Zoom**: Use the mouse wheel or pinch gesture on touch devices
- **Select objects**: Click on satellites or ground stations to view details
- **Search**: Use the Search button in the control panel to find specific satellites or stations

### Control Panel

The bottom control panel provides access to all features:

- **Add Station**: Create custom virtual ground stations
- **Add Satellite**: Add custom satellites to the visualization
- **Stations**: View and manage all ground stations
- **Search**: Find satellites and ground stations by name
- **Settings**: Configure satellite size, colors, and camera modes
- **Chaos Mode**: Activate a fun experimental mode with special effects

### Settings Panel

Access the Settings panel to customize:

- **Satellite Size**: Adjust the size of all satellites (50% - 300%)
- **Colors**: Change the colors of ground stations and satellites
- **Auto-Pan Mode**: Enable automatic camera rotation around the globe

### Keyboard Shortcuts

- **ESC**: Close any open panels or modals
- **Mouse Drag**: Rotate the camera around the globe
- **Mouse Wheel**: Zoom in/out

## Features

### Core Features

- **Real-Time Satellite Tracking**: Fetches and displays active satellites from CelesTrak
- **3D Globe Visualization**: Interactive Earth model with NASA Blue Marble texture
- **Orbital Path Visualization**: View satellite orbits with color-coded paths (LEO, MEO, GEO)
- **Ground Station Management**: Add, view, and manage ground stations
- **Search Functionality**: Quickly find satellites and stations by name or ID
- **Interactive Selection**: Click on objects to view detailed information
- **Custom Satellites**: Add your own satellites with custom orbits
- **Custom Ground Stations**: Create virtual ground stations anywhere on Earth

### Advanced Features

- **Color Customization**: Adjust colors for satellites and ground stations
- **Size Adjustment**: Scale satellite markers for better visibility
- **Auto-Pan Camera**: Automatic smooth camera rotation
- **Orbit Classification**: Automatic classification into LEO, MEO, and GEO orbits
- **TLE Data Caching**: Efficient caching of satellite data for faster loading
- **Responsive Design**: Works on desktop and tablet devices
- **Space-Themed UI**: Modern, dark theme with space operations aesthetics

### Special Features

- **Chaos Mode**: Experimental mode with special visual effects and animations
- **Export Functionality**: Export station lists as JSON
- **Info Panels**: Detailed information display for selected objects
- **Smooth Animations**: Damped camera controls for fluid interaction

## Technologies

### Core Technologies

- **Three.js** (v0.182.0) - 3D graphics rendering and WebGL
- **satellite.js** (v6.0.1) - Satellite position calculations from TLE data
- **JavaScript (ES6+)** - Modern JavaScript with modules
- **HTML5/CSS3** - Structure and styling

### Libraries & Tools

- **OrbitControls** - Camera control for Three.js
- **Google Fonts** - Typography (Oxanium, Inter)
- **ESLint** - Code linting
- **Prettier** - Code formatting

### Data Sources

- **CelesTrak** - Two-Line Element (TLE) satellite data
- **NASA Blue Marble** - Earth texture imagery

### Browser APIs

- **WebGL** - 3D rendering
- **Fetch API** - Data retrieval
- **LocalStorage** - Data caching
- **RequestAnimationFrame** - Smooth animations

## Contributing Guidelines

We welcome contributions to improve the Satellite Latency Map project! Here's how you can help:

### Reporting Issues

1. Check if the issue already exists in the issue tracker
2. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs. actual behavior
   - Browser and OS information
   - Screenshots if applicable

### Submitting Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Test your changes thoroughly
4. **Run linting**
   ```bash
   npm run lint
   npm run lint:fix  # Auto-fix issues
   ```
5. **Commit your changes**
   ```bash
   git commit -m "Description of your changes"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request** with a clear description of changes

### Code Style

- Use ES6+ features (modules, arrow functions, etc.)
- Follow existing naming conventions
- Add JSDoc comments for functions
- Keep functions focused and modular
- Use meaningful variable names

### Areas for Contribution

- Performance optimizations
- Additional visualization features
- UI/UX improvements
- Documentation enhancements
- Bug fixes
- Test coverage

## License Information

The license for this project is currently **to be determined**. Please check with the project maintainers for licensing details before using this code in your projects.

## Additional Sections

### API Documentation

#### Satellite Data API

The application uses CelesTrak's public API for satellite data:

- **Endpoint**: `https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle`
- **Format**: Two-Line Element (TLE) format
- **Caching**: Data is cached in localStorage for 1 hour
- **Update Frequency**: Can be configured in `js/modules/constants.js`

#### Internal APIs

**Satellite Management**
- `loadSatelliteData()` - Fetches and parses TLE data
- `getSatelliteRecords()` - Returns all satellite records
- `propagateSatellitePosition()` - Calculates satellite position at a given time

**Ground Station Management**
- `loadGroundStations()` - Loads ground station data
- `addGroundStation()` - Adds a new ground station
- `getGroundStations()` - Returns all ground stations

**Rendering**
- `renderSatellites()` - Renders satellite meshes on the globe
- `renderGroundStations()` - Renders ground station markers
- `createEarth()` - Creates the Earth globe mesh

### Testing

Currently, the project does not include automated tests. Manual testing is performed for:

- Satellite data loading and rendering
- Ground station management
- User interface interactions
- Camera controls and navigation
- Search functionality



### Known Issues / To-Do

#### Known Issues

- Large numbers of satellites may impact performance
- Some browsers may have WebGL compatibility issues
- TLE data updates require manual refresh (no auto-update)


### Project Structure

```
latencymapper.space/
├── assets/              # Images, icons, videos
├── auth-system/         # Authentication components
├── css/                 # Stylesheets
│   ├── theme.css       # Theme variables
│   ├── controlPanel.css
│   ├── modals.css
│   └── panels.css
├── data/                # JSON data files
│   └── ground-stations.json
├── heatmapReciever/     # Python client for heatmap data
├── js/                  # JavaScript source code
│   ├── main.js         # Application entry point
│   └── modules/        # Feature modules
│       ├── earth.js    # Earth rendering
│       ├── satelliteData.js
│       ├── satelliteRenderer.js
│       ├── controls.js
│       └── ui/         # UI components
├── texture/             # 3D textures
│   └── nasa-blue-marble-1.png
├── index.html          # Main HTML file
└── package.json        # Dependencies and scripts
```

### Configuration

Key configuration options can be found in `js/modules/constants.js`:

- `EARTH_RADIUS`: Globe size (default: 1.5)
- `SATELLITE_UPDATE_INTERVAL`: Position update frequency (default: 2000ms)
- `MAX_SATELLITES`: Maximum satellites to render (default: 50)
- `TLE_CACHE_DURATION`: Cache duration (default: 1 hour)

### Performance Tips

- Reduce `MAX_SATELLITES` for better performance on slower devices
- Increase `SATELLITE_UPDATE_INTERVAL` to reduce CPU usage
- Use browser DevTools to monitor WebGL performance
- Disable unnecessary features if experiencing lag

### Troubleshooting

**Satellites not loading:**
- Check browser console for errors
- Verify internet connection (needs CelesTrak API access)
- Clear browser cache and localStorage

**Globe not rendering:**
- Ensure WebGL is enabled in your browser
- Check browser compatibility
- Try a different browser

**Controls not working:**
- Ensure OrbitControls library is loaded
- Check browser console for errors
- Try refreshing the page

## Acknowledgments

This project uses satellite data provided by **CelesTrak** (https://celestrak.org/). CelesTrak is a free service that provides current and historical satellite orbital data, including Two-Line Element (TLE) sets for active satellites. We are grateful for their valuable contribution to the space community.

**CelesTrak** provides:
- Real-time satellite orbital data
- TLE format data for active satellites
- Public API access for educational and research purposes

For more information about CelesTrak, visit: https://celestrak.org/

---

**Note**: This project is for educational and visualization purposes. Satellite data is provided by third-party services and should be verified for critical applications.

