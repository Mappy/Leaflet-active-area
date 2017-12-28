Leaflet-active-area [![Build Status](https://travis-ci.org/Mappy/Leaflet-active-area.svg?branch=master)](https://travis-ci.org/Mappy/Leaflet-active-area)
===============

That [Leaflet](http://leafletjs.com) plugin allows you to use a DIV as the active area.
All positionning methods (setView, fitBounds, setZoom) will be applyed on this DIV instead of the all map.
A typical use case is to set a map as background (like that [example](http://mappy.github.io/Leaflet-active-area/examples/index.html)) and center it on the top of the screen for example.
Defining media queries on that DIV make it easy to adapt the active area according client resolution.

## Demo

Try the [example page](http://mappy.github.io/Leaflet-active-area/examples/index.html) !

## Versions

The "master" branch supports leaflet 1.0
The "leaflet-0.7" branch supports leaflet 0.7

## Installation

The latest version (1.0.*) of leaflet-active-area supports leaflet-1.0

For leaflet 0.7.7, use `npm install --save-dev leaflet-active-area@0.1.1`

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

Then, the map will center itself in the center of that DIV when calling setView, setZoom, fitBounds, etc.

If your need to re-center the map automatically, pass 'true' as second argument :

    map.setActiveArea('activeArea', true, true);

Pass true as 3rd argument to animate the pan (default = false)


## Contribute

To run tests, you’ll need to install npm and bower libraries :

`npm install && bower install`

then :

`npm test`

## Contributors

Thanks to all contributors : https://github.com/Mappy/Leaflet-active-area/graphs/contributors


## License

This code is provided under the Apache 2.0 license.
