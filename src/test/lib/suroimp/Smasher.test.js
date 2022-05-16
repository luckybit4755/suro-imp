import { Smasher } from '../../../lib/suroimp/Smasher.js';
import { Ruler } from '../../../lib/suroimp/Ruler.js';
import { Rules } from '../../../lib/model/Rules.js';

const { createCanvas } = require('canvas')

const fs = require( 'fs' );

test('ascii-topology-test',() => {
	const count = 10;

	const rules = new Array( 2 ).fill( 0 ).map( _=> new Array( count ).fill( 0 ).map( _=> new Set() ) );
	const difference = 1;
	for ( let i = 0 ; i < count ; i++ ) {
		for ( let j = i ; j < i + ( 1 + difference ) && j < count ;j++ ) {
			rules.forEach( rule => {
				rule[ i ].add( j );
				rule[ j ].add( i );
			});
		}
	}

	const smasher = new Smasher( new Rules( rules ) );
	
	const r = 50;
	const c = 120

	const iv = (i) => 3 + ( i % 2 ? -1 : +1 );

	// example preseeding
	const tiles = smasher.createTiles( r, c, count );
	for ( let i = 0 ; i < r && i < c ; i++ ) {
		tiles[ i ][ i ].collapse( iv( i ) );
	}
	smasher.createMap( r, c, tiles ); // note the optionally preseeded the tiles 

	// https://people.sc.fsu.edu/~jburkardt/data/ascii_art_grayscale/ascii_art_grayscale.html
	const jburkardt = reverse( '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,"^`\'. ' ) // also paulbourke

	// http://paulbourke.net/dataformats/asciiart/
	const paulbourke = reverse( '@@@@@@@@@@@@%%%%%%%%#########********+++++++++=========--------:::::::::,,,,,,,,..................' );
	const pb2 = ' .:-=+*#%@';

	const u1 = ' ░▒▓▉█';
	const u2= reverse('█▉▊▓▋▒▌▍░▎▏');
	const u3 = '    .......,,,,,,::::::::======□▢░▒***▪▤▥▧▨▦*▩#▣%■@▓█';

	// change this 1 to a 0 to see the different gray ramps...
	[paulbourke,jburkardt,pb2,u2,u2,u3].forEach( (u,i)=> 1*i ||
		Smasher.printTiles( tiles, t => {
			const i = Math.floor( u.length * t.value / (count-1) );
			return u[ Math.min( u.length - 1, i  ) ] 
		})
	);

	// verify the pre-seeded values have not changed
	for ( let i = 0 ; i < r && i < c ; i++ ) {
		expect( tiles[ i ][ i ].value ).toEqual( iv( i ) );
	}

	verify( tiles, smasher );
});

test('image-test',()=>{
	const directory = 'test/output/smasher/image-test';
	if ( !fs.existsSync( directory ) ){
		fs.mkdirSync( directory, { recursive: true } );
	}

	// any smaller than this and the round corners don't match the
	// square ones... need a fuzzier matcher

	const size = 32; 

	const radius = size / 2;
	const canvas = createCanvas( size, size );
	const context = canvas.getContext( '2d' );

	const square = (x = 0, y =0 ,w = size, color = 'gray') => {
		context.fillStyle = context.strokeStyle = color;
		context.beginPath();
		context.rect( x, y, size, size );
		context.closePath();
		context.fill();
	};

	const get = () => context.getImageData( 0, 0, size, size );
	const eq = (a,b) => expect( a ).toEqual( b );

	// blank
	square();
	const blank = get();
	const blankEdges = Ruler.edgeLord( blank );
	eq( blankEdges.n, blankEdges.s );
	eq( blankEdges.w, blankEdges.e );
	eq( blankEdges.w, blankEdges.s );
	fs.writeFileSync( `${directory}/blank.jpg`, canvas.toBuffer('image/jpeg', { quality: 0.77 }) );

	const edges = new Array();

	const corners = new Array( 4 * 2 ).fill( 0 ).map( (_,i) => {
		let x, y;
		switch( i  % 4 ) {
			case 0: x = 0; y = 0; break;
			case 1: x = 1; y = 0; break;
			case 2: x = 1; y = 1; break;
			case 3: x = 0; y = 1; break;
		}

		square();
		context.fillStyle = '#988776';
		context.strokeStyle = 'black';

		context.beginPath();
		if ( i < 4 ) {
			context.arc( x * size, y * size, radius, 0, 2 * Math.PI );
		} else {
			context.rect( x * size - radius , y * size - radius , size, size );
		}
		context.closePath();
		context.fill();
		context.stroke();


		fs.writeFileSync( `${directory}/corner_${i}.jpg`, canvas.toBuffer('image/jpeg', { quality: 0.77 }) );

		const data = get();
		edges.push( Ruler.edgeLord( data ) );
		return data;
	});

	const imageData = [ blank, ...corners ];
	const rules = Ruler.fromImageData( imageData );
console.log( 'WTF', rules.everyDirection );
	const smasher = new Smasher( rules );

	const count = size;
	const tiles = smasher.createMap( count, count );

	const outputCanvas = createCanvas( count * size, count * size );
	const outputContext = outputCanvas.getContext( '2d' );

	const debug = !true;
	if ( debug ) {
		console.log( rules );
		console.log( smasher.newRules.rules );
		//console.log( edges[ 5-1 ].n, edges[ 4-1 ].s);
		//console.log( edges[ 5-1 ].n, edges[ 8-1 ].s);
	}

	tiles.forEach( (row,i) => row.forEach( (cell,j) => {
		const x = j * size;
		const y = i * size;
		outputContext.putImageData( imageData[ cell.value ], x, y )

		if ( !debug ) return;
		outputContext.strokeStyle = outputContext.fillStyle = 'black';
		outputContext.fillText( cell.value, x + 4, y + 8 );
		outputContext.beginPath();
		outputContext.rect( x, y, size,size);
		outputContext.closePath();
		outputContext.stroke();
	}));
	fs.writeFileSync( `${directory}/map.jpg`, outputCanvas.toBuffer('image/jpeg', { quality: 0.77 }) );

});


test( 'block-test', () => {
	// https://en.wikipedia.org/wiki/List_of_Unicode_characters#Block_Elements
	// oo = 0 ; #o = 1 ; o# = 2
	charsetter([
		  { c:' ', n:0, s:0, e:0, w:0 }
		, { c:'█', n:3, s:3, e:3, w:3 } // U+2588 Full block 
		, { c:'▖', n:0, s:1, e:0, w:2 } // U+2596 Quadrant lower left
		, { c:'▗', n:0, s:2, e:2, w:0 } // U+2597 Quadrant lower right
		, { c:'▘', n:1, s:0, e:0, w:1 } // U+2598 Quadrant upper left
		, { c:'▙', n:1, s:3, e:2, w:3 } // U+2599 Quadrant upper left and lower left and lower right
		, { c:'▛', n:3, s:1, e:1, w:3 } // U+259B Quadrant upper left and upper right and lower left
		, { c:'▜', n:3, s:2, e:3, w:1 } // U+259C Quadrant upper left and upper right and lower right
		, { c:'▝', n:2, s:0, e:1, w:0 } // U+259D Quadrant upper right
		, { c:'▟', n:2, s:3, e:3, w:2 } // U+259F Quadrant upper right and lower left and lower right
		, { c:'▌', n:1, s:1, e:0, w:3 } // U+258C Left half block
		, { c:'▐', n:2, s:2, e:3, w:0 } // U+2590 Right half block
		, { c:'▀', n:3, s:0, e:1, w:1 } // U+2580 Upper half block
		, { c:'▄', n:0, s:3, e:2, w:2 } // U+2584 Lower half block
	]);
});

test( 'corner-test', () => {
	// https://www.utf8-chartable.de/unicode-utf8-table.pl?start=9472
	// https://unicode-table.com/en/blocks/box-drawing/
	charsetter([
		  { c:' ', n:0, s:0, e:0, w:0 }
		, { c:'┌', n:0, s:1, e:1, w:0 }
		, { c:'─', n:0, s:0, e:1, w:1 }
		, { c:'┐', n:0, s:1, e:0, w:1 }
		, { c:'┘', n:1, s:0, e:0, w:1 }
		, { c:'└', n:1, s:0, e:1, w:0 }
		, { c:'│', n:1, s:1, e:0, w:0 }

/*
		, { c:' ', n:0, s:0, e:0, w:0 } // this greatly increases chance of fail w/o a fix (┼,etc)
		// produces too many short runs... need a "disallowed"
		// to remove them from the rules...
		, { c:'╵', n:1, s:0, e:0, w:0 }
		, { c:'╷', n:0, s:1, e:0, w:0 }
		, { c:'╶', n:0, s:0, e:1, w:0 }
		, { c:'╴', n:0, s:0, e:0, w:1 }
		//, { c:'┼', n:1, s:1, e:1, w:1 } // this monster takes over the board
*/

	]);
});


/////////////////////////////////////////////////////////////////////////////

const charsetter = ( charset, rows = 40, cols = 120 ) => {
	const rules = Ruler.fromDescription( charset );
	const smasher = new Smasher( rules );

	const tiles = smasher.createTiles( rows, cols );

	// draw a path

	let m = rows - 1;
	let r = Math.floor( rows * Math.random() );
	for ( let c = 0 ; c < cols; c++ ) {
		const t = tiles[ r ][ c ].collapse( 0 );
		if ( c && Math.random() < .5 ) {
			if ( !false ) {
				const change = Math.floor( rows * .33 * ( Math.random() - Math.random() ) );
				let f = r + change;
				if ( f < 0 || f > m ) f = r - change;
				for ( ; r != f ; r += Math.sign( f - r ) ) {
					tiles[ r ][ c ].collapse( 0 );
				}
			} else {
				if ( Math.random() < .5 ) r++; else r--;
				if ( r < 0 ) {r = 0;continue};
				if ( r > m ) {r = m;continue};
				//c--;
			}
		}
	}

	let error = null;
	try {
		smasher.createMap( rows, cols, tiles );
	} catch ( e ) {
		error = e;
	}

	// Smasher.printTiles( tiles, t => charset[ t.value ].c );
	Smasher.printTiles( tiles, t => t.hasValue() ? charset[ t.value ].c : ( t.count ? ascMe( '?', '37;2' ) : ascMe( '#', '31;41;1' ) ) );
	if ( error ) throw error;

	verify( tiles, smasher );
}

const ascMe = ( text, color = 31 ) => {
	return `\u001B[${color}m${text}\u001B[0m`;
}

/////////////////////////////////////////////////////////////////////////////

const verify = ( tiles, smasher ) => {
	tiles.forEach( (row,r)=> {
		row.forEach( (tile,c)=> {
			expect( tile.position[0] ).toEqual( r );
			expect( tile.position[1] ).toEqual( c );
			expect( tile.value ).toBeGreaterThanOrEqual( 0 );
			expect( tile.value ).toBeLessThan( smasher.count );

			expect( tile.count ).toEqual( 1 );
/* FIXME: directions are changing...
			for ( const [direction] of Object.entries( Smasher.DIRECTIONS ) ) {
				const neighbor = smasher.move( direction, tile, tiles );
				if ( neighbor ) {
					expect( neighbor.value ).toBeGreaterThanOrEqual( 0 );
					expect( neighbor.count ).toEqual( 1 );
					expect( neighbor.value ).toBeLessThan( smasher.count );

					smasher.can( direction, tile.value, neighbor.value );
					smasher.can( smasher.oppositeDirection( direction ), neighbor.value, tile.value );
					// TODO: verify the row,col values are right...
				} else {
					// TODO: verify it'd be out of bounds...
				}
			}
*/
		});
	});
};

const reverse = ( s ) => s.split( '' ).reverse();

