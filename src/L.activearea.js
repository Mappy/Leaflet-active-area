L.MapWithActiveArea = L.Map.extend({

    initialize: function (element, options, viewport) {
        if(options && options.viewportClassName) {
            this._viewport = L.DomUtil.create('div', options.viewportClassName, L.DomUtil.get(element));
        }
        return L.Map.prototype.initialize.call(this, element, options);
    },

    getViewport: function() {
        return this._viewport;
    },

    getViewportBounds: function() {
        var vp = this._viewport,
            topleft = L.point(vp.offsetLeft, vp.offsetTop),
            vpsize = L.point(vp.clientWidth, vp.clientHeight);

        if (vpsize.x === 0 || vpsize.y === 0) {
            if (window.console) {
                console.error('The viewport has no size. Check your CSS.');
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

    getCenter: function () {
        var center = L.Map.prototype.getCenter.call(this);

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

        if (this.getViewport()) {
            var point = this.project(center, zoom);
            point = point.add(this.getOffset());
            center = this.unproject(point, zoom);
        }

        return L.Map.prototype.setView.call(this, center, zoom, options);
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
            return L.Map.prototype.setZoomAround.call(this, point, zoom, options);
        }
    }
});
