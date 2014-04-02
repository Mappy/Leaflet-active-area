describe("LeafletActiveArea", function () {

    var map;

    var Paris       = L.latLng(48.85346, 2.34956);
    var London      = L.latLng(51.505, -0.09);

    before(function () {

        var mapDiv = document.createElement('div');
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
});
