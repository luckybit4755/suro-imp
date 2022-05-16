import { Tile } from '../model/Tile.js';
import { Rules } from '../model/Rules.js';

import { pino } from 'pino';
import { sprintf } from 'sprintf-js';

export class Smasher {
	static DIRECTIONS = '>,NORTH,EAST,SOUTH,WEST'.split(',').map((v,i,a)=>i?a[0][v]=v:a[i]={})[0];

	static blankRules( count = 0 ) {
		const rules = new Map()
			.set( Smasher.DIRECTIONS.NORTH, new Map() )
			.set( Smasher.DIRECTIONS.EAST, new Map() ) 
		;
		while ( count-- ) {
			for( const [direction, map] of rules.entries() ) {
				map.set( count, new Set() );
			}
		}
		return rules;
	}

	constructor( rules, limit = 1024, debug ) {
		this.logger = pino().child({ clash:this.constructor.name });

		this.rules = rules;
		this.count = rules.count;

		this.limit = limit;
		this.debug = debug;
	}

	createMap( r, c, tiles = null ) {
		const preSeeded = ( null != tiles );
		this.logger.info({ creatingMap:true, r, c, preSeeded });

		if ( !preSeeded ) {
			tiles = this.createTiles( r, c );
		} 
		
		const counts = this.createCounts( tiles );

		if ( preSeeded ) {
			this.preSeed( tiles, counts );
		}
	
		let broke = false;
		for ( let i = 0 ; i < r * c * 99 ; i++ ) {
			if ( !this.iterate( tiles, counts ) ) {
				broke = true;
				break;
			}
		}
		if ( !broke ) console.log( 'did not break...' );
	
		this.logger.info({ createdMap:true, r, c, preSeeded, broke });
		return tiles;
	}

	createTiles( r, c, count = this.count ) {
		this.logger.info({ creatingTiles:true, r, c, count });
		const tiles = new Array( r )
			.fill( 0 )
			.map( (_,rr) => new Array( c )
				.fill( 0 )
				.map( 
					(_,cc) => new Tile( [rr, cc], count )
				)
			)
		;
		this.logger.info({ createdTiles:true, r, c, count });
		return tiles;
	}

	createCounts( tiles ) {
		const counts = new Map();
		tiles.forEach( row => row.forEach( cell => this.add( counts, cell ) ) );
		return counts;
	}

	// need to evaluate the tiles which have been collapsed
	preSeed( tiles, counts ) {
		this.logger.info({ preseeding:true });

		let seeded = 0;

		tiles.forEach( row => { row
			.filter( cell => cell.hasValue() )
			.forEach( cell => {
				seeded++;
				this.propagate( cell, tiles, counts );
			})
		});

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
	
	move( dimension, reversed, tile, tiles ) {
		const diff = [0,0];
		diff[ dimension ] = reversed ? -1 : +1;

		const r = tile.position[0]+diff[0];
		const c = tile.position[1]+diff[1];
		const neighbor = this.get( tiles, r, c );

		return neighbor;
	}
	
	pickForTile( tile, tiles ) {
		const p = tile.possibilities;
		const pick = Array.from( p )[ Math.floor( this.random() * p.size ) ];
		return pick;
	}

	get( tiles, r, c ) {
		return (
			( r < 0 || r >= tiles.length || c < 0 || c >= tiles[ 0 ].length )
			? null
			: tiles[ r ][ c ]
		);
	}

	propagate( tile, tiles, counts ) {
		const queue = [tile];
		let count = 0;

		while ( queue.length ) {
			count++;
			const tile = queue.shift();


			this.rules.everyDirection( (dimension,reversed) => {
				const neighbor = this.move( dimension, reversed, tile, tiles );

				if ( !neighbor ) {
					return;
				}

				const oldCount = neighbor.count;
				const allowed = this.rules.allowed( tile, dimension, reversed );

				if ( neighbor.restrict( allowed ) ) {
					queue.push( neighbor );
					this.remove( counts, oldCount, neighbor );
					this.add( counts, neighbor );
				} else {
					if ( oldCount !== neighbor.count ) throw new Error( `no way...` );
				}
			});
		}

		return count;
	}

	add( counts, cell ) {
		if ( 1 == cell.count ) return;

		const cells = counts.has( cell.count ) ? counts.get( cell.count ) : new Set();
		cells.add( cell );
		counts.set( cell.count, cells );
		if( this.debug ) {
			console.log( 'add', cell.count );
		}
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
		console.log( tiles.map( row=>row.map( cb ).join( '' ) ).join( '\n' ) );
	}
}
