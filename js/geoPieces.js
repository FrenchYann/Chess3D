// ECMAScript 5 strict mode
/* jshint globalstrict: true*/
/* global THREE,console,BLACK,WHITE,WIREFRAME */
"use strict";
var pieceMaterial = [];
pieceMaterial[BLACK] = new THREE.MeshPhongMaterial({color:0x111111,specular:0xaaaaaa,shininess:30.0,wireframe:WIREFRAME});
pieceMaterial[WHITE] = new THREE.MeshPhongMaterial({color:0xdddddd,wireframe:WIREFRAME});
function createPawn(size,color) {
	var pawn = new THREE.Object3D();
	var baseHeight = size*0.1;
	var baseRadius = size*0.8;
	var base = new THREE.Mesh(
		new THREE.CylinderGeometry(baseRadius,baseRadius,baseHeight,32,1),pieceMaterial[color]);
	base.position.y = baseHeight/2;

	var bodyRadius = size*0.6;
	var body = new THREE.Mesh(
		new THREE.SphereGeometry(bodyRadius,32,16),pieceMaterial[color]);
	body.position.y = baseHeight + bodyRadius;

	var neckHeight = size;
	var neckRadius = bodyRadius*0.7;
	var neck = new THREE.Mesh(
		new THREE.CylinderGeometry(0,neckRadius,neckHeight,32,1),pieceMaterial[color]);
	neck.position.y = baseHeight + bodyRadius*2+neckHeight/2;

	var headRadius = size*0.2;
	var head = new THREE.Mesh(
		new THREE.SphereGeometry(headRadius,32,16),pieceMaterial[color]);
	head.position.y = baseHeight + bodyRadius*2 +neckHeight+headRadius/2;

	pawn.add(head);
	pawn.add(neck);
	pawn.add(body);
	pawn.add(base);
	pawn.name = "Pawn";
	return pawn;
}

function createRook(size,color) {
	var rook = new THREE.Object3D();
	var baseHeight = size*0.1;
	var baseRadius = size*0.8;
	var base = new THREE.Mesh(
		new THREE.CylinderGeometry(baseRadius,baseRadius,baseHeight,32,1),pieceMaterial[color]);
	base.position.y = baseHeight/2;
	var bodyRadius = size*0.4;
	var bodyHeight = size*1.6;
	var body = new THREE.Mesh(
		new THREE.CylinderGeometry(bodyRadius*1.2,bodyRadius,bodyHeight,32,16),pieceMaterial[color]);
	body.position.y = baseHeight + bodyHeight/2;

	var wedgeHeight = size*0.5;
	var wedgeRadius = bodyRadius * 1.5;
	var wedge = new THREE.Mesh(
		new THREE.CylinderGeometry(wedgeRadius,bodyRadius*1.2,wedgeHeight,32,1),pieceMaterial[color]);

	wedge.position.y = baseHeight + bodyHeight+wedgeHeight/2;

	var teethThickness = size*0.2;
	var teethHeight = wedgeHeight;
	var teethTilt = size*0.1;

	var obr = wedgeRadius;
	var ibr = wedgeRadius-teethThickness;
	var otr = obr-teethTilt;
	var itr = ibr-teethTilt;
	var teethCount = 6;
	var subdivision = Math.round(32/(teethCount*2));

	var teethGeo = new THREE.TubeGeometry(otr,obr,itr,ibr,teethHeight,subdivision,1,0,2*Math.PI/(teethCount*2));

	for (var i = 0; i < teethCount; i++) {
		var teeth = new THREE.Mesh(teethGeo,pieceMaterial[color]);
		teeth.position.y = baseHeight+bodyHeight+wedgeHeight+teethHeight/2;
		teeth.rotation.y = i*2*Math.PI/teethCount;
		rook.add(teeth);
	}

	rook.add(wedge);
	rook.add(body);
	rook.add(base);
	rook.name = "Rook";
	return rook;
}

function createKnight(size,color) {
	var knight = new THREE.Object3D();
	var baseHeight = size*0.1;
	var baseRadius = size*0.8;
	var base = new THREE.Mesh(
		new THREE.CylinderGeometry(baseRadius,baseRadius,baseHeight,32,1),pieceMaterial[color]);
	base.position.y = baseHeight/2;

	var bodyRadius = size*0.6;
	var body = new THREE.Mesh(
		new THREE.SphereGeometry(bodyRadius,32,16),pieceMaterial[color]);

	var neckHeight = size*1.2;
	var neckBottomRadius = bodyRadius*0.6;
	var neckTopRadius = bodyRadius*0.0;
	var _neck = new THREE.Mesh(
		new THREE.CylinderGeometry(neckTopRadius,neckBottomRadius,neckHeight,32,1),pieceMaterial[color]);
	_neck.position.y =  bodyRadius+neckHeight/2;
	var neck = new THREE.Object3D();
	neck.add(_neck);
	neck.rotation.z = -Math.PI/32;


	var head = new THREE.Object3D();

	var skullRadius = size*0.6;
	var skull = new THREE.Mesh(
		new THREE.SphereGeometry(skullRadius,32,16),pieceMaterial[color]);

	var faceHeight = size*1.0;
	var faceBottomRadius = skullRadius*0.8;
	var faceTopRadius = skullRadius*0.3;
	var face = new THREE.Mesh(
		new THREE.CylinderGeometry(faceTopRadius,faceBottomRadius,faceHeight,32,1),pieceMaterial[color]);
	face.rotation.z = Math.PI/16;
	face.position.y = skullRadius;

	var noseRadius = size*0.2;
	var nose = new THREE.Mesh(
		new THREE.SphereGeometry(noseRadius,32,16),pieceMaterial[color]);
	nose.position.y = skullRadius +faceHeight+noseRadius/2;

	head.add(skull);
	head.add(face);
	//head.add(nose);
	head.scale.z = 0.5;
	head.rotation.z = 5*Math.PI/8;
	head.position.y = bodyRadius+neckHeight;


	var horse = new THREE.Object3D();
	horse.add(body);
	horse.add(neck);
	horse.add(head);
	horse.rotation.z = -Math.PI/32;
	horse.rotation.y = (color == whiteMat) ? -Math.PI/2 : Math.PI/2;
	horse.position.y = baseHeight+bodyRadius;

	knight.add(horse);
	knight.add(base);
	knight.name = "Knight";
	return knight;
}

function createBishop(size,color) {
	var bishop = new THREE.Object3D();
	var baseHeight = size*0.1;
	var baseRadius = size*0.8;
	var base = new THREE.Mesh(
		new THREE.CylinderGeometry(baseRadius,baseRadius,baseHeight,32,1),pieceMaterial[color]);
	base.position.y = baseHeight/2;

	var bodyRadius = size*0.6;
	var body = new THREE.Mesh(
		new THREE.SphereGeometry(bodyRadius,32,16),pieceMaterial[color]);
	body.position.y = baseHeight + bodyRadius;

	var neckHeight = size*1.7;
	var neckBottomRadius = bodyRadius*0.3;
	var neckTopRadius = bodyRadius*0.05;
	var neck = new THREE.Mesh(
		new THREE.CylinderGeometry(neckTopRadius,neckBottomRadius,neckHeight,32,1),pieceMaterial[color]);
	neck.position.y = baseHeight + bodyRadius*2+neckHeight/2;

	var headRadius = size*0.2;
	var head = new THREE.Mesh(
		new THREE.SphereGeometry(headRadius,32,16),pieceMaterial[color]);
	head.scale.y = 1.5;
	head.position.y = baseHeight + bodyRadius*2 +neckHeight+headRadius/2;

	bishop.add(head);
	bishop.add(neck);
	bishop.add(body);
	bishop.add(base);
	bishop.name = "Bishop";
	return bishop;
}



function createQueen(size,color) {
	var queen = new THREE.Object3D();
	var baseHeight = size*0.1;
	var baseRadius = size*0.8;
	var base = new THREE.Mesh(
		new THREE.CylinderGeometry(baseRadius,baseRadius,baseHeight,32,1),pieceMaterial[color]);
	base.position.y = baseHeight/2;

	var bodyRadius = size*0.6;
	var body = new THREE.Mesh(
		new THREE.SphereGeometry(bodyRadius,32,16),pieceMaterial[color]);
	body.position.y = baseHeight + bodyRadius;

	var neckHeight = size*2.3;
	var neckBottomRadius = bodyRadius*0.3;
	var neckTopRadius = bodyRadius*0.05;
	var neck = new THREE.Mesh(
		new THREE.CylinderGeometry(neckTopRadius,neckBottomRadius,neckHeight,32,1),pieceMaterial[color]);
	neck.position.y = baseHeight + bodyRadius*2+neckHeight/2;

	var collarHeight = size* 0.1;
	var collarRadius = size* 0.4;
	var collar = new THREE.Mesh(
		new THREE.CylinderGeometry(collarRadius,collarRadius,collarHeight,32,1),pieceMaterial[color]);
	collar.position.y = baseHeight+bodyRadius*2+neckHeight - size*0.1;

	var headRadius = size*0.2;
	var head = new THREE.Mesh(
		new THREE.SphereGeometry(headRadius,32,16),pieceMaterial[color]);
	head.position.y = baseHeight + bodyRadius*2 +neckHeight+headRadius/2;

	queen.add(head);
	queen.add(collar);
	queen.add(neck);
	queen.add(body);
	queen.add(base);
	queen.name = "Queen";
	return queen;
}


function createKing(size,color) {
	var king = new THREE.Object3D();
	var baseHeight = size*0.1;
	var baseRadius = size*0.8;
	var base = new THREE.Mesh(
		new THREE.CylinderGeometry(baseRadius,baseRadius,baseHeight,32,1),pieceMaterial[color]);
	base.position.y = baseHeight/2;

	var bodyRadius = size*0.6;
	var body = new THREE.Mesh(
		new THREE.SphereGeometry(bodyRadius,32,16),pieceMaterial[color]);
	body.position.y = baseHeight + bodyRadius;

	var neckHeight = size*2.3;
	var neckBottomRadius = bodyRadius*0.15;
	var neckTopRadius = bodyRadius*0.2;
	var neck = new THREE.Mesh(
		new THREE.CylinderGeometry(neckTopRadius,neckBottomRadius,neckHeight,32,1),pieceMaterial[color]);
	neck.position.y = baseHeight + bodyRadius*2+neckHeight/2;

	var collarHeight = size* 0.4;
	var collarBottomRadius = size* 0.25;
	var collarTopRadius = size* 0.45;
	var collar = new THREE.Mesh(
		new THREE.CylinderGeometry(collarTopRadius,collarBottomRadius,collarHeight,32,1),pieceMaterial[color]);
	collar.position.y = baseHeight+bodyRadius*2+neckHeight - size*0.1;

	var cross = new THREE.Object3D();
	var crossThickness = size*0.2;
	var crossHeight = size*0.8;
	var crossGeo = new THREE.CubeGeometry(crossThickness,crossHeight,crossThickness);

	var hCross = new THREE.Mesh(crossGeo,pieceMaterial[color]);
	hCross.position.y = crossHeight/2;
	var vCross = new THREE.Mesh(crossGeo,pieceMaterial[color]);
	vCross.rotation.z = Math.PI/2;
	vCross.position.y = crossHeight/2;

	cross.add(hCross);
	cross.add(vCross);
	cross.position.y = baseHeight+bodyRadius*2 + neckHeight- size*0.1+collarHeight/2;



	king.add(cross);
	king.add(collar);
	king.add(neck);
	king.add(body);
	king.add(base);
	king.name = "King";
	return king;
}