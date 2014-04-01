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

        map = new L.Map(mapDiv).setActiveArea({
            position: 'absolute',
            top: '50px',
            left: '50px',
            width: '200px',
            height: '200px',
            backgroundColor: 'green',
            zIndex: 2
        });
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
