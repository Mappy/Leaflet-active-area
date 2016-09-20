(function(previousMethods){
if (typeof previousMethods === 'undefined') {
    // Defining previously that object allows you to use that plugin even if you have overridden L.map
    previousMethods = {
        getCenter: L.Map.prototype.getCenter,
        setView: L.Map.prototype.setView,
        setZoomAround: L.Map.prototype.setZoomAround,
        getBoundsZoom: L.Map.prototype.getBoundsZoom,
        PopupAdjustPan: L.Popup.prototype._adjustPan,
        RendererUpdate: L.Renderer.prototype._update
    };
}


L.Map.include({
    getBounds: function() {
        if (this._viewport) {
            return this.getViewportLatLngBounds()
        } else {
            var bounds = this.getPixelBounds(),
            sw = this.unproject(bounds.getBottomLeft()),
            ne = this.unproject(bounds.getTopRight());

            return new L.LatLngBounds(sw, ne);
        }
    },

    getViewport: function() {
        return this._viewport;
    },

    getViewportBounds: function() {
        var vp = this._viewport,
            topleft = L.point(vp.offsetLeft, vp.offsetTop),
            vpsize = L.point(vp.clientWidth, vp.clientHeight);

        if (vpsize.x === 0 || vpsize.y === 0) {
            //Our own viewport has no good size - so we fallback to the container size:
            vp = this.getContainer();
            if(vp){
              topleft = L.point(0, 0);
              vpsize = L.point(vp.clientWidth, vp.clientHeight);
            }

        }

        return L.bounds(topleft, topleft.add(vpsize));
    },

    getViewportLatLngBounds: function() {
        var bounds = this.getViewportBounds();
        return L.latLngBounds(this.containerPointToLatLng(bounds.min), this.containerPointToLatLng(bounds.max));
    },

    getOffset: function() {
        var mCenter = this.getSize().divideBy(2),
            vCenter = this.getViewportBounds().getCenter();

        return mCenter.subtract(vCenter);
    },

    getCenter: function (withoutViewport) {
        var center = previousMethods.getCenter.call(this);

        if (this.getViewport() && !withoutViewport) {
            var zoom = this.getZoom(),
                point = this.project(center, zoom);
            point = point.subtract(this.getOffset());

            center = this.unproject(point, zoom);
        }

        return center;
    },

    setView: function (center, zoom, options) {
        center = L.latLng(center);
        zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom);

        if (this.getViewport()) {
            var point = this.project(center, this._limitZoom(zoom));
            point = point.add(this.getOffset());
            center = this.unproject(point, this._limitZoom(zoom));
        }

        return previousMethods.setView.call(this, center, zoom, options);
    },

    setZoomAround: function (latlng, zoom, options) {
        var vp = this.getViewport();

        if (vp) {
            var scale = this.getZoomScale(zoom),
                viewHalf = this.getViewportBounds().getCenter(),
                containerPoint = latlng instanceof L.Point ? latlng : this.latLngToContainerPoint(latlng),

                centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),
                newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));

            return this.setView(newCenter, zoom, {zoom: options});
        } else {
            return previousMethods.setZoomAround.call(this, latlng, zoom, options);
        }
    },

    getBoundsZoom: function (bounds, inside, padding) { // (LatLngBounds[, Boolean, Point]) -> Number
        bounds = L.latLngBounds(bounds);
        padding = L.point(padding || [0, 0]);

        var zoom = this.getZoom() || 0,
            min = this.getMinZoom(),
            max = this.getMaxZoom(),
            nw = bounds.getNorthWest(),
            se = bounds.getSouthEast(),
            vp = this.getViewport(),
            size = (vp ? L.point(vp.clientWidth, vp.clientHeight) : this.getSize()).subtract(padding),
            boundsSize = this.project(se, zoom).subtract(this.project(nw, zoom)),
            snap = L.Browser.any3d ? this.options.zoomSnap : 1;

        var scale = Math.min(size.x / boundsSize.x, size.y / boundsSize.y);

        zoom = this.getScaleZoom(scale, zoom);

        if (snap) {
            zoom = Math.round(zoom / (snap / 100)) * (snap / 100); // don't jump if within 1% of a snap level
            zoom = inside ? Math.ceil(zoom / snap) * snap : Math.floor(zoom / snap) * snap;
        }

        return Math.max(min, Math.min(max, zoom));
    }
});

L.Map.include({
    setActiveArea: function (css) {
        if( !this._viewport ){
            //Make viewport if not already made
            var container = this.getContainer();
            this._viewport = L.DomUtil.create('div', '');
            container.insertBefore(this._viewport, container.firstChild);
        }

        if (typeof css === 'string') {
            this._viewport.className = css;
        } else {
            L.extend(this._viewport.style, css);
        }
        return this;
    }
});

L.Renderer.include({
    _onZoom: function () {
        this._updateTransform(this._map.getCenter(true), this._map.getZoom());
    },

    _update: function () {
        previousMethods.RendererUpdate.call(this);
        this._center = this._map.getCenter(true);
    }
});

L.GridLayer.include({
    _updateLevels: function () {

        var zoom = this._tileZoom,
        maxZoom = this.options.maxZoom;

        if (zoom === undefined) { return undefined; }

        for (var z in this._levels) {
            if (this._levels[z].el.children.length || z === zoom) {
                this._levels[z].el.style.zIndex = maxZoom - Math.abs(zoom - z);
            } else {
                L.DomUtil.remove(this._levels[z].el);
                this._removeTilesAtZoom(z);
                delete this._levels[z];
            }
        }

        var level = this._levels[zoom],
        map = this._map;

        if (!level) {
            level = this._levels[zoom] = {};

            level.el = L.DomUtil.create('div', 'leaflet-tile-container leaflet-zoom-animated', this._container);
            level.el.style.zIndex = maxZoom;

            level.origin = map.project(map.unproject(map.getPixelOrigin()), zoom).round();
            level.zoom = zoom;

            this._setZoomTransform(level, map.getCenter(true), map.getZoom());

            // force the browser to consider the newly added element for transition
            L.Util.falseFn(level.el.offsetWidth);
        }

        this._level = level;

        return level;
    },

    _resetView: function (e) {
        var animating = e && (e.pinch || e.flyTo);
        this._setView(this._map.getCenter(true), this._map.getZoom(), animating, animating);
    },

    _update: function (center) {
        var map = this._map;
        if (!map) { return; }
        var zoom = map.getZoom();

        if (center === undefined) { center = map.getCenter(this); }
        if (this._tileZoom === undefined) { return; }    // if out of minzoom/maxzoom

        var pixelBounds = this._getTiledPixelBounds(center),
            tileRange = this._pxBoundsToTileRange(pixelBounds),
            tileCenter = tileRange.getCenter(),
            queue = [];

        for (var key in this._tiles) {
            this._tiles[key].current = false;
        }

        // _update just loads more tiles. If the tile zoom level differs too much
        // from the map's, let _setView reset levels and prune old tiles.
        if (Math.abs(zoom - this._tileZoom) > 1) { this._setView(center, zoom); return; }

        // create a queue of coordinates to load tiles from
        for (var j = tileRange.min.y; j <= tileRange.max.y; j++) {
            for (var i = tileRange.min.x; i <= tileRange.max.x; i++) {
                var coords = new L.Point(i, j);
                coords.z = this._tileZoom;

                if (!this._isValidTile(coords)) { continue; }

                var tile = this._tiles[this._tileCoordsToKey(coords)];
                if (tile) {
                    tile.current = true;
                } else {
                    queue.push(coords);
                }
            }
        }

        // sort tile queue to load tiles in order of their distance to center
        queue.sort(function (a, b) {
            return a.distanceTo(tileCenter) - b.distanceTo(tileCenter);
        });

        if (queue.length !== 0) {
            // if its the first batch of tiles to load
            if (!this._loading) {
                this._loading = true;
                // @event loading: Event
                // Fired when the grid layer starts loading tiles
                this.fire('loading');
            }

            // create DOM fragment to append tiles in one batch
            var fragment = document.createDocumentFragment();

            for (i = 0; i < queue.length; i++) {
                this._addTile(queue[i], fragment);
            }

            this._level.el.appendChild(fragment);
        }
    }
});

L.Popup.include({
    _adjustPan: function () {
        if (!this._map._viewport) {
            previousMethods.PopupAdjustPan.call(this);
        } else {
            if (!this.options.autoPan || (this._map._panAnim && this._map._panAnim._inProgress)) { return; }

            var map = this._map,
                vp = map._viewport,
                containerHeight = this._container.offsetHeight,
                containerWidth = this._containerWidth,
                vpTopleft = L.point(vp.offsetLeft, vp.offsetTop),

                layerPos = new L.Point(
                    this._containerLeft - vpTopleft.x,
                    - containerHeight - this._containerBottom - vpTopleft.y);

            if (this._zoomAnimated) {
                layerPos._add(L.DomUtil.getPosition(this._container));
            }

            var containerPos = map.layerPointToContainerPoint(layerPos),
                padding = L.point(this.options.autoPanPadding),
                paddingTL = L.point(this.options.autoPanPaddingTopLeft || padding),
                paddingBR = L.point(this.options.autoPanPaddingBottomRight || padding),
                size = L.point(vp.clientWidth, vp.clientHeight),
                dx = 0,
                dy = 0;

            if (containerPos.x + containerWidth + paddingBR.x > size.x) { // right
                dx = containerPos.x + containerWidth - size.x + paddingBR.x;
            }
            if (containerPos.x - dx - paddingTL.x < 0) { // left
                dx = containerPos.x - paddingTL.x;
            }
            if (containerPos.y + containerHeight + paddingBR.y > size.y) { // bottom
                dy = containerPos.y + containerHeight - size.y + paddingBR.y;
            }
            if (containerPos.y - dy - paddingTL.y < 0) { // top
                dy = containerPos.y - paddingTL.y;
            }

            // @namespace Map
            // @section Popup events
            // @event autopanstart
            // Fired when the map starts autopanning when opening a popup.
            if (dx || dy) {
                map
                    .fire('autopanstart')
                    .panBy([dx, dy]);
            }
        }
    }
});
})(window.leafletActiveAreaPreviousMethods);
