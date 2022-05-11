/**
 *
 * A tile represents a set of possible values which can eventuall be
 * collapsed into a single actual value.
 *
 */
export class Tile {
	constructor( row, col, count ) {
		this.row = row;
		this.col = col;
		this.originalCount = count;
		this.key = `${row},${col}`;
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
		const possibilities = new Set();
		// update the possibilities
		for( const [v] of this.possibilities.entries() ) {
			if ( allowed.has( v ) ) {
				possibilities.add( v );
			}
		}
		this.possibilities = possibilities;
		return this.updateCount();
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

	toString() {
		return `(${this.key}#${this.count}>${this.possibilitiesToString()}<${this.hasValue()?this.value:'_'})`;
	}

	possibilitiesToString() {
		return new Array( this.originalCount )
			.fill( '_' )
			.map( ( c, i ) => this.possibilities.has( i ) ? i : this.cForI( i ) )
			.join( this.originalCount < 11 ? '' : ',' );
	}

	cForI( i, c = '_' ) {
		return new Array(
			Math.floor( 1 + Math.log( Math.max( 1, i ) ) /Math.log( 10 ) )
		).fill( c )
	}


};
