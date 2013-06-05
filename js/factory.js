// ECMAScript 5 strict mode
/* jshint globalstrict: true*/
/* global THREE, $, document, window, console */
/* global LOADING_BAR_SCALE,ROWS,COLS,PIECE_SIZE, BOARD_SIZE, FLOOR_SIZE, WIREFRAME, DEBUG, Cell, WHITE, BLACK, FEEDBACK, SHADOW */
/* global createCell */

/* 
 * initPieceFactory and initCellFactory need to be called after
 * all ressources are loaded (geometry and texture)
 *
 * they will create the createPiece and createCell function
 * and keep some texture/material objects in a closure to avoid
 * unnecessary cloning
 */

"use strict";
var geometries = {};
var textures = {};
function initPieceFactory () {

	// common textures
	var tiling = 4;
	var colors = [];
	for(var c = 0; c<2; c++) {
		colors[c] = textures['texture/wood-'+c+'.jpg'].clone();
		colors[c].tile(tiling);
	}
	var norm = textures['texture/wood_N.jpg'].clone();
	norm.tile(tiling);
	var spec = textures['texture/wood_S.jpg'].clone();
	spec.tile(tiling);

	function createPiece(name,color) {
		var size = BOARD_SIZE/COLS * PIECE_SIZE;
		// container for the piece and its reflexion
		var piece = new THREE.Object3D();
		// base material for all the piece (only lightmap changes)
		var material = new THREE.MeshPhongMaterial({
			color:0xffffff,
			specular:0xaaaaaa,
			shininess:60.0,
			map:colors[color],
			normalMap:norm,
			specularMap:spec,
			wireframe:WIREFRAME
		});
		material.normalScale.set(0.3,0.3);

		// urls of geometry and lightmap
		var urlJson = '3D/json/'+name+'.json';
		var urlAO   = 'texture/'+name+'-ao.jpg';

		var geo = geometries[urlJson];
		// no need to clone this texture
		// since its pretty specific
		var light = textures[urlAO];
		light.format = THREE.LuminanceFormat;

		material.lightMap = light;

		var mesh  = new THREE.Mesh(geo,material);
		if (SHADOW) {
			mesh.castShadow = true;
			mesh.receiveShadow = true;
		}
		mesh.scale.set(size,size,size);
		// we rotate pieces so they face each other (mostly relevant for knight)
		mesh.rotation.y += (color == WHITE) ? -Math.PI/2 : Math.PI/2;

		// we create the reflection
		// it's a cloned with a negative scale on the Y axis
		var reflexion = mesh.clone();
		reflexion.scale.y *= -1;
		reflexion.material = reflexion.material.clone();
		reflexion.material.side = THREE.BackSide;

		piece.add(mesh);
		piece.add(reflexion);

		piece.name = name;
		piece.color = color;

		return piece;
	}

	// make it global
	window.createPiece = createPiece;
}

function initCellFactory() {

	var materials = [];
	var tiling = 2;


	// common textures
	var diff;
	var norm = textures['texture/wood_N.jpg'].clone();
	norm.tile(tiling);
	var spec = textures['texture/wood_S.jpg'].clone();
	spec.tile(tiling);

	for(var c = 0; c<2; c++) {

		diff = textures['texture/wood-'+c+'.jpg'].clone();
		diff.tile(tiling);

		//common material
		materials[c] =  new THREE.MeshPhongMaterial({
			color:0xffffff,
			specular:[0xAAAAAA,0x444444][c],
			shininess:30.0,
			wireframe:WIREFRAME,
			transparent:true,
			map:diff,
			specularMap:spec,
			normalMap:norm,
			//blending: THREE.AdditiveBlending,
			opacity:0.5
		});
		//materials[c].normalScale.set(0.5,0.5);
	}

	function createCell(size,color) {
		// container for the cell and its reflexion
		var geo = new THREE.PlaneGeometry(size,size);

		// randomize uv offset to ad a bit of variety
		var randU = Math.random();
		var randV = Math.random();

		var uvs = geo.faceVertexUvs[0][0];
		for (var j = 0; j < uvs.length; j++) {
			uvs[j].x += randU;
			uvs[j].y += randV;
		}

		var cell = new THREE.Mesh(geo,materials[color]);

		if (SHADOW) {
			cell.receiveShadow = true;
		}

		// by default PlaneGeometry is vertical
		cell.rotation.x = -Math.PI/2;
		cell.color = color;
		return cell;
	}

	// make it global
	window.createCell = createCell;
}


function createChessBoard(size) {
	// contains everything that makes the board
	var lChessBoard = new THREE.Object3D();

	var cellSize = size/COLS;
	var square,cell;

	for(var i=0; i< ROWS*COLS; i++) {

		var col = i%COLS;
		var row = Math.floor(i/COLS);

		cell = new Cell(i);
		square = createCell(cellSize,1-(i+row)%2);
		square.position = cell.getWorldPosition();
		square.name = cell.position;

		lChessBoard.add(square);
	}

	// some fake inner environment color for reflexion
	var innerBoard = new THREE.Mesh (
		geometries['3D/json/innerBoard.json'],
		new THREE.MeshBasicMaterial({
			color:0x783e12
		})
	);
	innerBoard.scale.set(size,size,size);

	/// board borders
	var tiling = 6;
	var wood = textures['texture/wood-0.jpg'].clone();
	var spec = textures['texture/wood_S.jpg'].clone();
	var norm = textures['texture/wood_N.jpg'].clone();
	wood.tile(tiling);
	spec.tile(tiling);
	norm.tile(tiling);

	var geo = geometries['3D/json/board.json'];
	geo.computeBoundingBox();

	var board = new THREE.Mesh (
		geo,
		new THREE.MeshPhongMaterial({
			color:0xffffff,
			map:wood,
			specular: 0xffffff,
			specularMap: spec,
			normalMap: norm,
			shininess: 60,
			normalScale: new THREE.Vector2(0.2,0.2)
		})
	);
	var hCorrection = 0.62; // yeah I should just create a better geometry
	board.scale.set(size,size*hCorrection,size);
	lChessBoard.height = geo.boundingBox.min.y * board.scale.y;

	if (SHADOW) {
		board.receiveShadow = true;
		board.castShadow = true;
	}

	lChessBoard.add(innerBoard);
	lChessBoard.add(board);

	lChessBoard.name = "chessboard";
	return lChessBoard;
}

function createFloor(size,chessboardSize) {
	// The floor is a fake plane with a hole in it to allow
	// for the fake reflexion trick to work
	// so we build it vertices by vertices

	// material
	var tiling = 30*size/1000;
	var material = new THREE.MeshPhongMaterial({
		color:0xffffff,
		wireframe:WIREFRAME	,
		specular:0xaaaaaa,
		shininess:30

	});
	var diff  = textures['texture/floor.jpg'];
	var spec  = textures['texture/floor_S.jpg'];
	var norm  = textures['texture/floor_N.jpg'];
	var light = textures['texture/fakeShadow.jpg'];

	diff.tile(tiling);
	spec.tile(tiling);
	norm.tile(tiling);
	light.format = THREE.RGBFormat;

	material.map = diff;
	material.normalMap = norm;
	material.normalScale.set(0.6,0.6);
	material.specularMap = spec;
	material.lightMap = light;

	// geometry
	var halfBoard = chessboardSize/2;
	var halfSize  = size/2;

	var floorGeo = new THREE.Geometry();
	// outter vertices
	floorGeo.vertices.push(new THREE.Vector3(-halfSize,0,-halfSize));
	floorGeo.vertices.push(new THREE.Vector3( halfSize,0,-halfSize));
	floorGeo.vertices.push(new THREE.Vector3( halfSize,0, halfSize));
	floorGeo.vertices.push(new THREE.Vector3(-halfSize,0, halfSize));
	// hole vertices
	floorGeo.vertices.push(new THREE.Vector3(-halfBoard,0,-halfBoard));
	floorGeo.vertices.push(new THREE.Vector3( halfBoard,0,-halfBoard));
	floorGeo.vertices.push(new THREE.Vector3( halfBoard,0, halfBoard));
	floorGeo.vertices.push(new THREE.Vector3(-halfBoard,0, halfBoard));

	floorGeo.faceVertexUvs[ 0 ] = [];
	floorGeo.faceVertexUvs[ 1 ] = [];

    /*
     *        vertices         uvs-lightmap
     *      0-----------1     80-----------80   
     *      |\         /|      |\         /| 
     *      | \       / |      | \       / | 
     *      |  \     /  |      |  \     /  |
     *      |   4---5   |      |   0---0   |
     *      |   |   |   |      |   |   |   |
     *      |   7---6   |      |   0---0   |
     *      |  /     \  |      |  /     \  |
     *      | /       \ |      | /       \ |
     *      |/         \|      |/         \|
     *      3-----------2     80-----------80
     */

    // all normals just points upward
	var normal = new THREE.Vector3( 0, 1, 0 );

	// list of vertex index for each face
	var faces = [
		[0,4,5,1],
		[1,5,6,2],
		[2,6,7,3],
		[3,7,4,0]
	];

	faces.forEach( function(f) {
		var uvs1 = [];
		var uvs2 = [];
		var lightU,lightV;
		f.forEach(function(v,i) {
			// we linearily transform positions
			// from a -halfSize-halfSize space
			// to a 0-1 space
			uvs1.push(new THREE.Vector2(
				(floorGeo.vertices[v].x+halfSize)/size,
				(floorGeo.vertices[v].z+halfSize)/size
			));
			lightU = (v < 4) ? 80 : 0;
			lightV = (i < 2) ? 0 : 1;
			uvs2.push(new THREE.Vector2(lightU,lightV));
		});

		// we create a new face folowing the faces list
		var face = new THREE.Face4(
			f[0],f[1],f[2],f[3]
		);

		// and apply normals (without this, no proper lighting)
		face.normal.copy( normal );
		face.vertexNormals.push(
			normal.clone(),
			normal.clone(),
			normal.clone(),
			normal.clone()
		);

		// add the face to the geometry's faces list
		floorGeo.faces.push(face);

		// add uv coordinates to uv channels.
		floorGeo.faceVertexUvs[ 0 ].push(uvs1); // for diffuse/normal
		floorGeo.faceVertexUvs[ 1 ].push(uvs2); // for lightmap

	});

	// not sure it's needed but since it's in THREE.PlaneGeometry...
	floorGeo.computeCentroids();

	var floor = new THREE.Mesh(floorGeo,material);

	if(SHADOW) {
		floor.receiveShadow = true;
	}


	floor.name = "floor";
	return floor;
}

// special highlighting materials
var validCellMaterial = null;
function createValidCellMaterial () {
	validCellMaterial = [];
	var tiling = 2;


	// common textures
	var diff;
	var norm = textures['texture/wood_N.jpg'].clone();
	norm.tile(tiling);
	var spec = textures['texture/wood_S.jpg'].clone();
	spec.tile(tiling);

	for(var c = 0; c<2; c++) {

		diff = textures['texture/wood-1.jpg'].clone();
		diff.tile(tiling);

		//common material
		validCellMaterial[c] =  new THREE.MeshPhongMaterial({
			color:0x00ff00,
			specular:0x999999,
			shininess:60.0,
			wireframe:WIREFRAME,
			map:diff,
			specularMap:spec,
			normalMap:norm
		});
		//materials[c].normalScale.set(0.5,0.5);
	}
}

var selectedMaterial = null;
function createSelectedMaterial() {
	selectedMaterial = [];
	var tiling = 4;


	// common textures
	var diff;
	var norm = textures['texture/wood_N.jpg'].clone();
	norm.tile(tiling);
	var spec = textures['texture/wood_S.jpg'].clone();
	spec.tile(tiling);

	for(var c = 0; c<2; c++) {

		diff = textures['texture/wood-1.jpg'].clone();
		diff.tile(tiling);

		//common material
		selectedMaterial[c] =  new THREE.MeshPhongMaterial({
			color:0x00ff00,
			emissive:0x009900,
			specular:0x999999,
			shininess:60.0,
			wireframe:WIREFRAME,
			transparent:false,
			map:diff,
			specularMap:spec,
			normalMap:norm
			//opacity:0.4
		});
		selectedMaterial[c].normalScale.set(0.3,0.3);
	}

}