// ECMAScript 5 strict mode
/* jshint globalstrict: true*/
/* global THREE, $, document, window,  console */
/* global onLoaded, LOADING_BAR_SCALE,ROWS,COLS,PIECE_SIZE, BOARD_SIZE, FLOOR_SIZE, WIREFRAME, DEBUG, Cell, WHITE, BLACK, FEEDBACK, SHADOW */
"use strict";

var geometries = {};
var textures   = {};


(function() {

	var $bar,$tips;
	var glow;

	function loadResources () {
		// counter
		var loaded = 0;
		// list of all mesh and texture
		var resources = [
			'3D/json/knight.json',
			'3D/json/king.json',
			'3D/json/queen.json',
			'3D/json/bishop.json',
			'3D/json/rook.json',
			'3D/json/pawn.json',
			'3D/json/board.json',
			'3D/json/innerBoard.json',
			'texture/wood-0.jpg',
			'texture/wood-1.jpg',
			'texture/wood_N.jpg',
			'texture/wood_S.jpg',
			'texture/knight-ao.jpg',
			'texture/rook-ao.jpg',
			'texture/king-ao.jpg',
			'texture/bishop-ao.jpg',
			'texture/queen-ao.jpg',
			'texture/pawn-ao.jpg',
			'texture/floor.jpg',
			'texture/floor_N.jpg',
			'texture/floor_S.jpg',
			'texture/fakeShadow.jpg'
		];

		// for loading mesh
		function loadJSON (url) {
			var loader = new THREE.JSONLoader();
			loader.load(url, function(geometry) {

				geometries[url] = geometry;

				loaded++;
				checkLoad();
			});
		}

		// for loading texture
		function loadImage(url) {
			THREE.ImageUtils.loadTexture(
				url,
				THREE.UVMapping(),
				function(texture) {
					textures[url] = texture;
					loaded++;
					checkLoad();
				}
			);
		}

		// load all the resources from the list
		resources.forEach(function(url) {
			switch ( url.split('.').pop() ) {
			case 'json' :
				loadJSON(url);
				break;
			case 'jpg' :
				loadImage(url);
				break;
			default:
				throw 'invalid resource';
			}
		});

		// control the progressBar
		// and fire the onLoaded call back on completion
		function checkLoad () {
			$bar.update(loaded/resources.length);
			if (loaded === resources.length) {
				setTimeout(onLoaded,0.1);
			}
		}

	}

	function initGlow() {
		// create and set the green glow in the background
		var size = window.innerWidth*LOADING_BAR_SCALE*1.8;
		glow = document.createElement('canvas');
		glow.width  = size;
		glow.height = size;
		document.body.appendChild(glow);
		var ctx = glow.getContext('2d');

		// make it oval
		glow.style.width = size + "px";
		glow.style.height = Math.round(size/2) + "px";


		var requestId;
		function animate() {
			var dt = getDelta();
			update(dt);
			requestId = window.requestAnimationFrame(animate);
		}

		function update(dt) {

			ctx.clearRect(0,0,size,size);

			// for the pulse effect
			var cycle = Math.cos(Date.now()/1000 * Math.PI);
			var maxRadius = size/2.5;

			function lerp(a,b,p) {
				return a + (b-a)*p;
			}

			var amplitude = maxRadius * 0.015;
			var sizeOffset = cycle*amplitude;
			var radius = maxRadius - amplitude + sizeOffset;
			var saturation = lerp(70,100,(cycle+1)/2);


			var grd = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, radius);
			// fake a non linear gradient
			grd.addColorStop(0,    'hsla(90,'+saturation+'%,50%,0.5)');
			grd.addColorStop(0.125,'hsla(90,'+saturation+'%,50%,0.3828125)');
			grd.addColorStop(0.25, 'hsla(90,'+saturation+'%,50%,0.28125)');
			grd.addColorStop(0.375,'hsla(90,'+saturation+'%,50%,0.1953125)');
			grd.addColorStop(0.5,  'hsla(90,'+saturation+'%,50%,0.125)');
			grd.addColorStop(0.75, 'hsla(90,'+saturation+'%,50%,0.03125)');
			grd.addColorStop(1,    'hsla(90,'+saturation+'%,50%,0.0)');

			// draw the gradient
			ctx.rect(0,0,size,size);
			ctx.fillStyle = grd;
			ctx.fill();
		}

		glow.remove = function() {
			window.cancelAnimationFrame(requestId);
			this.parentNode.removeChild(this);
		};

		var oldTime;
		function getDelta() {
			var now = Date.now();
			if (oldTime === undefined) {
				oldTime = now;
			}
			var delta = (now - oldTime)/1000;
			oldTime = now;
			return delta;
		}

		animate();
	}


	function initTips() {
		// list of tips
		var tips = [
			"Aggregating wood fibers",
			"Generating pieces census report",
			"Testing board resistance",
			"Generating Matrix 8x8",
			"Answering Queen's request",
			"Carving a princess for the knight",
			"Sanding the Bishop",
			"Enrolling Pawns",
			"Generating cheat sheet",
			"Mating the king",
			"Planting virtual trees",
			"Asking Deep Blue for advice",
			"Nominating Bishops",
			"Dubbing Knights",
			"Crowning the King",
			"Waxing chessboard",
			"Evaluating the idea of an hexagonal board, and rejecting it",
			"Gathering extra vertices (just in case)",
			"Trimming edges",
			"Intimidating opponent",
			"Learning the rules"
		];

		//jQuery object for tips
		$tips = $('<div>')
			.attr("id","tips")
			.css("color","white")
			.appendTo($('body'));

		// how often tips changes (in ms)
		var tipTiming = 5000;


		$tips.update = function() {
			var self = this;
			if( tips.length > 0 ) {
				var index = Math.floor(Math.random() * tips.length);

				var sentence = tips[index];
				tips.splice(index,1);
				$(this).text(sentence+"...");
			}
			this.timer = setTimeout(function(){self.update();},tipTiming);
		};

		// this little ugliness is just to clear the timer
		// automagically on .remove()
		var tipsRemove = $tips.remove;
		$tips.remove = function() {
			clearTimeout(this.timer);
			tipsRemove.call(this);
		};
		$tips.update();

	}

	function initBar() {
		// jQuery progress bar
		$bar = $('<div>')
			.attr("id","progressbar")
			.css("width",(LOADING_BAR_SCALE*100)+"%")
			.appendTo($('body'));

		// jQuery progress bar label
		var $label = $('<div>')
			.attr("id","progress-label")
			.appendTo($bar);

		// setting up the progressbar
		$bar.progressbar({
			value:false,
			change: function() {
				$label.text($bar.progressbar("value") + "%");
			}
		});

		// avoid rounded corners
		$bar.removeClass('ui-corner-all');
		$bar.children().removeClass('ui-corner-all');
		$bar.children().removeClass('ui-corner-left');


		// that's where the progression happens
		$bar.update = function(p) {
			p = Math.round(p*100);
			$bar.progressbar( "value", p );
			// somehow need to constantly remove it
			$bar.children().removeClass('ui-corner-right');
		};

		$bar.update(0);

	}

	function centering() {
		$bar.position({
			of:window,
			my:"center center",
			at:"center center"
		});
		$tips.position({
			of:$bar,
			my:"center bottom",
			at:"center top-10"
		});
		$(glow).position({
			of:window,
			my:"center center",
			at:"center center"
		});

		window.addEventListener('resize',centering );
	}

	function removeLoader() {
		$bar.remove();
		$tips.remove();
		glow.remove();
		window.removeEventListener('resize',centering );

	}

	window.onload = function () {
		// the page is loaded
		// start the resource loader
		initGlow();
		initTips();
		initBar();
		centering();

		loadResources();
		//$bar.update(1);
	};

	window.removeLoader = removeLoader;
})();