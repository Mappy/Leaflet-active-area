Leaflet-active-area
===============

That [Leaflet](http://leafletjs.com) plugin allows you to use a DIV as the active area.
All positionning methods (setView, fitBounds, setZoom) will be applyed on this DIV instead of the all map.
A typical use case is to set a map as background (like that [example](http://mappy.github.io/Leaflet-active-area/examples/index.html)) and center it on the top of the screen for example.
Defining media queries on that DIV make it easy to adapt the active area according client resolution.

Supports leaflet 1.0.1

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

Then, the map will center itself in the center of that DIV when calling setView, setZoom, fitBounds, etc.

## Contribute

To run tests, you’ll need to install npm and bower libraries :

`npm install && bower install`

then :

`npm test`

## Contributors

- Samuel Piquet ([sa3m](https://github.com/sa3m), Mappy), creator of this plugin
- Grégory Paul ([paulgreg](https://github.com/paulgreg), Mappy)
- Michael Cellier ([mcellier](https://github.com/mcellier), Mappy)
- Frederic Le Menach ([flemenach](https://github.com/flemenach), Mappy)
- Vivien Ripoche ([vripoche](https://github.com/vripoche), Mappy)
- Eric Brelsford ([ebrelsford](https://github.com/ebrelsford))
- Dag Jomar Mersland ([dagjomar](https://github.com/dagjomar))
- Miroslav Petrik ([11th](https://github.com/11th))

## License

This code is provided under the Apache 2.0 license.
