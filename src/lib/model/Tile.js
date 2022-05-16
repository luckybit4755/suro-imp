/**
 *
 * A tile represents a set of possible values which can eventuall be
 * collapsed into a single actual value.
 *
 */
export class Tile {
	constructor( position, count ) {
		this.position = position;
		this.originalCount = count;
		this.key = position.join( ',' );
		this.reset();
	}

	reset() {
		this.possibilities = new Set( 
			new Array( this.originalCount ).fill(0).map((v,i)=>i) 
		);
		return this.updateCount();
	}

	updateCount() {
		this.count = this.possibilities.size;
		if ( 0 == this.count ) {
			throw new Error( 'tile imploded:' + this );
		}
		if ( 1 == this.count ) {
			// collapsed! how exciting!
			for ( const [v] of this.possibilities.entries() ) {
				this.value = v;
			}
		} else {
			this.value = null;
		}
		return this;
	}

	collapse( value ) {
		this.possibilities = new Set( [value] );
		return this.updateCount();
	}

	hasValue() {
		return null != this.value;
	}

	restrict( allowed ) {
		if ( this.originalCount == allowed.size ) return false;

		const possibilities = new Set();
		// update the possibilities
		for( const [v] of this.possibilities.entries() ) {
			if ( allowed.has( v ) ) {
				possibilities.add( v );
			}
		}

		const changed = this.possibilities.size != possibilities.size;
		this.possibilities = possibilities;
		this.updateCount();
		return changed;
	}

	set( possibilities ) {
		this.reset();
		return this.restrict( possibilities );
	}

	cross( that, cb ) {
		for( const [v] of this.possibilities.entries() ) {
			for( const [w] of that.possibilities.entries() ) {
				cb( v, w );
			}
		}
		return this;
	}

	couldBe( i ) {
		return this.possibilities.has( i );
	}

	toString( mapping = null ) {
		const v = ( this.hasValue() 
			? mapping ? mapping[ this.value ] : this.value 
			: '_'
		);
		return `(${this.key}#${this.count}>${this.possibilitiesToString(mapping)}<${v})`;
	}

	possibilitiesToString( mapping = null ) {
		return new Array( this.originalCount )
			.fill( '_' )
			.map( ( c, i ) => {
				const s = mapping ? mapping[ i ] : i;
				return this.couldBe( i ) ? s : this.cForI( i ) 
			})
			.join( this.originalCount < 11 ? '' : ',' );
	}

	cForI( i, c = '_' ) {
		return new Array(
			Math.floor( 1 + Math.log( Math.max( 1, i ) ) /Math.log( 10 ) )
		).fill( c )
	}
};
