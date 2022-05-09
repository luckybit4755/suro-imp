import { Smasher } from '../../../lib/suroimp/Smasher.js';

const r = ( s ) => s.split( '' ).reverse();


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

	// https://people.sc.fsu.edu/~jburkardt/data/ascii_art_grayscale/ascii_art_grayscale.html
	const gray = new Map()
		.set(  5, '.,=/X#' )
		.set(  8, ' .:-*#%@' )
		.set( 11, '.,:;-=+*#%@' )
		.set( 27, r( '###*********++++++++=========--------:::::::::....' ) ) // 6s at 20x60 ; 
		.set( 35, r( '$B8W#ohbpwZ0LJYzvnrf/(1}]-+<il;,^`.' ) ) // 13s at 20x60
		.set( 70, r( '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft//\|()1{}[]?-_+~<>i!lI;:,"^`\'. ' ) ) // 84s at 20x60
		

	// http://paulbourke.net/dataformats/asciiart/
	const bigPaul = r( '@@@@@@@@@@@@%%%%%%%%#########********+++++++++=========--------:::::::::,,,,,,,,..................' );

	const tiles = new Smasher( rules ).createMap( 60, 180 );

	let min = count;
	let max = 0;
	tiles.forEach( row=>row.forEach( t => {
		min = Math.min( min, t.value );
		max = Math.max( max, t.value );
	}));
	const diff = Math.max( 1, max - min );

	console.log( tiles.map( row=>row.map( t => {
		//const i = Math.floor( bigPaul.length * ( t.value - min ) / diff );
		const i = Math.floor( bigPaul.length * t.value / count );
		return bigPaul[ i ] || '@'; // weird... 
		return gray.get( count )[ t.value ] 
	}).join( '' ) ).join( '|\n' ) );
});
