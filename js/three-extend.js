// ECMAScript 5 strict mode
/* jshint globalstrict: true*/
/* global SHADOW,onOBJLoaded,THREE,console,BLACK,WHITE,WIREFRAME */

/* 
 * few extension or modification to some three.js functionnality 
 * often to avoid some repetitive tasks
 */

"use strict";
(function () {
	var clone = THREE.Texture.prototype.clone;
	THREE.Texture.prototype.clone = function( texture ) {
		var newTexture = clone.call(this,texture);
		// The purpose of all this is to automagically switch this
		// property to true after cloning.
		// Since it originally doesn't do it by default
		newTexture.needsUpdate = true;
		return newTexture;
	};

	THREE.Texture.prototype.tile = function( factor ) {
		// because I do that a lot (:
		this.wrapS = this.wrapT = THREE.RepeatWrapping;
		this.repeat.set(factor,factor);
	};
})();