/**
 *
 * Rules look like: [
 *	[ new Set([1,2]), new Set([2]), new Set([])  ],
 *	[ new Set([0]),   new Set([2]), new Set([1]) ]
 * ];
 *
 * And always with the positive directions for each dimension: up,
 * south, east
 *
 * Each dimension should have the same # of entries even if the set
 * is empty.
 *
 */
export class Rules {
	constructor( rules ) {
		this.rules = rules;
		this.size = rules.length;
		this.count = rules[ 0 ].length; // # of tiles...
		this.verify( this.count, this.rules );
		this._reverse();
	}

	can( t, n, dimension, reversed = false ) {
		return this.get( t, dimension, reversed ).has( n );
	}

	get( t, dimension, reversed = false ) {
		return reversed ? this.reverse[ dimension ][ t ] : this.rules[ dimension ][ t ];
	}

	allowed( tile, dimension, reversed ) {
		const allowed = new Set();
		for( const t of tile.possibilities ) {
			const one = this.get( t, dimension, reversed );
			for( const n of one ) {
				allowed.add( n );
				if ( allowed.size == this.count ) return allowed;
			}
		}
		return allowed;
	}

    everyDirection( cb ) {
        for ( let dimension = 0 ; dimension < this.size ; dimension++ ) {
            for ( let reversed = 0 ; reversed < 2 ; reversed++ ) {
                cb( dimension, reversed );
            }
        }
    }

	/////////////////////////////////////////////////////////////////////////////

	verify( count, rules ){ 
		const errors = rules.filter( rule => rule.length != count );
		if ( errors.length ) {
			throw new Error( `all rules should have ${count} entries: ${JSON.stringify( rules )}` );
		}
	}

	_reverse() {
		this.reverse = new Array( this.size )
			.fill( 0 )
			.map( _=> 
				new Array( this.count ).fill( 0 ).map( _ => new Set() )
			)
		;
		this.rules.forEach( (rule, direction) => {
			rule.forEach( (allowed, tile) => {
				for( const neighbor of allowed ) {
					this.reverse[ direction ][ neighbor ].add( tile );
				}
			});
		});
	}	
}
