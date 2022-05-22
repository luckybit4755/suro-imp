#!/usr/bin/env node 

import { Smasher, Ruler } from '../../src/lib/index.js';

class line_maze {
	constructor() {
	}

	main( args ) {
		const row = ( 1 <= args.length ) ? parseInt( args[ 0 ] ) : 40;
		const col = ( 2 <= args.length ) ? parseInt( args[ 1 ] ) : 120;

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
		const smasher = new Smasher( rules );
		const tiles = smasher.createMap( [rows, columns] );
		Smasher.printTiles( tiles, t => charset[ t.value ].c );
	}
};

new line_maze().main( process.argv.slice( 2 ) );
