Leaflet-active-area
===============

A plugin for [Leaflet](http://leafletjs.com) to change default map behavior to center itself.

## Demo

Try the [example page (examples/index.html)](http://mappy.github.io/Leaflet-active-area/examples/index.html) !

## Usage

Include the javascript file :

    <script src="L.activearea.js"></script>

Add a CSS class (".activeArea" in that example) with absolute position

    .activeArea { position: absolute; top: 50px; left: 50px; right: 50px; height: 200px; }

And instanciate your map like that :

    var map = new L.Map(document.createElement('div')).setActiveArea('activeArea');

You can also give an object with HTML style properties:

    var map = new L.Map(document.createElement('div')).setActiveArea({
        position: 'absolute',
        top: '50px',
        left: '50px',
        right: '50px',
        height: '200px'
    });

Then, the map will center itself in the center of that DIV.

## Contribute

To run tests, you’ll need to install npm and bower libraries :

`npm install && bower install`

then :

`(cd spec && ../node_modules/karma/bin/karma start)`

## License

This code is provided under the Apache 2.0 license.