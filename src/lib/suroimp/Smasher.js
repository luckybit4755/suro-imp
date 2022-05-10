import { Tile } from '../model/Tile.js';

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

	// definition should include 
	// rules: new Map().set( 'NORTH', new Map().set( 0, new Set([0,3,4,5]) );
	// for the DIRECTIONS NORTH and EAST key for each tile and set of allowed tiles
	constructor( rules, debug ) {
		this.rules = rules;
		this.debug = debug;

		for( const [direction,allowed] of rules.entries() ) {
			this[ direction ] = allowed; // idk if this is a good idea or a terrible idea
			this.count = allowed.size;
		}
	}

	createMap( r, c ) {
		const tiles = this.createTiles( r, c, this.count );
		const counts = new Map();
	
		tiles.forEach( row => row.forEach( cell => this.add( counts, cell ) ) );
	
		let broke = false;
		for ( let i = 0 ; i < r * c * 99 ; i++ ) {
			const pick = this.pickNext( counts );
		   	if ( !pick ) {
				broke = true;
				break;
			}
	
			const pickForTile = this.pickForTile( pick, tiles );

			this.remove( counts, pick.count, pick );
			pick.collapse( pickForTile );

			this.percolateOut( pick, tiles, counts );
		}
		if ( !broke ) console.log( 'did not break...' );
	
		return tiles;
	}
	
	pickNext( counts ) {
		if ( !counts.size ) return null; // all done!
		const fewest = Array.from( counts.keys() ).sort( (a,b)=>b-a).pop();
		const candidates = [...counts.get( fewest )];
		const index = Math.floor( candidates.length * Math.random() );
		const pick = candidates[ index ];
		return pick;
	}
	
	move( direction, tile, tiles ) {
		switch ( direction ) {
			case Smasher.DIRECTIONS.NORTH: return this.get( tiles, tile.row - 1, tile.col );
			case Smasher.DIRECTIONS.SOUTH: return this.get( tiles, tile.row + 1, tile.col );
			case Smasher.DIRECTIONS.EAST:  return this.get( tiles, tile.row, tile.col + 1 );
			case Smasher.DIRECTIONS.WEST:  return this.get( tiles, tile.row, tile.col - 1 );
		}
		throw new Error( `idk about ${direction}` );
	}
	
	// 0 = blank ; 1 = ┌ ; 2 =  ┐ ; 3 =  ┘ ; 4 = └
	pickForTile( tile, tiles ) {
		if ( this.debug ) {
			console.log( `picking for ${at}` );
		}
	
		let count = 0;
		const counts = new Map();

		for ( const [direction] of Object.entries( Smasher.DIRECTIONS ) ) {
			const neighbor = this.move( direction, tile, tiles );
			if ( !neighbor ) continue;
			count++;
	
			const allowed = this.allowedTiles( direction, tile, neighbor );
			Array.from( allowed ).forEach( t => 
				counts.set( t, 1 + ( counts.has( t ) ? counts.get( t ) : 0 ) )
			);
		}
	
		//console.log( count, 'and', counts );
		const possible = new Set();
		for ( const [t,n] of counts ) {
			if ( n == count ) possible.add( t );
		}
	
		const ugg = Array.from( possible );
		const index = Math.floor( ugg.length * Math.random() );
		const pick = ugg[ index ];
	
		const message = `picked ${tile.toString()} vs (${ugg.join(', ' )}) -> ${pick} `;
	
		if ( this.debug ) {
			console.log( message );
		}
		if ( undefined === pick ) {
			Smasher.printTiles( tiles );
			throw new Error( `you done goofed: ${message}` );
		}
	
		return pick;
	}
	
	get( tiles, r, c ) {
		return (
			( r < 0 || r >= tiles.length || c < 0 || c >= tiles[ 0 ].length )
			? null
			: tiles[ r ][ c ]
		);
	}
	
	
	can( direction, a, b ) {
		switch( direction ) {
			case Smasher.DIRECTIONS.NORTH: return this.NORTH.get( a ).has( b );
			case Smasher.DIRECTIONS.SOUTH: return this.can( Smasher.DIRECTIONS.NORTH, b, a );
			case Smasher.DIRECTIONS.EAST: return this.EAST.get( a ).has( b );
			case Smasher.DIRECTIONS.WEST: return this.can( Smasher.DIRECTIONS.EAST, b, a );
		}
	
		throw new Error( `unknow direction, magellan: ${direction}` );
	}
	
	// direction is from the tile to the neighbor...
	allowedTiles( direction, tile, neighbor ) {
		const allowed = new Set();
		if ( !tile || !neighbor ) return allowed;

		tile.cross( neighbor, (t,n) => {
			if ( this.can( direction, t, n ) ) {
				allowed.add( t );
			}
		});

		return allowed;
	}
	
	oppositeDirection( direction ) {
		switch ( direction ) {
			case Smasher.DIRECTIONS.NORTH: return Smasher.DIRECTIONS.SOUTH;
			case Smasher.DIRECTIONS.SOUTH: return Smasher.DIRECTIONS.NORTH;
			case Smasher.DIRECTIONS.EAST: return Smasher.DIRECTIONS.WEST;
			case Smasher.DIRECTIONS.WEST: return Smasher.DIRECTIONS.EAST;
		}
		throw new Error( `what direction is ${direction}???` );
	}
	
	percolateOut( tile, tiles, counts, depth = 0 ) {
		if ( depth > 333 ) {
			throw new Error( 'i give up' );
		}
		for ( const [direction] of Object.entries( Smasher.DIRECTIONS ) ) {
			const neighbor = this.move( direction, tile, tiles );
			if ( this.perker( tile, neighbor, direction, counts ) ) {
				this.percolateOut( neighbor, tiles, counts, depth + 1 );
			}
		}
	}
	
	perker( tile, neighbor, direction, counts = null ) {
		if ( !tile || !neighbor ) return false;
	
		const count = neighbor.count;
		const opposite = this.oppositeDirection( direction );
		const allowed = this.allowedTiles( opposite, neighbor, tile );


		if ( allowed.size == count ) {
			return false;
		}

		neighbor.restrict( allowed );	
		this.remove( counts, count, neighbor );
		this.add( counts, neighbor );
	
		return true;
	}
	
	createTiles( r, c, count ) {
		return new Array( r )
			.fill( 0 )
			.map( (_,rr) => new Array( c )
				.fill( 0 )
				.map( 
					(_,cc) => new Tile( rr, cc, count )
				)
			)
		;
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
		if ( !counts.has( oldCount ) ) {
			throw new Error( `there are no cells which had ${oldCount}` );
		}
		const cells = counts.get( oldCount );
		cells.delete( cell );
		if ( !cells.size ) {
			counts.delete( oldCount );
		}
	}
	
	/////////////////////////////////////////////////////////////////////////////

	static printTiles( tiles, cb = (t)=>t.toString() ) {
		console.log( tiles.map( row=>row.map( cb ).join( '' ) ).join( '\n' ) );
	}
}
