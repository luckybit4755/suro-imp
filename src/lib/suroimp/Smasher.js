import { Tile } from '../model/Tile.js';
import { Rules } from '../model/Rules.js';
import { Field } from '../model/Field.js';

import { pino } from 'pino';
import { sprintf } from 'sprintf-js';

const DEFAULT_SMASHER_SETTINGS = {
	logging:false,
	characters:null,
};

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

		const broke = this.iterations( tiles, counts );
		tiles.broke = broke
	
		this.logger.info({ createdMap:true, shape, preSeeded, broke });
		return tiles;
	}

	iterations( tiles, counts ) {
		const max = tiles.shape.reduce( (a,b)=>a*b, 33 );
		let broke = false;
		for ( let i = 0 ; i < max ; i++ ) {
			if ( !this.iterate( tiles, counts ) ) {
				broke = true;
				break;
			}
			counts = this.createCounts( tiles ); // valerie: idk...
		}
		if ( !broke ) console.log( 'did not break...' );
		return broke;
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

		const seeded = [];
		for ( const [tile,position,absPos] of tiles.all() ) {
			seeded.push( tile );
		}
		this.propagate( seeded, tiles, counts, true );

		this.logger.info({ preseeded:seeded.length });
	}

	iterate( tiles, counts ) {
		const pick = this.pickNext( counts );
		if (!pick || !pick.possibilities.size) return null; ///????? or pick

		const pickForTile = this.pickForTile( pick, tiles );

		this.remove( counts, pick.count, pick );
		pick.collapse( pickForTile );

		this.propagate( [pick], tiles, counts );

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

	propagate( queue, tiles, counts, preseeding = false ) {
		let count = 0;

		while ( queue.length ) {
			count++;
			const tile = queue.shift();

			for ( const [neighbor,dimension,reversed,position] of tiles.neighbors( tile.position ) ) {
				const oldCount = neighbor.count;
				if( 1 == oldCount && preseeding ) continue;

				const allowed = this.rules.allowed( tile, dimension, reversed );

				const b4 = this.tileToString( neighbor );
				let restricted = null;

				try {
					restricted = neighbor.restrict( allowed );
				} catch( e ) {
					const ts = this.tileToString( tile );
					const message = `${ts} imploded ${b4}: ${dimension}${reversed?'.reversed':''}`;
					// valerie: I no longer remember what this means or if we care...
					// this is very annnoying to look at.....
					// console.log( message );
					if ( neighbor.hasValue() ) {
						neighbor.collapse( neighbor.value );
						//	this.deleteThis()
						//console.log( `${ts} imploded ${b4} so... ` + this.tileToString( neighbor ) );
					}
					continue;
					throw new Error( message );
				}


				if ( restricted ) {
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

	tileToString( tile ) {
		return tile.toString( this.settings.characters );
	}

	scroll( tiles, offset ) {
		const theScrolled = new Set();
		for ( const [ tile, relative, absolute, scrolled ] of tiles.scroll( offset, true ) ) {
			tile.position = relative;
			if ( scrolled ) {
				tile.reset();
				theScrolled.add( tile );
			}
		}

		// seed propagation from the already-collapsed border neighbors
		const neighbors = new Set();
		for ( const tile of theScrolled ) {
			for ( const [neighbor] of tiles.neighbors( tile.position ) ) {
				if ( 1 == neighbor.count ) neighbors.add( neighbor );
			}
		}

		const counts = this.createCounts( tiles );
		this.propagate( Array.from( neighbors ), tiles, counts, true );
		this.iterations( tiles, counts );
		return tiles;
	}

	add( counts, tile ) {
		if ( 1 == tile.count ) return;
		if ( 0 == tile.count ) {
			throw new Error( 'invalid tile: ' + this.tileToString( tile ) );
		}


		const tiles = counts.has( tile.count ) ? counts.get( tile.count ) : new Set();
		tiles.add( tile );
		counts.set( tile.count, tiles );
		this.logger.debug({ add:tile.count });
	}
	
	remove( counts, oldCount, cell ) {
		//if ( 1 == oldCount ) return;
		if ( 1 >= oldCount ) return;
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
