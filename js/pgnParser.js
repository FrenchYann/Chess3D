// ECMAScript 5 strict mode
/* jshint globalstrict: true*/
/* global WHITE,BLACK */
"use strict";
(function() {
	/*
		var WHITE = 1;
		var BLACK = 0;
	*/
	function Move(piece,color,from,to,promotion,result,str) {
		this.piece     = piece ? piece : "P";
		this.color     = color;
		this.from      = from;
		this.to        = to;
		this.promotion = promotion;
		this.result    = result;
		this.str       = str;
	}

	String.prototype.removeBrackets = function(open,close) {
		var count = 0;
		var newString = "";
		for (var i = 0; i < this.length; i++) {
			var c = this.charAt(i);
			if (c === open) {
				count++;
				continue;
			}
			if (c === close)  {
				count--;
				continue;
			}
			if (count === 0) {
				newString += c;
			}
		}
		return newString;
	};

	function parsePGN(pgn) {
		var moves = {};
		moves.fen = null;
		moves.sequence = [];
		moves.startColor = WHITE;

		var color = WHITE;

		//var re_fen = /[pnbrqkPNBRQK1-8]+(\/[pnbrqkPNBRQK1-8]+){7} +[wb] +([KQ]{1,2}|-) *([kq]{1,2}|-)( +(([a-h][1-8])|-))? +\d+ +\d+/
		var re_fen = /\[FEN *" *([pnbrqkPNBRQK1-8]+(?:\/[pnbrqkPNBRQK1-8]+){7} +([wb]) +(?:[KQ]{1,2}|-) *(?:[kq]{1,2}|-)(?: +(?:(?:[a-h][1-8])|-))? +\d+ +\d+) *" *\]/;
		var match = pgn.match(re_fen);
		if (match) {
			moves.fen = match[1];
			color = match[2] === "w" ? WHITE : BLACK;
			moves.startColor = color;
		}

		var cleanPGN = pgn
			.removeBrackets("[","]")		// removes metadata
			.removeBrackets("{","}")		// removes comments
			.removeBrackets("(",")")		// removes comments
			.replace(/\$\d+/g,'')			// removes this thing
			.replace(/\d+\.{1,3}/g,'')		// removes move numbers
			.replace(/\s+/g,' ')			// replaces multiple whitespaces by simple spaces
			.trim()							// removes front and back whitespaces
			.replace(/(0-1)$/g,'')			// result black won
			.replace(/(1-0)$/g,'')			// result white won
			.replace(/(1\/2-1\/2)$/g,'')	// result draw
			.replace(/(\*)$/g,'')			// result ongoing
			.trim()
			.split(' ');                    // split moves 

		// regex for basic moves
		//                     |pieces | |src col/row|  |dest col/row|  promo   |check|
		var re_pieceMove    =/^([NBRQK])?([a-h]?[1-8]?)?x?([a-h][1-8])(=[NBRQK])?([+#])?/;
		// regex for castling
		var re_castling = "(O-O(?:-O)?)([+#])?";
		var castling = {
			"O-O"  : {
				from:['e8','e1'],
				to:['g8','g1']
			},
			"O-O-O":  {
				from:['e8','e1'],
				to:['c8','c1']
			}
		};

		cleanPGN.forEach(function(move) {
			var info=[];

			info = move.match(re_pieceMove);
			if(info) {
				moves.sequence.push(new Move(
					info[1],
					color,
					info[2],
					info[3],
					info[4],
					info[5],
					move
				));
			}

			info = move.match(re_castling);
			if(info) {
				moves.sequence.push(new Move(
					"K",
					color,
					castling[info[1]].from[color],
					castling[info[1]].to[color],
					undefined,
					info[2],
					move
				));
			}
			color = 1-color;
		});

		return moves;
	}
	window.parsePGN = parsePGN;
})();