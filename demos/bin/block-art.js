#!/usr/bin/env node

import { Smasher, Ruler } from '../../src/lib/index.js';
import { saveImage, parseOut } from '../lib/render.js';

class BlockArt {
	constructor() {
		// https://en.wikipedia.org/wiki/List_of_Unicode_characters#Block_Elements
		this.charset = [
			  { c:' ', n:0, s:0, e:0, w:0 }
			, { c:'█', n:3, s:3, e:3, w:3 } // Full block
			, { c:'▖', n:0, s:1, e:0, w:2 } // Quadrant lower left
			, { c:'▗', n:0, s:2, e:2, w:0 } // Quadrant lower right
			, { c:'▘', n:1, s:0, e:0, w:1 } // Quadrant upper left
			, { c:'▙', n:1, s:3, e:2, w:3 } // Quadrant upper left + lower left + lower right
			, { c:'▛', n:3, s:1, e:1, w:3 } // Quadrant upper left + upper right + lower left
			, { c:'▜', n:3, s:2, e:3, w:1 } // Quadrant upper left + upper right + lower right
			, { c:'▝', n:2, s:0, e:1, w:0 } // Quadrant upper right
			, { c:'▟', n:2, s:3, e:3, w:2 } // Quadrant upper right + lower left + lower right
			, { c:'▌', n:1, s:1, e:0, w:3 } // Left half block
			, { c:'▐', n:2, s:2, e:3, w:0 } // Right half block
			, { c:'▀', n:3, s:0, e:1, w:1 } // Upper half block
			, { c:'▄', n:0, s:3, e:2, w:2 } // Lower half block
		];
	}

	main( args ) {
		const { args: rest, out } = parseOut( args );
		const rows = parseInt( rest[0] ) || 16;
		const cols = parseInt( rest[1] ) || 40;

		const rules   = Ruler.fromDescription( this.charset );
		const smasher = new Smasher( rules );
		const tiles   = smasher.createTiles( [ rows, cols ] );

		// wander a path of open space (index 0) across the field as a seed
		const max = rows - 1;
		let r = Math.floor( rows * Math.random() );
		for ( let c = 0; c < cols; c++ ) {
			tiles.get( r, c ).collapse( 0 );
			if ( c && Math.random() < 0.4 ) {
				const change = Math.floor( rows * 0.33 * ( Math.random() - Math.random() ) );
				let f = r + change;
				if ( f < 0 || f > max ) f = r - change;
				for ( ; r !== f; r += Math.sign( f - r ) ) tiles.get( r, c ).collapse( 0 );
			}
		}

		smasher.createMap( tiles.shape, tiles );

		const cb = t => t.hasValue() ? this.charset[ t.value ].c : '?';
		if ( out ) saveImage( tiles, cb, out );
		else       Smasher.printTiles( tiles, cb );
	}
}

new BlockArt().main( process.argv.slice( 2 ) );
