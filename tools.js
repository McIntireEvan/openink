"use strict";

/**
 * Holder class for tools that allows them to define custom events
 */
class OITool {
    constructor(name) {
        this.name = name;
        this.active = false;
    }

    addCallback(element, event, callback) {
        document.getElementById(element)
                .addEventListener(event, evt => {
                    if(this.active) { callback (evt) }
                });
    }
}

/**
 * Holder class for brushes that holds all the needed metadata
 */
class OIBrush extends OITool {
    constructor(name, size, operation, color) {
        super(name);
        this.size = size;
        this.opacity = 1;
        this.color = color;
        this.operation = operation;
    }
}