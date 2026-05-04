#!/usr/bin/env node

import { Smasher } from '../../src/lib/suroimp/Smasher.js';
import { Rules   } from '../../src/lib/model/Rules.js';

const CHARSETS = {
	paulbourke: ' .:-=+*#%@'.split(''),
	blocks:     ' ░▒▓▉█'.split(''),
	unicode:    '    .......,,,,,,::::::::======□▢░▒***▪▤▥▧▨▦*▩#▣%■@▓█'.split(''),
};

class AsciiTopo {
	main( args ) {
		const rows   = parseInt( args[0] ) || 24;
		const cols   = parseInt( args[1] ) || 80;
		const count  = parseInt( args[2] ) || 10;
		const diff   = parseInt( args[3] ) || 1; // max step between neighbors

		const key    = args[4] || 'paulbourke';
		const chars  = CHARSETS[ key ] || CHARSETS.paulbourke;

		// each value can neighbor values within `diff` steps
		const adj = Array.from( { length: count }, ( _, i ) => {
			const s = new Set();
			for ( let j = Math.max( 0, i - diff ); j <= Math.min( count - 1, i + diff ); j++ ) {
				s.add( j );
			}
			return s;
		});

		const rules   = new Rules( [ adj, adj ] );
		const smasher = new Smasher( rules );
		const tiles   = smasher.createTiles( [ rows, cols ] );

		// preseed diagonal with alternating mid-range values to seed a gradient
		const mid = Math.floor( count / 2 );
		for ( let i = 0; i < rows && i < cols; i++ ) {
			tiles.get( i, i ).collapse( mid + ( i % 2 ? -1 : 1 ) );
		}

		smasher.createMap( tiles.shape, tiles );

		Smasher.printTiles( tiles, t => {
			const idx = Math.floor( chars.length * t.value / ( count - 1 ) );
			return chars[ Math.min( chars.length - 1, idx ) ];
		});
	}
}

new AsciiTopo().main( process.argv.slice( 2 ) );
