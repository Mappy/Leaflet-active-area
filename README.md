# Leaflet-active-area

This [Leaflet](https://leafletjs.com) plugin allows you to use a `<div>` as an active area.
All positioning methods (`setView`, `fitBounds`, `flyTo`, `setZoomAround`) are applied relative to this active area instead of the whole map container.
A typical use case is having a map as background (like in the [example](examples/index.html)) and centering it on a specific portion of the screen (e.g. top banner, sidebar offset).
Defining CSS media queries on that `<div>` makes it easy to adapt the active area according to client resolution.

> **Note on Leaflet versions:**
> - This version targets **Leaflet 2 (in beta, `2.0.0-beta.5`)**.
> - If you are using **Leaflet 1.x**, please use version **`1.4.0`** of `leaflet-active-area`.

## Usage

### With modern bundlers (ESM)

Install Leaflet (v2 beta) and this package:

```bash
npm install leaflet@2.0.0-beta.5 leaflet-active-area
```

Import Leaflet and the plugin:

```javascript
import { LeafletMap } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-active-area';

const map = new LeafletMap(document.getElementById('map')).setActiveArea('activeArea');
```

### Static HTML with ES Modules & import maps

```html
<link rel="stylesheet" href="node_modules/leaflet/dist/leaflet.css" />

<script type="importmap">
{
  "imports": {
    "leaflet": "./node_modules/leaflet/dist/leaflet.js"
  }
}
</script>

<script type="module">
  import { LeafletMap } from 'leaflet';
  import './node_modules/leaflet-active-area/src/leaflet.activearea.js';

  const map = new LeafletMap('map').setActiveArea('activeArea');
</script>
```

Add CSS for `.activeArea` with absolute positioning:

```css
.activeArea {
  position: absolute;
  top: 50px;
  left: 50px;
  right: 50px;
  height: 200px;
}
```

You can also pass an object with style properties directly:

```javascript
const map = new LeafletMap('map').setActiveArea({
  position: 'absolute',
  top: '50px',
  left: '50px',
  right: '50px',
  height: '200px'
});
```

Then, the map will center itself in the center of that `<div>` when calling `setView`, `setZoom`, `fitBounds`, etc.

If you need to re-center the map automatically upon setting the active area, pass `true` as the second argument:

```javascript
map.setActiveArea('activeArea', true, true);
```

Pass `true` as the 3rd argument to animate the pan (default = `false`).

### Bounds

- `map.getBounds()` returns the geographic bounds of the **active area**.
- `map.getMapBounds()` returns the geographic bounds of the **entire map container**, regardless of the active area (useful e.g. for filtering markers or objects on the entire visible map).

## React Leaflet integration

If you use [React Leaflet](https://react-leaflet.js.org/) (for Leaflet 1.x with `leaflet-active-area@1.4.0`):

```jsx
import React, { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-active-area";

function ActiveAreaSetup() {
  const map = useMap();

  useEffect(() => {
    map.setActiveArea("activeArea", true, true);
  }, [map]);

  return null;
}

export default function MyMap() {
  return (
    <MapContainer
      center={[48.853, 2.349]}
      zoom={13}
      style={{ height: "100vh", width: "100vw" }}
    >
      <ActiveAreaSetup />
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    </MapContainer>
  );
}
```

## Pre-commit hook

To install the pre-commit hook (which launches tests): `ln -s ../../pre-commit.sh .git/hooks/pre-commit`

## Contributors

Thanks to all contributors: https://github.com/Mappy/Leaflet-active-area/graphs/contributors

## License

This code is provided under the Apache 2.0 license.
