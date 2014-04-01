describe("LeafletActiveArea", function () {

    var map;

    var Paris   = L.latLng(48.853460000000005, 2.3495600000000127);

    before(function () {

        var mapDiv = document.createElement('div');
        mapDiv.style.position = 'absolute';
        mapDiv.style.top = 0;
        mapDiv.style.bottom = 0;
        mapDiv.style.width = '100%';

        var zone = document.createElement('div');
        zone.style.position = 'absolute';
        mapDiv.style.top = 50;
        mapDiv.style.width = 200;
        mapDiv.style.height = 200;
        mapDiv.className = 'viewport';

        map = new L.MapWithActiveArea(mapDiv, {
            'viewportClassName': 'viewport'
        });
    });

    describe('#getCenter', function () {

        it('returns a precise center ', function () {
            map.setView(Paris, 13);
            expect(map.getCenter()).to.eql(Paris);
        });
    });
});
