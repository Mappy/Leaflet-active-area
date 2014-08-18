describe("LeafletActiveArea", function () {

    var map, mapDiv;

    var Paris       = L.latLng(48.85346, 2.34956);
    var London      = L.latLng(51.505, -0.09);

    before(function () {

        mapDiv = document.createElement('div');
        mapDiv.style.position = 'absolute';
        mapDiv.style.top = 0;
        mapDiv.style.bottom = 0;
        mapDiv.style.width = '1000px';
        mapDiv.style.height = '1000px';
        mapDiv.style.backgroundColor = 'red';
        mapDiv.style.zIndex = 1;

        document.body.appendChild(mapDiv);

        map = new L.Map(mapDiv).setActiveArea({
            position: 'absolute',
            top: '50px',
            left: '50px',
            width: '400px',
            height: '200px',
            backgroundColor: 'green',
            zIndex: 2
        });
    });

    describe('#getCenter', function () {

        it('centers the map inside the DIV', function () {

            // When
            map.setView(Paris, 13);

            // Then
            var centerPosition = map.latLngToLayerPoint(map.getCenter());
            expect(centerPosition.x).to.eql(250); // 400 / 2 + 50
            expect(centerPosition.y).to.eql(150); // 200 / 2 + 50
        });
    });

    describe('#fitBounds', function () {

        it('should set markers inside the DIV', function () {

            // Given
            var markers = L.featureGroup([L.marker(Paris), L.marker(London)]);
            markers.addTo(map);

            // When
            map.fitBounds(markers.getBounds(), {padding: [10, 10]});

            // Then
            var position = map.latLngToLayerPoint(London);
            expect(position.x).to.be.eql(222);
            expect(position.y).to.be.eql(103);

            position = map.latLngToLayerPoint(Paris);
            expect(position.x).to.be.eql(277);
            expect(position.y).to.be.eql(197);
        });
    });

    describe('#setActiveArea', function () {

        it('should set a new activeArea css', function () {

            var before = map.getViewportBounds();
            expect(before.max.x).to.be.eql(450);
            expect(before.max.y).to.be.eql(250);

            map.setActiveArea({
                top: '50px',
                left: '50px',
                width: null,
                height: null,
                right: '50px',
                bottom: '50px',
                backgroundColor: 'green',
                zIndex: 2
            });

            var after = map.getViewportBounds();
            expect(after.min.x).to.be.eql(50);
            expect(after.min.y).to.be.eql(50);
            expect(after.max.x).to.be.eql(950);
            expect(after.max.y).to.be.eql(950);
        });

    });

    describe('#getViewportBounds', function () {

        it('should fallback when using a very small container', function () {

            var before = map.getViewportBounds();
            //Set the mapDiv to be a very small size
            mapDiv.style.width = '10px';
            mapDiv.style.height = '10px';

            var bounds = map.getViewportBounds();
            expect(bounds.min.x).to.be.eql(0);
            expect(bounds.min.y).to.be.eql(0);
            expect(bounds.max.x).to.be.eql(10);
            expect(bounds.max.y).to.be.eql(10);
        });

    });

    describe('#getBounds', function () {
        before(function() {
            mapDiv.style.width = '1000px';
            mapDiv.style.height = '1000px';
            map.setView(Paris, 13);
        });

        it('should return the active area bounds', function () {
            expect(map.getBounds().toBBoxString()).to.eql('2.2722816467285156,48.80256714651934,2.426776885986328,48.90422310913676');
        });

        it('should return the map bounds without active area', function() {
            map._viewport = null;

            expect(map.getBounds().toBBoxString()).to.eql('2.2636985778808594,48.796913540275355,2.4353599548339844,48.909864610926675');
        });
    });
});

