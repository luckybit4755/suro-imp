#!/usr/bin/env node

import { Smasher } from '../../src/lib/suroimp/Smasher.js';
import { Rules   } from '../../src/lib/model/Rules.js';
import { saveImage, parseOut } from '../lib/render.js';

const CHARSETS = {
	paulbourke: ' .:-=+*#%@'.split(''),
	blocks:     ' ░▒▓▉█'.split(''),
	unicode:    '    .......,,,,,,::::::::======□▢░▒***▪▤▥▧▨▦*▩#▣%■@▓█'.split(''),
};

class AsciiTopo {
	main( args ) {
		const { args: rest, out } = parseOut( args );
		const rows   = parseInt( rest[0] ) || 24;
		const cols   = parseInt( rest[1] ) || 80;
		const count  = parseInt( rest[2] ) || 10;
		const diff   = parseInt( rest[3] ) || 1; // max step between neighbors

		const key    = rest[4] || 'paulbourke';
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

		const cb = t => {
			const idx = Math.floor( chars.length * t.value / ( count - 1 ) );
			return chars[ Math.min( chars.length - 1, idx ) ];
		};
		if ( out ) saveImage( tiles, cb, out );
		else       Smasher.printTiles( tiles, cb );
	}
}

new AsciiTopo().main( process.argv.slice( 2 ) );
