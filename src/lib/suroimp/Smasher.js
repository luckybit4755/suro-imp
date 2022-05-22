import { Tile } from '../model/Tile.js';
import { Rules } from '../model/Rules.js';
import { Field } from '../model/Field.js';

import { pino } from 'pino';
import { sprintf } from 'sprintf-js';

const DEFAULT_SMASHER_SETTINGS = {
	logging:false,
}

export class Smasher {
	constructor( rules, settings = {} ) {
		this.rules = rules;
		this.settings = { ...DEFAULT_SMASHER_SETTINGS, ...settings };

		this.count = rules.count;

		this.logger = pino({enabled:this.settings.logging}).child({ clash:this.constructor.name });
	}

	createMap( shape, tiles = null ) {
		const preSeeded = ( null != tiles );
		this.logger.info({ creatingMap:true, shape, preSeeded });

		if ( !preSeeded ) {
			tiles = this.createTiles( shape );
		} 
		
		const counts = this.createCounts( tiles );

		if ( preSeeded ) {
			this.preSeed( tiles, counts );
		}

		const max = shape.reduce( (a,b)=>a*b, 33 );
		let broke = false;
		for ( let i = 0 ; i < max ; i++ ) {
			if ( !this.iterate( tiles, counts ) ) {
				broke = true;
				break;
			}
		}
		if ( !broke ) console.log( 'did not break...' );
	
		this.logger.info({ createdMap:true, shape, preSeeded, broke });
		return tiles;
	}

	createTiles( shape, count = this.count ) {
		this.logger.info({ creatingTiles:true, shape, count });

		const tiles = new Field( shape, (previous,position) => {
			return new Tile( position, count );
		});

		this.logger.info({ createdTiles:true, shape, count });
		return tiles;
	}

	createCounts( tiles ) {
		const counts = new Map();
		for ( const [tile,position,absPos] of tiles.all() ) {
			this.add( counts, tile );
		}
		return counts;
	}

	// need to evaluate the tiles which have been collapsed
	preSeed( tiles, counts ) {
		this.logger.info({ preseeding:true });

		let seeded = 0;

		for ( const [tile,position,absPos] of tiles.all() ) {
			seeded++;
			this.propagate( tile, tiles, counts );
		}

		this.logger.info({ preseeded:seeded });
	}

	iterate( tiles, counts ) {
		const pick = this.pickNext( counts );
		if ( !pick ) return pick;

		const pickForTile = this.pickForTile( pick, tiles );

		this.remove( counts, pick.count, pick );
		pick.collapse( pickForTile );

		this.propagate( pick, tiles, counts );

		return pick;
	}
	
	pickNext( counts ) {
		if ( !counts.size ) return null; // all done!
		const fewest = Array.from( counts.keys() ).sort( (a,b)=>b-a).pop();
		const candidates = [...counts.get( fewest )];
		const index = Math.floor( candidates.length * this.random() );
		const pick = candidates[ index ];
		return pick;
	}

	pickForTile( tile, tiles ) {
		const p = tile.possibilities;
		const pick = Array.from( p )[ Math.floor( this.random() * p.size ) ];
		return pick;
	}

	propagate( tile, tiles, counts ) {
		const queue = [tile];
		let count = 0;

		while ( queue.length ) {
			count++;
			const tile = queue.shift();

			for ( const [neighbor,dimension,reversed,position] of tiles.neighbors( tile.position ) ) {
				const oldCount = neighbor.count;
				const allowed = this.rules.allowed( tile, dimension, reversed );

				if ( neighbor.restrict( allowed ) ) {
					queue.push( neighbor );
					this.remove( counts, oldCount, neighbor );
					this.add( counts, neighbor );
				} else {
					if ( oldCount !== neighbor.count ) throw new Error( `no way...` );
				}
			}
		}

		return count;
	}

	add( counts, cell ) {
		if ( 1 == cell.count ) return;

		const cells = counts.has( cell.count ) ? counts.get( cell.count ) : new Set();
		cells.add( cell );
		counts.set( cell.count, cells );
		this.logger.debug({ add:cell.count });
	}
	
	remove( counts, oldCount, cell ) {
		if ( 1 == oldCount ) return;
		if ( !counts.has( oldCount ) ) {
			throw new Error( `there are no cells which had ${oldCount}` );
		}
		const cells = counts.get( oldCount );
		cells.delete( cell );
		if ( !cells.size ) {
			counts.delete( oldCount );
		}
	}

	random() {
		return Math.random();
	}
	
	/////////////////////////////////////////////////////////////////////////////

	static printTiles( tiles, cb = (t)=>t.toString() ) {
		const theD = tiles.shape.length;
		if ( 2 != theD ) {
			throw new Error( `can only print 2d for now, not ${theD}` );
		}

		const lines = [];

		for ( const [row,r] of tiles ) {
			const line = [];
			for ( const [tile,c] of row ) {
				line.push( cb( tile ) );
			}
			lines.push( line.join( '' ) );
		}

		console.log( lines.join( '\n' ) );
	}

	static toJson( tiles ) {
		return JSON.stringify( tiles.array, Tile.replacer );
	}
}
