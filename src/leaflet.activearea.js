(function(previousMethods){
if (typeof previousMethods === 'undefined') {
    // Defining previously that object allows you to use that plugin even if you have overridden L.map
    previousMethods = {
        getCenter: L.Map.prototype.getCenter,
        setView: L.Map.prototype.setView,
        setZoomAround: L.Map.prototype.setZoomAround,
        getBoundsZoom: L.Map.prototype.getBoundsZoom,
        scaleUpdate: L.Control.Scale.prototype._update,
        PopupAdjustPan: L.Popup.prototype._adjustPan
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

    _hasTorqueLayer: function() {
        if(!L.TorqueLayer) return false;

        var keys = Object.keys(this._layers);

        for(var i = 0, j = keys.length; i < j; i++) {
            if(this._layers[keys[i]] instanceof L.TorqueLayer) {
                return true;
            }
        }

        return false;
    },

    getOffset: function() {
        var mCenter = this.getSize().divideBy(2),
            vCenter = this.getViewportBounds().getCenter();

        /* If one of the map layer is a Torque, we wan't to return the center
         * of the map and not the one of the viewport because it messes up the
         * position of the dots on the map (offset them by the difference
         * between mCenter and vCenter) */
        if(this._hasTorqueLayer()) {
            return L.point([0, 0]);
        }

        return mCenter.subtract(vCenter);
    },

    getCenter: function () {
        var center = previousMethods.getCenter.call(this);

        if (this.getViewport()) {
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

        var zoom = this.getMinZoom() - (inside ? 1 : 0),
            maxZoom = this.getMaxZoom(),
            vp = this.getViewport(),
            size = (vp) ? L.point(vp.clientWidth, vp.clientHeight) : this.getSize(),

            nw = bounds.getNorthWest(),
            se = bounds.getSouthEast(),

            zoomNotFound = true,
            boundsSize;

        padding = L.point(padding || [0, 0]);

        do {
            zoom++;
            boundsSize = this.project(se, zoom).subtract(this.project(nw, zoom)).add(padding);
            zoomNotFound = !inside ? size.contains(boundsSize) : boundsSize.x < size.x || boundsSize.y < size.y;

        } while (zoomNotFound && zoom <= maxZoom);

        if (zoomNotFound && inside) {
            return null;
        }

        return inside ? zoom : zoom - 1;
    }
});

L.Control.Scale.include({
    _update: function () {
        if (!this._map._viewport) {
            previousMethods.scaleUpdate.call(this);
        } else {
            var bounds = this._map.getBounds(),
                centerLat = bounds.getCenter().lat,
                halfWorldMeters = 6378137 * Math.PI * Math.cos(centerLat * Math.PI / 180),
                dist = halfWorldMeters * (bounds.getNorthEast().lng - bounds.getSouthWest().lng) / 180,
                options = this.options,
                maxMeters = 0;

            var size = new L.Point(
                this._map._viewport.clientWidth,
                this._map._viewport.clientHeight);

            if (size.x > 0) {
                maxMeters = dist * (options.maxWidth / size.x);
            }

            this._updateScales(options, maxMeters);
        }
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

L.Popup.include({
    _adjustPan: function () {
        if (!this._map._viewport) {
            previousMethods.PopupAdjustPan.call(this);
        } else {
            if (!this.options.autoPan) { return; }

            var map = this._map,
                vp = map._viewport,
                containerHeight = this._container.offsetHeight,
                containerWidth = this._containerWidth,
                vpTopleft = L.point(vp.offsetLeft, vp.offsetTop),

                layerPos = new L.Point(
                    this._containerLeft - vpTopleft.x,
                    - containerHeight - this._containerBottom - vpTopleft.y);

            if (this._animated) {
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

            if (dx || dy) {
                map
                    .fire('autopanstart')
                    .panBy([dx, dy]);
            }
        }
    }
});
})(window.leafletActiveAreaPreviousMethods);
