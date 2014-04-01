describe("LeafletActiveArea", function () {

    var map;
    var Paris = L.latLng(48.85346, 2.34956);

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

        map = new L.MapWithActiveArea(mapDiv, {
            'viewportClassName': 'viewport'
        });

        var zoneDiv = document.querySelector('.viewport');
        zoneDiv.style.position = 'absolute';
        zoneDiv.style.top = '50px';
        zoneDiv.style.left = '50px';
        zoneDiv.style.width = '200px';
        zoneDiv.style.height = '200px';
        zoneDiv.style.backgroundColor = 'green';
        zoneDiv.style.zIndex = 2;
    });

    describe('#getCenter', function () {

        it('centers the map inside the DIV', function () {

            map.setView(Paris, 13);

            var centerPosition = map.latLngToLayerPoint(map.getCenter());
            expect(centerPosition.x).to.eql(150);
            expect(centerPosition.y).to.eql(150);
        });
    });
});
