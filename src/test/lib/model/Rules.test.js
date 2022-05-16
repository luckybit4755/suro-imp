import { Ruler } from '../../../lib/suroimp/Ruler.js';
import { Rules } from '../../../lib/model/Rules.js';
import { Tile } from '../../../lib/model/Tile.js';

const OLD_DIRECTIONS = '>,NORTH,EAST,SOUTH,WEST'.split(',').map((v,i,a)=>i?a[0][v]=v:a[i]={})[0];
const NAMES = 'NORTH,SOUTH,EAST,WEST'.split(',');//Object.keys( OLD_DIRECTIONS );

const can = ( direction, a, b, old ) => {
	switch( direction ) {
		case OLD_DIRECTIONS.NORTH: return old.get( OLD_DIRECTIONS.NORTH ).get( a ).has( b );
		case OLD_DIRECTIONS.SOUTH: return can( OLD_DIRECTIONS.NORTH, b, a, old );
		case OLD_DIRECTIONS.EAST:  return old.get( OLD_DIRECTIONS.EAST ).get( a ).has( b );
		case OLD_DIRECTIONS.WEST:  return can( OLD_DIRECTIONS.EAST, b, a, old );
	}

	throw new Error( `unknown direction, magellan: ${direction}` );
}

const makeTile = ( chars, charset ) => {
	if ( 'string' === typeof( chars ) ) {
		chars = chars.split( '' );
	}

	const tile = new Tile( [0,0], charset.length );
	const set = new Set();

	chars.forEach( c => {
		let i = -1;
		charset.forEach( (v,t) => {
			if ( c === v.c ) {
				i = t;
			}
		});
		expect( i ).not.toBe( -1 );
		set.add( i );
	});

	tile.restrict( set );
	return tile;
};

const allowable = ( s0, s1, chars, charset, rules, expected ) => {
	let d = 0;

	s1 = s1 ? s1 : chars;

	const t0 = makeTile( s0, charset );
	const t1 = makeTile( s1, charset );

	rules.everyDirection( ( dimension, reversed ) => {
		const allowed = rules.allowed( t0, dimension, reversed );
		const result = makeTile( s1, charset );
		result.restrict( allowed );

		const brief = Array.from( result.possibilities ).map( i=>chars[i] ).join( '' );

		const direction = NAMES[ d++ ][ 0 ];
		console.log( `${s0} ${direction[0]} ${s1} -> ${brief}` );
	});
};

test( 'four-corner', () => {
	const charset = [
		  { c:'#', n:0, s:0, e:0, w:0 }
		, { c:'┌', n:0, s:1, e:1, w:0 }
		, { c:'─', n:0, s:0, e:1, w:1 }
		, { c:'┐', n:0, s:1, e:0, w:1 }
		, { c:'┘', n:1, s:0, e:0, w:1 }
		, { c:'└', n:1, s:0, e:1, w:0 }
		, { c:'│', n:1, s:1, e:0, w:0 }
	];

	const chars = charset.map( c => c.c );
    const rules = Ruler.fromDescription( charset, true, charset.map(c=>c.c) );

	allowable( '┌└', null,  chars, charset, rules, [] );
});
