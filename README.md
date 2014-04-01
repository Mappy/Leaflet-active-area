Leaflet-active-area
===============

A plugin for [Leaflet](http://leafletjs.com) to change default map behavior to center itself.

## Demo

Try the [example page (examples/index.html)](http://mappy.github.io/Leaflet-active-area/examples/index.html) !

## Usage

Include the javascript file :

    <script src="L.activearea.js"></script>

Create a DIV with a CSS class ("activeArea" in that example), place it inside your map and instanciate your map like that :

    var map = new L.MapWithActiveArea(document.createElement('div'), {
        'viewportClassName': 'activeArea'
    });

Then, the map will center itself in the center of that DIV.

## Contribute

To run the test, you’ll need to install npm and bower libraries :

`npm install && bower install`

then :

`(cd spec && ../node_modules/karma/bin/karma start)`

## License

This code is provided under the Apache 2.0 license.