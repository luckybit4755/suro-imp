#!/usr/bin/env node 

import { Smasher, Ruler } from '../../src/lib/index.js';

class line_maze {
	constructor() {
	}

	main( args ) {
		const row = ( 1 <= args.length ) ? parseInt( args[ 0 ] ) : 4;//40;
		const col = ( 2 <= args.length ) ? parseInt( args[ 1 ] ) : 6;//120;

		this.charsetter([
			  { c:' ', n:0, s:0, e:0, w:0 }
			, { c:'┌', n:0, s:1, e:1, w:0 }
			, { c:'─', n:0, s:0, e:1, w:1 }
			, { c:'┐', n:0, s:1, e:0, w:1 }
			, { c:'┘', n:1, s:0, e:0, w:1 }
			, { c:'└', n:1, s:0, e:1, w:0 }
			, { c:'│', n:1, s:1, e:0, w:0 }
			//, { c:'┼', n:1, s:1, e:1, w:1 }
		],row,col);
	}

	charsetter( charset, rows = 40, columns = 120 ) {
		const rules = Ruler.fromDescription( charset );
		const settings = { characters: charset.map( a=>a.c ).join('') };
		const smasher = new Smasher( rules, settings );

		const tiles = smasher.createMap( [rows, columns] );
		Smasher.printTiles( tiles, t => charset[ t.value ].c );

		for ( let i = 0 ; i < 22 ; i++ ) {
			smasher.scroll( tiles, [1,0] );
			const lastRow = tiles.offset[0] + tiles.shape[0] - 1;
			const line = Array.from( { length: tiles.shape[1] }, (_,c) => tiles.gat( [lastRow, c] ) );
			console.log( line.map( t => charset[ t.value ].c ).join( '' ) + '<' );
		}

//		let next = smasher.createMap( [rows, columns] );



	}
};

new line_maze().main( process.argv.slice( 2 ) );
