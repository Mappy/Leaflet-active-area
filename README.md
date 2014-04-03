Leaflet-active-area
===============

That plugin for [Leaflet](http://leafletjs.com) allows you to use a DIV as the active area.
Calling setView, fitBounds or setZoom will use the center of the DIV instead of the center of the map area.
A typical use case is to set a map as background (like that [example](http://mappy.github.io/Leaflet-active-area/examples/index.html)) and center it on the top of the screen for example.
Defining media queries on that DIV make it easy to adapt the active area according client resolution.

## Demo

Try the [example page](http://mappy.github.io/Leaflet-active-area/examples/index.html) !

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