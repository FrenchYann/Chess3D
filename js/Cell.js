// ECMAScript 5 strict mode
/* jshint globalstrict: true*/
/* global THREE,BOARD_SIZE, COLS,ROWS*/
"use strict";
(function () {
	var a = "a".charCodeAt(0);
	function Cell() {
		this.position = null;
		this.index    = null;
		this.x = null;
		this.y = null;
		var coordinates = null;
		if( arguments.length === 1) {

			if (typeof(arguments[0]) === "string" && arguments[0].match(/[a-h][1-8]/) ) {
				// position like "a1", "b4", "e7"
				this.position = arguments[0];
				coordinates = getCoordinatesFromPosition(
					this.position
				);
				this.x = coordinates.x;
				this.y = coordinates.y;
				this.index = this.x + this.y * COLS;
			} else if (arguments[0] >= 0 && arguments[0] < ROWS*COLS) {
				// array index
				this.index = arguments[0];
				coordinates = getCoordinatesFromIndex(
					this.index
				);
				this.x = coordinates.x;
				this.y = coordinates.y;
				this.position = getPositionFromCoordinates(
					this.x,this.y
				);
			}
		} else if(  arguments.length === 2 &&
					isValid(arguments[0],arguments[1]) ) {
			// x and y position (0-based
			this.x = arguments[0];
			this.y = arguments[1];
			this.index = this.x + this.y * COLS;
			this.position = getPositionFromCoordinates(
				this.x,this.y
			);
		} else {
			throw arguments[0];
		}
	}

	Cell.prototype.toString = function() {
		return this.position;
	};

	Cell.prototype.equals = function () {
		if(arguments.length === 1) {
			var cell = arguments[0];
			if(cell instanceof Cell) {
				// it's a Cell object
				return cell.position === this.position;
			} else {
				// it's a string position
				return cell === this.position;
			}
		} else if (arguments.length === 2) {
			// it's x,y coordinates
			return  this.x === arguments[0] &&
					this.y === arguments[1];
		}

	};

	Cell.prototype.getWorldPosition = function() {
		var cs = BOARD_SIZE / ROWS;
		var middle = (BOARD_SIZE-cs)/2;


		return new THREE.Vector3(
			this.x * cs - middle,
			0,
			(this.y * cs - middle)
		);
	};

	// private
	function getPositionFromCoordinates(x,y) {
		return String.fromCharCode(x+a)+(7-y+1);
	}

	function getCoordinatesFromPosition(position) {
		return {
			x: position.charCodeAt(0) - a,
			y: 7-(parseInt(position.charAt(1),10)-1)
		};
	}

	function getCoordinatesFromIndex(index) {
		return {
			x: index%COLS,
			y: Math.floor(index/COLS)  // have to flip y since 3D starts from bottom left
		};
	}

	function isValid() {
		if( arguments.length == 2) {
			var x = arguments[0];
			var y = arguments[1];

			return  x >= 0 && x < COLS &&
					y >= 0 && y < ROWS;
		}
		return false;
	}

	window.Cell = Cell;

})();
