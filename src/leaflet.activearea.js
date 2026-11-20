import {
    Map,
    Point,
    Bounds,
    LatLng,
    LatLngBounds,
    DomUtil,
    GridLayer,
    BlanketOverlay,
    Renderer,
    Popup
} from 'leaflet';

const previousMethods = {
    getCenter: Map.prototype.getCenter,
    setView: Map.prototype.setView,
    flyTo: Map.prototype.flyTo,
    setZoomAround: Map.prototype.setZoomAround,
    getBoundsZoom: Map.prototype.getBoundsZoom,
    getBounds: Map.prototype.getBounds,
    PopupAdjustPan: Popup.prototype._adjustPan,
    BlanketOverlayUpdateTransform: BlanketOverlay.prototype._updateTransform,
    BlanketOverlayOnMoveEnd: BlanketOverlay.prototype._onMoveEnd,
    onZoomTransitionEnd: Map.prototype._onZoomTransitionEnd,
    animMoveEnd: Map.prototype._animMoveEnd,
    GridLayerSetView: GridLayer.prototype._setView,
    GridLayerAnimateZoom: GridLayer.prototype._animateZoom,
    GridLayerOnMoveEnd: GridLayer.prototype._onMoveEnd,
    GridLayerResetView: GridLayer.prototype._resetView,
    GridLayerUpdateLevels: GridLayer.prototype._updateLevels,
    GridLayerUpdate: GridLayer.prototype._update
};

Map.include({
    // Overrides Map.getBounds
    getBounds() {
        if (this._viewport) {
            return this.getViewportLatLngBounds();
        }
        return this.getMapBounds();
    },

    // Extends Map
    getMapBounds() {
        if (previousMethods.getBounds) {
            return previousMethods.getBounds.call(this);
        }
        const bounds = this.getPixelBounds(),
            sw = this.unproject(bounds.getBottomLeft()),
            ne = this.unproject(bounds.getTopRight());

        return new LatLngBounds(sw, ne);
    },

    // Extends Map
    getViewport() {
        return this._viewport;
    },

    // Extends Map
    getViewportBounds() {
        let vp = this._viewport;
        let topleft = new Point(vp ? vp.offsetLeft : 0, vp ? vp.offsetTop : 0);
        let vpsize = new Point(vp ? vp.clientWidth : 0, vp ? vp.clientHeight : 0);

        if (vpsize.x === 0 || vpsize.y === 0) {
            vp = this.getContainer();
            if (vp) {
                topleft = new Point(0, 0);
                vpsize = new Point(vp.clientWidth, vp.clientHeight);
            }
        }

        return new Bounds(topleft, topleft.add(vpsize));
    },

    // Extends Map
    getViewportLatLngBounds() {
        const bounds = this.getViewportBounds();
        return new LatLngBounds(
            this.containerPointToLatLng(bounds.min),
            this.containerPointToLatLng(bounds.max)
        );
    },

    // Extends Map
    getOffset() {
        const mCenter = this.getSize().divideBy(2),
            vCenter = this.getViewportBounds().getCenter();

        return mCenter.subtract(vCenter);
    },

    // Overrides Map.getCenter
    getCenter(withoutViewport) {
        let center = previousMethods.getCenter.call(this);

        if (this.getViewport() && !withoutViewport) {
            const zoom = this.getZoom(),
                point = this.project(center, zoom).subtract(this.getOffset());

            center = this.unproject(point, zoom);
        }

        return center;
    },

    // Overrides Map.setView
    setView(center, zoom, options) {
        const logicalCenter = new LatLng(center);
        const resolvedZoom = zoom === undefined ? this._targetZoom() : this._limitZoom(zoom);

        let finalCenter = logicalCenter;
        if (this.getViewport()) {
            const point = this.project(logicalCenter, resolvedZoom).add(this.getOffset());
            finalCenter = this.unproject(point, resolvedZoom);
        }

        const ret = previousMethods.setView.call(this, finalCenter, zoom, options);

        if (this.getViewport()) {
            this._targetView = { center: logicalCenter, zoom: resolvedZoom };
            if (this._pendingView) {
                this._pendingView.center = logicalCenter;
            }
        }

        return ret;
    },

    // Overrides Map._onZoomTransitionEnd
    _onZoomTransitionEnd() {
        if (!this._animatingZoom) {
            return;
        }

        clearTimeout(this._transitionEndTimer);
        this._containerRect = null;
        this._mapPane.classList.remove('leaflet-zoom-anim');

        this._animatingZoom = false;

        this._move(this.getCenter(true), this._animateToZoom, undefined, true);

        if (this._tempFireZoomEvent) {
            this._fireMove('zoom');
        }
        delete this._tempFireZoomEvent;

        this._fireMove('move');

        this._moveEnd(true);

        const view = this._pendingView;
        if (view) {
            this._zoomAnimFrame = requestAnimationFrame(() => {
                this._pendingView = null;
                this.setView(view.center, view.zoom, view.options);
            });
        }
    },

    // Overrides Map._animMoveEnd
    _animMoveEnd() {
        const c = this.getCenter(true);
        const z = this.getZoom();

        DomUtil.setTransform(
            this._proxy,
            this.project(c, z),
            this.getZoomScale(z, 1)
        );
    },

    // Overrides Map.flyTo
    flyTo(targetCenter, targetZoom, options) {
        targetCenter = new LatLng(targetCenter);
        options = options || {};

        if (options.animate === false || (options.animate !== true && this._prefersReducedMotion())) {
            return this.setView(targetCenter, targetZoom, options);
        }

        const startZoom = this._zoom;
        const resolvedTargetZoom = targetZoom === undefined ? this._targetZoom() : this._limitZoom(targetZoom);

        let finalCenter = targetCenter;
        if (this.getViewport()) {
            const point = this.project(targetCenter, resolvedTargetZoom).add(this.getOffset());
            finalCenter = this.unproject(point, resolvedTargetZoom);
        }

        const center = this._limitCenter(finalCenter, resolvedTargetZoom, this.options.maxBounds);

        this._stop();
        this._targetView = { center: targetCenter, zoom: resolvedTargetZoom };

        this._subpixelOrigin = true;

        const from = this.project(this.getCenter(true)),
            to = this.project(center),
            size = this.getSize();

        const w0 = Math.max(size.x, size.y),
            w1 = w0 * this.getZoomScale(startZoom, resolvedTargetZoom),
            u1 = to.distanceTo(from) || 1,
            rho = 1.42,
            rho2 = rho * rho;

        function r(i) {
            const s1 = i ? -1 : 1,
                s2 = i ? w1 : w0,
                t1 = w1 * w1 - w0 * w0 + s1 * rho2 * rho2 * u1 * u1,
                b1 = 2 * s2 * rho2 * u1;

            return -Math.asinh(t1 / b1);
        }

        const r0 = r(0);

        function u(s) {
            return (w0 * (Math.cosh(r0) * Math.tanh(r0 + rho * s) - Math.sinh(r0))) / rho2;
        }

        function easeOut(t) {
            return 1 - Math.pow(1 - t, 1.5);
        }

        const start = Date.now(),
            S = (r(1) - r0) / rho,
            duration = 1000 * (options.duration || S * 0.8);

        const frame = () => {
            const t = (Date.now() - start) / duration,
                s = easeOut(t) * S;

            if (t <= 1) {
                this._flyToFrame = requestAnimationFrame(frame);

                this._move(
                    this.unproject(from.add(to.subtract(from).multiplyBy(u(s) / u1)), startZoom),
                    this.getScaleZoom(Math.cosh(r0 + rho * s) / Math.cosh(r0), startZoom),
                    { flyTo: true }
                );
            } else {
                const zoomChanged = this._zoom !== resolvedTargetZoom;
                this._subpixelOrigin = false;
                this._move(center, resolvedTargetZoom);
                if (!zoomChanged) {
                    this._fireMove('zoom');
                }
                this._moveEnd(true);
            }
        };

        this._moveStart(true, options.noMoveStart, options.originalEvent);

        frame();
        return this;
    },

    // Overrides Map.setZoomAround
    setZoomAround(latlng, zoom, options) {
        const vp = this.getViewport();

        if (vp) {
            const scale = this.getZoomScale(zoom),
                viewHalf = this.getViewportBounds().getCenter(),
                containerPoint = latlng instanceof Point ? latlng : this.latLngToContainerPoint(latlng),
                centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),
                newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));

            return this.setView(newCenter, zoom, { zoom: options });
        }

        return previousMethods.setZoomAround.call(this, latlng, zoom, options);
    },

    // Overrides Map.getBoundsZoom
    getBoundsZoom(bounds, inside, padding) {
        bounds = new LatLngBounds(bounds);
        padding = new Point(padding || [0, 0]);

        let zoom = this.getZoom() ?? 0;
        const min = this.getMinZoom(),
            max = this.getMaxZoom(),
            vp = this.getViewport(),
            size = (vp ? new Point(vp.clientWidth, vp.clientHeight) : this.getSize()).subtract(padding),
            corners = [
                bounds.getNorthWest(),
                bounds.getNorthEast(),
                bounds.getSouthEast(),
                bounds.getSouthWest()
            ],
            boundsSize = new Bounds(corners.map(c => this.project(c, zoom))).getSize(),
            snap = this.options.zoomSnap,
            scalex = Math.max(size.x, 0) / boundsSize.x,
            scaley = Math.max(size.y, 0) / boundsSize.y,
            scale = inside ? Math.max(scalex, scaley) : Math.min(scalex, scaley);

        zoom = this.getScaleZoom(scale, zoom);

        if (snap) {
            zoom = Math.round(zoom / (snap / 100)) * (snap / 100);
            zoom = inside ? Math.ceil(zoom / snap) * snap : Math.floor(zoom / snap) * snap;
        }

        return Math.max(min, Math.min(max, zoom));
    },

    // Extends Map
    setActiveArea(css, keepCenter, animate) {
        let center;
        if (keepCenter && this._loaded) {
            center = this.getCenter();
        }

        if (!this._viewport) {
            const container = this.getContainer();
            this._viewport = DomUtil.create('div', '');
            container.insertBefore(this._viewport, container.firstChild);
        }

        if (typeof css === 'string') {
            this._viewport.className = css;
        } else {
            Object.assign(this._viewport.style, css);
        }

        if (center) {
            this.setView(center, this.getZoom(), { animate: !!animate });
        }
        return this;
    }
});

BlanketOverlay.include({
    _onZoom() {
        this._updateTransform(this._map.getCenter(true), this._map.getZoom());
    },

    _onMoveEnd(ev) {
        if (!this._map?._viewport) {
            return previousMethods.BlanketOverlayOnMoveEnd.call(this, ev);
        }

        const p = this.options.padding,
            size = this._map.getSize(),
            min = this._map.containerPointToLayerPoint(size.multiplyBy(-p)).round();

        this._bounds = new Bounds(min, min.add(size.multiplyBy(1 + p * 2)).round());
        this._center = this._map.getCenter(true);
        this._zoom = this._map.getZoom();
        this._updateTransform(this._center, this._zoom);

        this._onSettled(ev);
    }
});

GridLayer.include({
    _resetView(e) {
        const animating = e && (e.pinch || e.flyTo);
        this._setView(this._map.getCenter(true), this._map.getZoom(), animating, animating);
    },

    _animateZoom(e) {
        const map = this._map,
            center = map.getCenter(true),
            zoom = map.getZoom(),
            scale = map.getZoomScale(e.zoom, zoom);

        this._setView(e.center, e.zoom, true, e.noUpdate);

        this._setZoomTransforms(center, zoom);
        DomUtil.setTransform(
            this._container,
            map._getNewPixelOrigin(center, zoom).multiplyBy(scale).subtract(map._getNewPixelOrigin(e.center, e.zoom)),
            scale
        );
    },

    _onMoveEnd(e) {
        const map = this._map;
        if (!map || map._animatingZoom) {
            return;
        }

        if (this._container && this._container.style.transform) {
            this._setZoomTransforms(map.getCenter(true), map.getZoom());
        }

        this._update();

        if (e?.type === 'moveend' && this._noPrune) {
            this._noPrune = false;
            this._pruneTiles();
        }
    },

    _updateLevels() {
        const zoom = this._tileZoom,
            maxZoom = this.options.maxZoom;

        if (zoom === undefined) {
            return undefined;
        }

        for (const zStr of Object.keys(this._levels)) {
            const z = Number(zStr);
            if (this._levels[z].el.children.length || z === zoom) {
                this._levels[z].el.style.zIndex = `${maxZoom - Math.abs(zoom - z)}`;
                this._onUpdateLevel(z);
            } else {
                this._levels[z].el.remove();
                this._removeTilesAtZoom?.(z);
                this._onRemoveLevel?.(z);
                delete this._levels[z];
            }
        }

        let level = this._levels[zoom];
        const map = this._map;

        if (!level) {
            level = this._levels[zoom] = {};

            level.el = DomUtil.create('div', 'leaflet-tile-container leaflet-zoom-animated', this._container);
            level.el.style.zIndex = `${maxZoom}`;

            level.origin = map.project(map.unproject(map.getPixelOrigin()), zoom).round();
            level.zoom = zoom;

            this._setZoomTransform(level, map.getCenter(true), map.getZoom());

            this._onCreateLevel(level);
        }

        this._level = level;
        return level;
    },

    _update(center) {
        const map = this._map;
        if (!map) {
            return;
        }
        if (center === undefined) {
            center = map.getCenter(true);
        }
        return previousMethods.GridLayerUpdate.call(this, center);
    }
});

Popup.include({
    _adjustPan() {
        if (!this._map._viewport) {
            return previousMethods.PopupAdjustPan.call(this);
        }

        if (!this.options.autoPan) {
            return;
        }

        this._map._panAnim?.stop();
        if (!this._map) {
            return;
        }

        if (this._autopanning) {
            this._autopanning = false;
            return;
        }

        const map = this._map,
            vp = map._viewport,
            marginBottom = parseInt(getComputedStyle(this._container).marginBottom, 10) || 0,
            containerHeight = this._containerHeight + marginBottom,
            containerWidth = this._containerWidth,
            vpTopleft = new Point(vp.offsetLeft, vp.offsetTop),
            layerPos = new Point(
                this._containerLeft - vpTopleft.x,
                -containerHeight - this._containerBottom - vpTopleft.y
            );

        layerPos._add(DomUtil.getPosition(this._container));

        const containerPos = map.layerPointToContainerPoint(layerPos),
            padding = new Point(this.options.autoPanPadding),
            paddingTL = new Point(this.options.autoPanPaddingTopLeft ?? padding),
            paddingBR = new Point(this.options.autoPanPaddingBottomRight ?? padding),
            size = new Point(vp.clientWidth, vp.clientHeight);

        let dx = 0,
            dy = 0;

        if (containerPos.x + containerWidth + paddingBR.x > size.x) {
            dx = containerPos.x + containerWidth - size.x + paddingBR.x;
        }
        if (containerPos.x - dx - paddingTL.x < 0) {
            dx = containerPos.x - paddingTL.x;
        }
        if (containerPos.y + containerHeight + paddingBR.y > size.y) {
            dy = containerPos.y + containerHeight - size.y + paddingBR.y;
        }
        if (containerPos.y - dy - paddingTL.y < 0) {
            dy = containerPos.y - paddingTL.y;
        }

        if (dx || dy) {
            if (this.options.keepInView) {
                this._autopanning = true;
            }

            map.fire('autopanstart').panBy([dx, dy]);
        }
    }
});
