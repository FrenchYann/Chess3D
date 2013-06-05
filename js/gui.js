
// ECMAScript 5 strict mode
/* jshint globalstrict: true*/
/* jslint newcap: true */
/* global THREE,  $, document, window, console */
/* global LOADING_BAR_SCALE,ROWS,COLS,PIECE_SIZE, BOARD_SIZE, FLOOR_SIZE, WIREFRAME, DEBUG, Cell, WHITE, BLACK, FEEDBACK, SHADOW */
/* global SearchAndRedraw, UIPlayMove, camera, levels, g_allMoves:true, promotion:true, g_backgroundEngine:true, validMoves, InitializeBackgroundEngine, EnsureAnalysisStopped, newGame, redrawBoard, parsePGN, g_playerWhite:true */
	/*global Search,FormatSquare,GenerateMove,MakeMove,GetMoveSAN,MakeSquare,UnmakeMove, FormatMove, ResetGame, GetFen, GetMoveFromString, alert, InitializeFromFen, GenerateValidMoves */
	/*global g_inCheck,g_board,g_pieceList, g_toMove, g_timeout:true,g_maxply:true */
	/*global moveflagCastleKing, moveflagCastleQueen, moveflagEPC, moveflagPromotion, colorWhite*/
	/*global moveflagPromoteQueen,moveflagPromoteRook,moveflagPromoteBishop,moveflagPromoteKnight*/
	/*global piecePawn, pieceKnight, pieceBishop, pieceRook, pieceQueen, pieceKing */
"use strict";
(function () {

	// jQuery pgn textarea
	var $pgn;
	// list of moves in pgn format
	var g_pgn = [];
	// jQuery check feedback
	var $info;

	function initInfo() {
		// create the DOM element
		// to display Chc
		$info = $("<div>")
			.css("position","absolute")
			.position({
				of:$("body"),
				my:"right top",
				at:"right top"
			})
			.attr("id","info")
			.appendTo($("body"))
			.css("left","auto")
			.css("right","0");
	}


	function initGUI() {
		var $gui = $("<div>")
			.css("position","absolute")
			.position({
				of:$("body"),
				my:"left top",
				at:"left top"
			})
			.width(150)
			.attr("id","gui");

		$("<p>")
			.text("menu")
			.appendTo($gui);

		var $menudiv = $("<div>").appendTo($gui);

		var $menu = $("<ul>").appendTo($menudiv);

		makeButton("NewGame",newGameDialog,$menu);
		makeButton("Undo",undo,$menu);
		makeButton("Load",loadDialog,$menu);
		makeButton("Save",save,$menu);

		$("<label>")
			.text("Promotion:")
			.append(
				$("<select>")
					.width(140)
					.append(
						$("<option>")
							.text("Queen"))
					.append(
						$("<option>")
							.text("Rook"))
					.append(
						$("<option>")
							.text("Bishop"))
					.append(
						$("<option>")
							.text("Knight"))
					.change( changePromo )
					.appendTo($menudiv)
			)
			.appendTo($menudiv);


		$pgn = $("<textarea>")
			.attr("cols","16")
			.attr("rows","10")
			.attr("readonly","readonly")
			.appendTo($menudiv);


		$("body").append($gui);

		$gui.accordion({
			header: "p",
			collapsible: true
		});
	}


	function makeButton(name,callback,parent) {
		var $item = $("<li>").appendTo(parent);
		return $("<button>")
			.button({
				label:name
			})
			.width(140)
			.click(callback)
			.appendTo($item);
	}

	function newGameDialog() {
		var id = "newgame";
		var dialogColor = WHITE;
		var dialogLevel = 0;

		if ($("#"+id).length !== 0) {
			return false;
		}

		var $newGame = $("<div>")
			.attr("id",id)
			.attr("title","New Game")
			.appendTo($("body"));

		// buttonset div
		var $radio = $("<p>").appendTo($newGame);
		// first button for white
		$('<input type="radio" id="white" name="color" checked="checked">')
			.click(function() {
				dialogColor = WHITE;
			})
			.appendTo($radio);
		$('<label for="white">White</label>').appendTo($radio);

		// second button for black
		$('<input type="radio" id="black" name="color"/>')
			.click(function() {
				dialogColor = BLACK;
			})
			.appendTo($radio);
		$('<label for="black">Black</label>').appendTo($radio);
		// initialize the buttonset
		$radio.buttonset();

		// level selector

		var $label = $("<label>")
			.text("AI Strength:");
		var $levelSelect = $('<select>')
			.css("display","block")
			.appendTo($label)
			.change(function(event) {
				dialogLevel = $(event.currentTarget).val();
			});
		$("<p>").append($label).appendTo($newGame);

		// add as much level configuration we have
		for (var i = 0; i < levels.length; i++) {
			$('<option>')
				.val(i)
				.text("level "+(i+1))
				.appendTo($levelSelect);
		}
		$newGame.dialog({
			close:function(event,ui) {
				$newGame.remove();
			},
			buttons: {
				"Start": function() {
					newGame(dialogColor,dialogLevel);
					$(this).remove();
				}
			}
		});
	}
	/*
	 * GAME CONTROL
	 */
	function newGame(color,level) {

		// change AI parameters according to level
		if (levels[level] !== undefined) {
			g_timeout = levels[level].timeout;
			g_maxply  = levels[level].maxply;
		}

		EnsureAnalysisStopped();
		ResetGame();
		if (InitializeBackgroundEngine()) {
			g_backgroundEngine.postMessage("go");
		}

		g_allMoves = [];
		clearPGN();

		redrawBoard();

		if (color === WHITE) {
			g_playerWhite = true;
			camera.position.x = 0;
			camera.position.z = 100; // camera on white side
		} else {
			g_playerWhite = false;
			SearchAndRedraw();
			camera.position.x = 0;
			camera.position.z = -100; // camera on black side
		}
	}


	function changeStartPlayer(event) {
		g_playerWhite = $(event.currentTarget).val() === "white";
		redrawBoard();
	}

	function undo() {
		if (g_allMoves.length === 0) {
			return;
		}

		if (g_backgroundEngine !== null) {
			g_backgroundEngine.terminate();
			g_backgroundEngine = null;
		}

		UnmakeMove(g_allMoves[g_allMoves.length - 1]);
		g_allMoves.pop();
		g_pgn.pop();
		g_pgn.pop();
		updatePGN();

		if (g_playerWhite !== Boolean(g_toMove) && g_allMoves.length !== 0) {
			UnmakeMove(g_allMoves[g_allMoves.length - 1]);
			g_allMoves.pop();
		}

		redrawBoard();
	}


	function loadDialog() {
		var id = "loadGame";
		if ($("#"+id).length !== 0) {
			return false;
		}

		var $loadGame = $("<div>")
			.attr("id",id)
			.attr("title","Load Game")
			.appendTo($("body"));

		$('<input>')
			.attr("type","file")
			.change(function(evt) {
				load(evt);
				$loadGame.remove();
			})
			.appendTo($loadGame);

		$loadGame
			.dialog({
				minWidth:420,
				close:function(event,ui) {
					$loadGame.remove();
				}
			});

	}

	function load(evt) {

		//Retrieve the first (and only!) File from the FileList object
		var file = evt.target.files[0];

		if (file) {
			var reader = new FileReader();
			reader.onload = function(e) {
				var contents = e.target.result;
				loadPGN(contents);
			};
			reader.readAsText(file);
		} else {
			console.log("Failed to load file");
		}

	}

	function loadFEN(fen) {
		g_allMoves = [];
		InitializeFromFen(fen);

		EnsureAnalysisStopped();
		InitializeBackgroundEngine();

		g_playerWhite = !!g_toMove;
		g_backgroundEngine.postMessage("position " + GetFen());

		redrawBoard();
	}

	function loadPGN (pgn) {
		var parsedPGN = parsePGN(pgn);
		var fen   = parsedPGN.fen;
		var moves = parsedPGN.sequence;

		g_allMoves = [];
		clearPGN();
		if (fen !== null) {
			loadFEN(fen);
			if (parsedPGN.startColor === BLACK) {
				g_pgn.push("..");
			}
		} else {
			ResetGame();
		}

		function Piece(flag,promo) {
			this.flag  = flag;
			this.promo = promo;
		}


		moves.forEach(function(move) {
			var i;
			var formatedMove;
			var vMoves = GenerateValidMoves();
			var pieces = {
				"P": new Piece(piecePawn,null),
				"N": new Piece(pieceKnight,moveflagPromoteKnight),
				"B": new Piece(pieceBishop,moveflagPromoteBishop),
				"R": new Piece(pieceRook,moveflagPromoteRook),
				"Q": new Piece(pieceQueen,moveflagPromoteQueen),
				"K": new Piece(pieceKing,null)
			};

			// get the piece flag
			var piece = pieces[move.piece].flag; // [P,N,B,R,Q,K]
			// ge the color flag
			var color = (move.color === WHITE) ? 0x8 : 0x0;

			// get the from value
			var startList = [];

			// get all square that has this kind of piece
			var pieceIdx = (color|piece) << 4;

			while(g_pieceList[pieceIdx] !== 0) {
				startList.push(new Cell(FormatSquare(g_pieceList[pieceIdx])));
				pieceIdx++;
			}

			var from = move.from;
			if (from !== undefined) {
				// if we have a precision on the starting square like the columns 
				// or even the position directly
				// We will filter the startList using it
				for (i = startList.length - 1; i >= 0; i--) {
					if( from.length === 1) {
						// only the row is given

						if (from.match(/[a-h]/) && startList[i].position.charAt(0) !== from) {
							// different starting row
							startList.splice(i,1);
						} else if (from.match(/[1-8]/) && startList[i].position.charAt(1) !== from) {
							// different starting line
							startList.splice(i,1);
						}
					} else if (from.length === 2) {
						// the starting coordinate is given
						// this is then just an extra check
						if (startList[i].position !== from) {
							// different starting coordinate
							startList.splice(i,1);
						}
					}
				}
			}

			// here we should have a list of starting square
			// only one should make a valid move 
			// paired with the provided destination

			var end   = new Cell(move.to);
			var endSquare   = MakeSquare(end.y, end.x);

			var promotion = (move.promotion) ? pieces[move.promotion.substr(1)].promo : undefined; // remove the "="


			// take formatedMove and endSquare in a closure
			function checkMove(start) {
				var startSquare = MakeSquare(start.y, start.x);
				if (promotion !== undefined) {
					// we have a promotion so we need to generate a 
					// specific move and check against it
					if(vMoves[i] === GenerateMove(startSquare, endSquare, moveflagPromotion | promotion)) {
						formatedMove = vMoves[i];
					}
				} else {
					// just checking start and end square allows to cover 
					// all other special moves like "en passant" capture and
					// castling
					if ( (vMoves[i] & 0xFF)       == startSquare &&
						((vMoves[i] >> 8) & 0xFF) == endSquare ) {
						formatedMove = vMoves[i];
					}
				}
			}

			// to get the move we will check withing all valide moves
			// which one match the hints given by the pgn

			for (i = 0; i < vMoves.length; i++) {
				startList.forEach(checkMove);
				if (formatedMove) break;
			}

			if(formatedMove) {
				UIPlayMove(formatedMove,false);
			} else {
				console.log(move);
				throw "Invalid PGN";
			}
		});

		if (g_toMove === colorWhite) {
			g_playerWhite = true;
			camera.position.x = 0;
			camera.position.z = 100;
		} else {
			g_playerWhite = false;
			camera.position.x = 0;
			camera.position.z = -100;
		}

		EnsureAnalysisStopped();
		if (InitializeBackgroundEngine()) {
			g_backgroundEngine.postMessage("position " + GetFen());
		}

		redrawBoard();
	}

	function clearPGN () {
		$pgn.val("");
		g_pgn = [];
	}

	function addToPGN(move) {
		g_pgn.push(GetMoveSAN(move));
		updatePGN();
	}

	function updatePGN() {

		$pgn.val(getPGN());
		$pgn.scrollTop($pgn[0].scrollHeight);
	}

	function getPGN() {
		var str = "";
		g_pgn.forEach(function(move,i) {
			if(i%2 === 0) {
				if (move === "..") {
					str += ((i/2)+1)+"...";
				} else {
					str += ((i/2)+1)+". "+move;
				}
			} else {
				str += " "+move+"\r\n";
			}
		});
		return str;
	}



	function save() {
		var filename = "chessSave.pgn";
		var a = document.createElement("a");

		if (typeof a.download === "undefined")
		{
			var str = 'data:text/html,' + encodeURIComponent("<p><a download='" + filename + "' href=\"data:application/json," +
				encodeURIComponent(getPGN()) +
				"\">Download link</a></p>");
			window.open(str);
		} else {
			// auto download
			var body = document.body;
			a.textContent = filename;
			a.href = "data:application/json," + encodeURIComponent(getPGN());
			a.download = filename;
			body.appendChild(a);
			var clickEvent = document.createEvent("MouseEvent");
			clickEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			a.dispatchEvent(clickEvent);
			body.removeChild(a);
		}

	}

	function changePromo(event) {
		var choice = $(event.currentTarget).val();
		switch(choice) {
		case "Queen":
			promotion = moveflagPromoteQueen;
			break;
		case "Rook":
			promotion = moveflagPromoteRook;
			break;
		case "Bishop":
			promotion = moveflagPromoteBishop;
			break;
		case "Knight":
			promotion = moveflagPromoteKnight;
			break;
		}
	}

	function displayCheck() {
		if (validMoves.length === 0) {
			$info.text(( g_inCheck ? 'Checkmate' : 'Stalemate' ));
		} else if (g_inCheck) {
			$info.text('Check');
		} else {
			$info.text('');
		}
		if ($info.text() !== '') {
			$info.show("highlight",{},500);
		} else {
			$info.hide();
		}
	}

	window.initGUI  = initGUI;
	window.initInfo = initInfo;
	window.clearPGN = clearPGN;
	window.addToPGN = addToPGN;
	window.displayCheck = displayCheck;
	window.newGame = newGame;

})();