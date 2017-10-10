"use strict";

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
        this._isRedrawing = false;
    }
}

class OIStroke {

}