#!/usr/bin/env node

import { Smasher, Ruler } from '../../src/lib/index.js';
import { saveImage, parseOut } from '../lib/render.js';

class AsciiMaze {
	constructor() {
		// n/s/e/w values define which sides have a line-end — matching sides allow adjacency
		this.charset = [
			  { c:' ', n:0, s:0, e:0, w:0 }
			, { c:'┌', n:0, s:1, e:1, w:0 }
			, { c:'─', n:0, s:0, e:1, w:1 }
			, { c:'┐', n:0, s:1, e:0, w:1 }
			, { c:'┘', n:1, s:0, e:0, w:1 }
			, { c:'└', n:1, s:0, e:1, w:0 }
			, { c:'│', n:1, s:1, e:0, w:0 }
		];
	}

	main( args ) {
		const { args: rest, out } = parseOut( args );
		const rows = parseInt( rest[0] ) || 12;
		const cols = parseInt( rest[1] ) || 32;

		const rules   = Ruler.fromDescription( this.charset );
		const smasher = new Smasher( rules );
		const tiles   = smasher.createTiles( [rows, cols] );
		this.seedBorder( tiles, rows, cols );
		smasher.createMap( tiles.shape, tiles );

		const cb = t => this.charset[ t.value ].c;
		if ( out ) saveImage( tiles, cb, out );
		else       Smasher.printTiles( tiles, cb );
	}

	seedBorder( tiles, rows, cols ) {
		// charset indices: 0=space 1=┌ 2=─ 3=┐ 4=┘ 5=└ 6=│
		const [, TL, H, TR, BR, BL, V] = [0, 1, 2, 3, 4, 5, 6];

		tiles.get( 0,        0        ).collapse( TL );
		tiles.get( 0,        cols - 1 ).collapse( TR );
		tiles.get( rows - 1, cols - 1 ).collapse( BR );
		tiles.get( rows - 1, 0        ).collapse( BL );

		for ( let c = 1; c < cols - 1; c++ ) {
			tiles.get( 0,        c ).collapse( H );
			tiles.get( rows - 1, c ).collapse( H );
		}
		for ( let r = 1; r < rows - 1; r++ ) {
			tiles.get( r, 0        ).collapse( V );
			tiles.get( r, cols - 1 ).collapse( V );
		}
	}
}

new AsciiMaze().main( process.argv.slice( 2 ) );
