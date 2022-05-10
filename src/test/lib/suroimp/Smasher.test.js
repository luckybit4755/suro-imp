import { Smasher } from '../../../lib/suroimp/Smasher.js';
import { Ruler } from '../../../lib/suroimp/Ruler.js';

test('ascii-topology-test',() => {
	const count = 6;
	const rules = Smasher.blankRules( count );

	const difference = 1;
	for ( let i = 0 ; i < count ; i++ ) {
		for ( let j = i ; j < i + ( 1 + difference ) && j < count ;j++ ) {
			for( const [direction, map] of rules.entries() ) {
				map.get( i ).add( j );
				map.get( j ).add( i );
			}
		}
	}

	const smasher = new Smasher( rules );
	const tiles = smasher.createMap( 40, 120 );

	// https://people.sc.fsu.edu/~jburkardt/data/ascii_art_grayscale/ascii_art_grayscale.html
	// http://paulbourke.net/dataformats/asciiart/
	const paulbourke = r( '@@@@@@@@@@@@%%%%%%%%#########********+++++++++=========--------:::::::::,,,,,,,,..................' );

	Smasher.printTiles( tiles, t => {
		const i = Math.floor( paulbourke.length * t.value / count );
		return paulbourke[ i ] || '@'; // FIXME: weird offset error here
	});

	verify( tiles, smasher );
});

test( 'corner-test', () => {
	const charset = [
		{ c:' ', n:0, s:0, e:0, w:0 },
		{ c:'┌', n:0, s:1, e:1, w:0 },
		{ c:'─', n:0, s:0, e:1, w:1 },
		{ c:'┐', n:0, s:1, e:0, w:1 },
		{ c:'┘', n:1, s:0, e:0, w:1 },
		{ c:'└', n:1, s:0, e:1, w:0 },
		{ c:'│', n:1, s:1, e:0, w:0 }
	];

	const rules = Ruler.fromDescription( charset );
	const smasher = new Smasher( rules );
	const tiles = smasher.createMap( 40, 120 );
	Smasher.printTiles( tiles, t => charset[ t.value ].c );
	verify( tiles, smasher );
});

const verify = ( tiles, smasher ) => {
	tiles.forEach( (row,r)=> {
		row.forEach( (tile,c)=> {
			expect( tile.row ).toEqual( r );
			expect( tile.col ).toEqual( c );
			expect( tile.value ).toBeGreaterThanOrEqual( 0 );
			expect( tile.value ).toBeLessThan( smasher.count );

			expect( tile.count ).toEqual( 1 );
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
		});
	});
};

const r = ( s ) => s.split( '' ).reverse();

