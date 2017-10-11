"use strict";

/**
 * A wrapper for the canvas to make drawing easy and quick
 */
class OICanvas {
    constructor(canvas, name) {
        this.name = name;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        this.backCanvas = document.createElement('canvas');
        this.backCanvas.width = canvas.width;
        this.backCanvas.height = canvas.height;
        this.bCtx = this.backCanvas.getContext('2d');

        this.strokeCanvas = document.createElement('canvas');
        this.strokeCanvas.width = canvas.width;
        this.strokeCanvas.height = canvas.height;
        this.sCtx = this.strokeCanvas.getContext('2d');

        this.strokes = {};
        this.partition = [];
        this._isRedrawing = false;
    }

    partition(x, y) {
        var pWidth = (this.width * 1.0) / x;
        var pHeight = (this.height * 1.0) / y;
        for(var i = 0; i < x; i++) {
            for(var j = 0; j < y; i++) {
                this.partitions.push({
                    'x': i * pWidth,
                    'y': j * pHeight,
                    'w': pWidth,
                    'h': pHeight
                });
            }
        }
    }

    /** Redraw Functions */

    /**
     * Clears a given context
     * @param {Object} context - The context to clear
     */
    clear(context) {
        context.clearRect(0, 0, this.width, this.height);
    }

    /**
     * Clears a list of given partitions
     * @param {Object} context
     * @param {Object[]} partitions
     */
    clearPartitions(context, partitions) {
        for(var i = 0; i < partitions.length; i++) {
            var pa = partitions[i];
            context.clearRect(pa.x, pa.y, pa.w, pa.h);
        }
    }

    /**
     * Draws a canvas onto a given context
     * @param {Object} context - The context to draw onto
     * @param {Object} canvas - The canvas to draw
     */
    drawCanvas(context, source) {
        context.drawImage(source, 0, 0);
    }

    drawPartitions(context, canvas, partitions) {
        for(var i = 0; i < partitions.length; i++) {
            var p = partitions[i];
            context.drawImage(source,
                p.x, p.y, p.w, p.h,
                p.x, p.y, p.w, p.h);
        }
    }

    /** Import/Export Functions */

    /**
     * Saves canvas to disk
     */
    saveToDisk() {
        var data = this.toImage().src.replace('image/png','image/octet-stream');
        window.location.href = data;
    }

    /**
     * Saves canvas to localStorage
     */
    saveToLocalstorage() {
        localStorage.setItem('canvas-' + this.name, this.canvas.toDataURL());
    }

    /**
     * Returns an image element containing the canvas contents
     */
    toImage() {
        var image = new Image();
        image.src = this.canvas.toDataURL();
        return image;
    }

    /**
     * Loads a DataURL into the canvas at 0,0
     * @param {string} data - The DataUrl
     */
    loadDataURL(data) {
        var image = new Image();
        image.onload = (() => {
            this.ctx.drawImage(image, 0, 0);
            this.bCtx.drawImage(image, 0, 0);
        });
        image.src = data;
    }

    /**
     * Draws a blob onto the canvas
     * @param {object} blob - The blob to draw
     * @param {number} x - X coordinate to draw at
     * @param {number} y - Y coordinate to draw at
     */
    drawBlob(blob, x, y) {
        var reader = new FileReader();
        reader.onload = (() => {
            var img = new Image();
            img.src = reader.result;
            img.onload = (() => {
                this.ctx.drawImage(img, x, y);
                this.bCtx.drawImage(img, x, y);
            });
        });
        reader.readAsDataURL(blob);
    }

    /**
     * Loads a canvas from localstorage
     * @param {String} name - Name of the canvas
     */
    static loadFromLocalStorage(name) {
        /* Attempt to get the canvas from localstorage */
        if (localStorage.getItem('canvas-' + name)) {
            /* Load the B64 image from localstorage */
            var img = new Image;
            img.src = localStorage.getItem('canvas');

            /* Draw our image onto a canvas */
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            /* Create a new OICanvas with the loaded image */
            return new OICanvas(canvas, name);
        }
        return null;
    }

    /* Stroke Functions */
}

/**
 * Holds information about a given stroke, mainly the path and control points
 */
class OIStroke {
    constructor(tool, partitions) {
        this.tool = tool;
        this.path = [];
        this.controlPoints = [];
        this.partitions = partitions;
        this.changed = [];
    }

    /**
     * Adds a (x, y, p) point to the stroke
     * @param {Number} x - The x-coordinate
     * @param {Number} y - The y-coordinate
     * @param {Number} p - The pressure at the given point
     */
    addPoint(x, y, p) {
        this.path.push({
            'x': x,
            'y': y,
            'p': p
        });

        /**
         * Search for the partition that this point is in
         */
        for(var i = 0; i < this.partitions.length; i++) {
            var pX = this.partitions[i].x;
            var py = this.partitions[i].y;
            if(x > pX && y > pY
            && x < this.partitions[i].width * pX
            && y < this.partitions[i].height * pY) {
                this.changed.push(this.partitions[i]);
                break;
            }
        }

        /**
         * Adds control points based on the new point
         */
        if(this.path.length > 3) {
            var pLen = this.path.length - 1;
            this.controlPoints = this.controlPoints.concat(
                this.getControlPoints(
                        this.path[pLen - 3].x, this.path[pLen - 3].y,
                        this.path[pLen - 2].x, this.path[pLen - 2].y,
                        this.path[pLen - 1].x, this.path[pLen - 1].y,
                    .3)
                );
        }
    }

    /**
     * Adds an array of (x, y, p) points
     */
    addPoints(points) {
        for(var i = 0; i < points.length; i++) {
            this.addPoint(points[i].x, points[i].y, points[i].p);
        }
    }

    /**
     * Calculates control points
     */
    getControlPoints(x1, y1, x2, y2, x3, y3, scale) {
        /**
         * We first calculate the length of the straight lines from
         * p1 to p2 and p2 to p3.
         */
        var dist1 = Math.sqrt(Math.pow( x2 - x1, 2 ) + Math.pow( y2 - y1 , 2 ));
        var dist2 = Math.sqrt(Math.pow( x3 - x2, 2 ) + Math.pow( y3 - y2 , 2 ));

        /**
         * Using those, we figure out what percentage of
         * the given scale that will be used for each control point.
         */
        var scale1 = (scale * dist1) / (dist1 + dist2);
        var scale2 = scale - scale1;

        /**
         * We then create a right triangle,
         * using p1 and p3 as the two acute angles
         *
         * We then scale this triangle using scale1 and scale2, and use those
         * smaller triangles to branch out from p2 to get our two control points
         */
        var dx1 = x2 + scale1 * (x1 - x3);
        var dy1 = y2 + scale1 * (y1 - y3);

        var dx2 = x2 - scale2 * (x1 - x3);
        var dy2 = y2 - scale2 * (y1 - y3);

        return [dx1, dy1, dx2, dy2];
    }
}