import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../../src/leaflet.activearea.js';

describe('LeafletActiveArea', () => {
  let map;
  let mapDiv;

  const Paris = L.latLng(48.85346, 2.34956);
  const London = L.latLng(51.505, -0.09);

  beforeAll(() => {
    mapDiv = document.createElement('div');
    mapDiv.style.position = 'absolute';
    mapDiv.style.top = '0';
    mapDiv.style.bottom = '0';
    mapDiv.style.width = '1000px';
    mapDiv.style.height = '1000px';
    mapDiv.style.backgroundColor = 'red';
    mapDiv.style.zIndex = '1';

    document.body.appendChild(mapDiv);

    map = new L.Map(mapDiv).setActiveArea({
      position: 'absolute',
      top: '50px',
      left: '50px',
      width: '400px',
      height: '200px',
      outline: '2px solid green',
      zIndex: 2
    });
  });

  afterAll(() => {
    if (map) {
      map.remove();
    }
    if (mapDiv && mapDiv.parentNode) {
      mapDiv.parentNode.removeChild(mapDiv);
    }
  });

  describe('#getCenter', () => {
    it('centers the map inside the DIV', () => {
      // When
      map.setView(Paris, 13);

      // Then
      const centerPosition = map.latLngToLayerPoint(map.getCenter());
      expect(centerPosition.x).toBe(250); // 400 / 2 + 50
      expect(centerPosition.y).toBe(150); // 200 / 2 + 50
    });
  });

  describe('#fitBounds', () => {
    it('should set markers inside the DIV', () => {
      // Given
      const markers = L.featureGroup([L.marker(Paris), L.marker(London)]);
      markers.addTo(map);

      // When
      map.fitBounds(markers.getBounds(), { padding: [0, 0] });

      // Then
      const positionLondon = map.latLngToLayerPoint(London);
      expect(positionLondon.x).toBe(195);
      expect(positionLondon.y).toBe(55);

      const positionParis = map.latLngToLayerPoint(Paris);
      expect(positionParis.x).toBe(306);
      expect(positionParis.y).toBe(244);
    });
  });

  describe('#setActiveArea', () => {
    it('should set a new activeArea css', () => {
      const before = map.getViewportBounds();
      expect(before.max.x).toBe(450);
      expect(before.max.y).toBe(250);

      map.setActiveArea({
        top: '50px',
        left: '50px',
        width: null,
        height: null,
        right: '50px',
        bottom: '50px',
        outline: '2px solid yellow',
        zIndex: 2
      });

      const after = map.getViewportBounds();
      expect(after.min.x).toBe(50);
      expect(after.min.y).toBe(50);
      expect(after.max.x).toBe(950);
      expect(after.max.y).toBe(950);
    });
  });

  describe('#getViewportBounds', () => {
    it('should fallback when using a very small container', () => {
      // Set the mapDiv to be a very small size
      mapDiv.style.width = '10px';
      mapDiv.style.height = '10px';

      const bounds = map.getViewportBounds();
      expect(bounds.min.x).toBe(0);
      expect(bounds.min.y).toBe(0);
      expect(bounds.max.x).toBe(10);
      expect(bounds.max.y).toBe(10);
    });
  });

  describe('#getBounds', () => {
    beforeAll(() => {
      mapDiv.style.width = '1000px';
      mapDiv.style.height = '1000px';
      map.setView(Paris, 13);
    });

    it('should return the active area bounds', () => {
      expect(map.getBounds().toBBoxString()).toBe(
        '2.272281646728516,48.80256714651934,2.426776885986328,48.90422310913678'
      );
    });

    it('should return the map bounds without active area', () => {
      map._viewport = null;

      expect(map.getBounds().toBBoxString()).toBe(
        '2.26369857788086,48.796913540275355,2.435359954833985,48.909864610926675'
      );
    });
  });

  describe('#getMapBounds', () => {
    beforeAll(() => {
      mapDiv.style.width = '1000px';
      mapDiv.style.height = '1000px';
      map.setActiveArea({
        position: 'absolute',
        top: '50px',
        left: '50px',
        width: '400px',
        height: '200px'
      });
      map.setView(Paris, 13);
    });

    it('should return full map container bounds even with an active area', () => {
      const activeBounds = map.getBounds();
      const mapBounds = map.getMapBounds();

      // mapBounds must be strictly larger than activeBounds
      expect(mapBounds.contains(activeBounds)).toBe(true);
      expect(mapBounds.equals(activeBounds)).toBe(false);

      // Matches the geographic extent of the 1000x1000 container with the active area offset
      expect(mapBounds.toBBoxString()).toBe(
        '2.26369857788086,48.796913540275355,2.435359954833985,48.909864610926675'
      );
    });

    it('should match getBounds when no active area is set', () => {
      map._viewport = null;

      expect(map.getMapBounds().toBBoxString()).toBe(map.getBounds().toBBoxString());
    });
  });
});
