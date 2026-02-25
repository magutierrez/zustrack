# zustrack - Pro Outdoor Route Forecast

**zustrack** is a high-performance web application designed for cyclists and hikers who need more than a generic weather forecast. By analyzing GPX tracks or Strava activities, the app provides a point-by-point meteorological and physical analysis, allowing for safer and more prepared outdoor sessions.

## 🚀 Core Features

### 1. Smart Meteorological Analysis

- **Point-by-Point Forecast**: Get temperature, wind speed, and precipitation probability for specific coordinates at the exact time you'll be passing through them.
- **Wind Effect Logic**: Calculates if the wind will be a tailwind, headwind, or crosswind based on your travel bearing at every segment.
- **Solar Exposure & Hillshading**: Using DEM (Digital Elevation Model) and astronomical algorithms, the app detects if you'll be in direct sun or in the shadow of a mountain.
- **Solar Intensity Scale**: A "Solar Sensation" scale ranging from "Cool/Shade" to "Scorching Sun" based on real-time solar radiation ($W/m^2$).

### 2. Safety & Evacuation (Hiking Mode)

- **Automatic Escape Points**: Identifies the nearest villages and main roads within a 2.5km radius using OpenStreetMap (OSM).
- **Daylight Countdown**: Real-time calculation of remaining light based on your pace. Warning alerts if you are expected to arrive after sunset.
- **Mobile Coverage Heuristics**: Estimates 4G/5G coverage availability based on proximity to infrastructure.

### 3. Physiology & Effort

- **IBP Index**: Integration of the IBP index to provide an objective difficulty score for every route.
- **Naismith’s Rule Time Estimation**: Calculates realistic arrival times by adding penalties for every 100m of vertical gain.
- **Hydration & Calorie Calculator**: Estimates water (L) and energy (kcal) needs based on temperature, duration, and elevation profile.

### 4. Advanced Mapping

- **Interactive Layers**: Choose between Standard, Satellite, Hybrid, or a specialized **Topographic** layer (OpenTopoMap).
- **Elevation Profile**: A high-resolution chart with linear interpolation for realistic terrain visualization.

## 🛠 Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Auth**: [Auth.js (NextAuth)](https://authjs.dev/) with Strava, Google, Facebook, and X providers.
- **Maps**: [MapLibre GL](https://maplibre.org/) / [react-map-gl](https://visgl.github.io/react-map-gl/)
- **Styling**: Tailwind CSS & [shadcn/ui](https://ui.shadcn.com/)
- **I18n**: [next-intl](https://next-intl-docs.vercel.app/) (Full English and Spanish support)
- **APIs Used**:
  - [Open-Meteo](https://open-meteo.com/): Weather, Radiation, and Elevation data.
  - [Overpass API (OSM)](https://overpass-turbo.eu/): Infrastructure and terrain features.
  - [Strava API](https://developers.strava.com/): Activity and route synchronization.

## 📡 External Services & Reliability

To provide professional-grade analysis, **zustrack** aggregates data from world-class specialized providers.

### 🌤 Meteorological Data (Open-Meteo)

- **Reliability**: High. Uses high-resolution non-hydrostatic models (DWD, NOAA, ECMWF).
- **Precision**: Forecasts are updated hourly with a resolution of up to 2km in certain regions.
- **Solar Radiation**: Provides both direct and diffuse radiation, critical for our solar exposure algorithms.

### 🏔 Terrain & Infrastructure (OpenStreetMap / Overpass)

- **Reliability**: Community-driven, highly accurate for mountain paths and rural infrastructure.
- **Escape Points**: Our evacuation logic depends on the tagging accuracy of the OSM community for villages and secondary roads.

### 🛰 Elevation (Digital Elevation Models)

- **Data Source**: SRTM, ASTER, and ArcticDEM.
- **Accuracy**: Vertical accuracy is generally within 5-10 meters, which is the industry standard for consumer-grade GPS analysis.

### 🚴‍♂️ Routing & Effort (OSRM / Naismith)

- **Logic**: While OSRM provides the geometric track, the **Naismith Rule** and physiological estimates are algorithmic models meant for guidance. Actual effort may vary based on weather conditions, surface type, and personal fitness.

## 🔒 Privacy & Data Security

**zustrack is built with a "Privacy First" philosophy:**

- **No Persistent Route Storage**: Your uploaded GPX files and Strava tracks are processed in real-time. We **do not store** your geographic tracks in any permanent database.
- **Local Processing**: Analysis is performed on-the-fly. Once you clear the route or close the session, the track data is cleared from the application state.
- **Minimal Data Collection**: We only use authentication to provide a personalized experience and to fetch your own data from Strava with your explicit permission.

## 📖 Pages

1.  **`/login`**: Secure entry point with multiple social providers.
2.  **`/` (Dashboard)**: The main analysis engine.
    - **Sidebar**: Configuration (date, speed, activity), GPX upload, and Strava/Saved routes list.
    - **Main Area**: Tabs for Weather Analysis, Safety Advice, and Effort/Hazards.
    - **Map View**: Sticky interactive map with track visualization and data popups.

---

Built for those who reach the peaks. 🏔️
