import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'leaflet/dist/leaflet.css';
import {
  LeafletMap,
  LatLng,
  Point,
  FeatureGroup,
  Marker,
  CircleMarker,
  TileLayer,
  Popup
} from 'leaflet';
import '../../src/leaflet.activearea.js';

describe('LeafletActiveArea', () => {
  let map;
  let mapDiv;

  const Paris = new LatLng(48.85346, 2.34956);
  const London = new LatLng(51.505, -0.09);

  beforeEach(() => {
    mapDiv = document.createElement('div');
    mapDiv.style.position = 'absolute';
    mapDiv.style.top = '0px';
    mapDiv.style.left = '0px';
    mapDiv.style.width = '1000px';
    mapDiv.style.height = '1000px';
    mapDiv.style.backgroundColor = 'red';
    mapDiv.style.zIndex = '1';

    document.body.appendChild(mapDiv);

    map = new LeafletMap(mapDiv).setActiveArea({
      position: 'absolute',
      top: '50px',
      left: '50px',
      width: '400px',
      height: '200px',
      outline: '2px solid green',
      zIndex: 2
    });
  });

  afterEach(() => {
    if (map) {
      map.remove();
      map = null;
    }
    if (mapDiv && mapDiv.parentNode) {
      mapDiv.parentNode.removeChild(mapDiv);
      mapDiv = null;
    }
  });

  describe('#getCenter', () => {
    it('centers the map inside the DIV', () => {
      map.setView(Paris, 13);

      const centerPosition = map.latLngToLayerPoint(map.getCenter());
      expect(Math.round(centerPosition.x)).toBe(250); // 400 / 2 + 50
      expect(Math.round(centerPosition.y)).toBe(150); // 200 / 2 + 50
    });

    it('returns the physical container center when withoutViewport is true', () => {
      map.setView(Paris, 13);

      const physicalCenterPos = map.latLngToLayerPoint(map.getCenter(true));
      expect(Math.round(physicalCenterPos.x)).toBe(500); // 1000 / 2
      expect(Math.round(physicalCenterPos.y)).toBe(500); // 1000 / 2
    });
  });

  describe('#fitBounds', () => {
    it('should set markers inside the DIV', () => {
      const markers = new FeatureGroup([new Marker(Paris), new Marker(London)]);
      markers.addTo(map);

      map.fitBounds(markers.getBounds(), { padding: [0, 0] });

      const positionLondon = map.latLngToLayerPoint(London);
      expect(Math.round(positionLondon.x)).toBe(195);
      expect(Math.round(positionLondon.y)).toBe(55);

      const positionParis = map.latLngToLayerPoint(Paris);
      expect(Math.round(positionParis.x)).toBe(306);
      expect(Math.round(positionParis.y)).toBe(244);
    });

    it('should respect padding inside active area', () => {
      const markers = new FeatureGroup([new Marker(Paris), new Marker(London)]);
      markers.addTo(map);

      map.fitBounds(markers.getBounds(), { padding: [10, 10] });
      const bounds = map.getBounds();

      expect(bounds.contains(Paris)).toBe(true);
      expect(bounds.contains(London)).toBe(true);
    });
  });

  describe('#setActiveArea', () => {
    it('should set a new activeArea css', () => {
      const before = map.getViewportBounds();
      expect(before.max.x).toBe(450);
      expect(before.max.y).toBe(250);

      map.setActiveArea({
        position: 'absolute',
        top: '50px',
        left: '50px',
        width: '900px',
        height: '900px',
        outline: '2px solid yellow',
        zIndex: 2
      });

      const after = map.getViewportBounds();
      expect(after.min.x).toBe(50);
      expect(after.min.y).toBe(50);
      expect(after.max.x).toBe(950);
      expect(after.max.y).toBe(950);
    });

    it('supports css class name and keepCenter at zoom 0', () => {
      map.setView(Paris, 0);
      const activeCenterBefore = map.getCenter();

      map.setActiveArea('customActiveArea', true);
      expect(map.getViewport().className).toBe('customActiveArea');

      const activeCenterAfter = map.getCenter();
      expect(activeCenterAfter.distanceTo(activeCenterBefore)).toBeLessThan(1);
    });
  });

  describe('#getViewportBounds', () => {
    it('should fallback when using a zero/small size viewport', () => {
      mapDiv.style.width = '10px';
      mapDiv.style.height = '10px';

      map.setActiveArea({
        position: 'absolute',
        top: '0px',
        left: '0px',
        width: '0px',
        height: '0px'
      });

      const bounds = map.getViewportBounds();
      expect(bounds.min.x).toBe(0);
      expect(bounds.min.y).toBe(0);
      expect(bounds.max.x).toBe(10);
      expect(bounds.max.y).toBe(10);
    });
  });

  describe('#getBounds', () => {
    it('should return the active area bounds for centered 900x900 viewport', () => {
      map.setActiveArea({
        position: 'absolute',
        top: '50px',
        left: '50px',
        width: '900px',
        height: '900px'
      });
      map.setView(Paris, 13);

      expect(map.getBounds().toBBoxString()).toBe(
        '2.272281646728516,48.80256714651934,2.426776885986328,48.90422310913678'
      );
    });

    it('should return the active area bounds for 400x200 viewport', () => {
      map.setView(Paris, 13);
      expect(map.getBounds().toBBoxString()).toBe(
        '2.3151969909667973,48.84212454876025,2.3838615417480473,48.864714761802794'
      );
    });

    it('should return the map bounds when viewport is not set', () => {
      const plainDiv = document.createElement('div');
      plainDiv.style.position = 'absolute';
      plainDiv.style.width = '1000px';
      plainDiv.style.height = '1000px';
      document.body.appendChild(plainDiv);

      const plainMap = new LeafletMap(plainDiv).setView(Paris, 13);
      expect(plainMap.getBounds().toBBoxString()).toBe(
        '2.26369857788086,48.796913540275355,2.435359954833985,48.909864610926675'
      );

      plainMap.remove();
      plainDiv.remove();
    });
  });

  describe('#getMapBounds', () => {
    it('should return full map container bounds even with an active area', () => {
      map.setActiveArea({
        position: 'absolute',
        top: '50px',
        left: '50px',
        width: '900px',
        height: '900px'
      });
      map.setView(Paris, 13);
      const activeBounds = map.getBounds();
      const mapBounds = map.getMapBounds();

      expect(mapBounds.contains(activeBounds)).toBe(true);
      expect(mapBounds.equals(activeBounds)).toBe(false);
      expect(mapBounds.toBBoxString()).toBe(
        '2.26369857788086,48.796913540275355,2.435359954833985,48.909864610926675'
      );
    });

    it('should return shifted container bounds when active area is off-center', () => {
      // 400x200 activeArea at top:50, left:50
      map.setView(Paris, 13);
      const activeBounds = map.getBounds();
      const mapBounds = map.getMapBounds();

      expect(mapBounds.contains(activeBounds)).toBe(true);
      expect(mapBounds.equals(activeBounds)).toBe(false);
      expect(mapBounds.toBBoxString()).toBe(
        '2.306613922119141,48.75732045275146,2.478275299072266,48.8703607224138'
      );
    });
  });

  describe('#flyTo', () => {
    it('animates towards the active area center with animate: false', () => {
      map.setView(Paris, 13);
      map.flyTo(London, 13, { animate: false });

      const centerPos = map.latLngToLayerPoint(map.getCenter());
      expect(Math.round(centerPos.x)).toBe(250);
      expect(Math.round(centerPos.y)).toBe(150);
      expect(map.getCenter().distanceTo(London)).toBeLessThan(1);
    });

    it('works when targetZoom is omitted', () => {
      map.setView(Paris, 13);
      map.flyTo(London, undefined, { animate: false });

      expect(map.getZoom()).toBe(13);
      expect(map.getCenter().distanceTo(London)).toBeLessThan(1);
    });

    it('animates towards the active area center with animation enabled', async () => {
      map.setView(Paris, 13);
      map.flyTo(London, 14, { duration: 0.1 });

      await new Promise(resolve => setTimeout(resolve, 250));

      const centerPos = map.latLngToLayerPoint(map.getCenter());
      expect(Math.round(centerPos.x)).toBe(250);
      expect(Math.round(centerPos.y)).toBe(150);
      expect(map.getZoom()).toBe(14);
      expect(map.getCenter().distanceTo(London)).toBeLessThan(1);
    });
  });

  describe('#setZoomAround', () => {
    it('zooms around a point keeping the active area center coherent', () => {
      map.setView(Paris, 10);
      const targetPoint = new Point(250, 150); // center of active area
      map.setZoomAround(targetPoint, 12, { animate: false });

      const centerPos = map.latLngToLayerPoint(map.getCenter());
      expect(Math.round(centerPos.x)).toBe(250);
      expect(Math.round(centerPos.y)).toBe(150);
      expect(map.getZoom()).toBe(12);
    });
  });

  describe('#setZoom', () => {
    it('keeps the active area centered when zooming in and out with animations', async () => {
      map.setView(Paris, 13);
      map.setZoom(14);

      await new Promise(resolve => setTimeout(resolve, 350));

      let centerPos = map.latLngToLayerPoint(map.getCenter());
      expect(Math.round(centerPos.x)).toBe(250);
      expect(Math.round(centerPos.y)).toBe(150);
      expect(map.getZoom()).toBe(14);
      expect(map.getCenter().distanceTo(Paris)).toBeLessThan(1);

      map.setZoom(13);

      await new Promise(resolve => setTimeout(resolve, 350));

      centerPos = map.latLngToLayerPoint(map.getCenter());
      expect(Math.round(centerPos.x)).toBe(250);
      expect(Math.round(centerPos.y)).toBe(150);
      expect(map.getZoom()).toBe(13);
      expect(map.getCenter().distanceTo(Paris)).toBeLessThan(1);
    });

    it('handles multiple rapid setZoom calls without shifting the active area center', async () => {
      map.setView(Paris, 13);
      map.setZoom(14);
      map.setZoom(15);

      await new Promise(resolve => setTimeout(resolve, 500));

      const centerPos = map.latLngToLayerPoint(map.getCenter());
      expect(Math.round(centerPos.x)).toBe(250);
      expect(Math.round(centerPos.y)).toBe(150);
      expect(map.getZoom()).toBe(15);
      expect(map.getCenter().distanceTo(Paris)).toBeLessThan(1);
    });
  });

  describe('Layers and vector alignment', () => {
    it('keeps vector shapes properly projected within the map', () => {
      map.setView(Paris, 13);
      const circle = new CircleMarker(Paris, { radius: 10 }).addTo(map);

      const circlePos = map.latLngToLayerPoint(Paris);
      expect(Math.round(circlePos.x)).toBe(250);
      expect(Math.round(circlePos.y)).toBe(150);
    });
  });

  describe('Popup autopan', () => {
    it('pans map to keep popup visible within active area', () => {
      map.setView(Paris, 13);
      const popup = new Popup({ autoPan: true, autoPanPadding: [10, 10] })
        .setLatLng(Paris)
        .setContent('<div>Test Popup</div>')
        .openOn(map);

      expect(popup.isOpen()).toBe(true);
    });
  });

  describe('GridLayer level cleanup and zooming', () => {
    it('handles multiple zoom changes and cleanups without _removeLevel error', async () => {
      class TestGridLayer extends TileLayer {
        createTile() {
          return document.createElement('div');
        }
      }

      const layer = new TestGridLayer().addTo(map);
      map.setView(Paris, 10);

      // Multiple successive zooms triggering _updateLevels with level pruning
      map.setZoom(11, { animate: false });
      map.setZoom(12, { animate: false });
      map.setZoom(13, { animate: false });

      expect(map.getZoom()).toBe(13);

      // Verify flyTo triggers view updates without error
      map.flyTo(London, 14, { animate: false });
      expect(map.getZoom()).toBe(14);
      expect(map.getCenter().distanceTo(London)).toBeLessThan(1);

      layer.remove();
    });
  });
});
