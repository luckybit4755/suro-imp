const default_filler = (previous,position) => position.join( ',' );

/**
 *
 * TODO:
 * - make scrolling work...
 *
 */
class MultidimensionalIterator {
	constructor( multi, arr, depth = 0 ) {
		this.multi = multi;
		this.arr = arr;
		this.depth = depth;
		this.leaf = this.depth >= this.multi.shape.length - 1;
	}

	*[Symbol.iterator] () {
		// TODO: consider offset and shape... etc
		for ( let i = 0 ; i < this.arr.length ; i++ ) {
			const v = this.arr[ i ];
			const w = ( this.leaf
				? v 
				: new MultidimensionalIterator( this.multi, v, this.depth + 1 )
			);
			yield [w,i];
		}
	}
}

/**
 *
 * TODO:
 * - make scrolling work...
 *
 */
export class Multidimensional {
	constructor( shape, filler = default_filler, wrap = false ) {
		this.shape = shape;
		this.offset = shape.map( _=>0 );
		this.filler = filler;
		
		this.array = this.allocate( shape, filler );
	}

	allocate( shape, filler, position = [] ) {
		if ( shape.length ) {
			position = position.slice( 0 );
			position.push( null );
			return new Array( shape[ 0 ] ).fill( 0 ).map( (_,i)=> {
				position[ position.length -1 ] = i;
				return this.allocate( shape.slice( 1 ), filler, position.slice(0) ) 
			});
		} else {
			return filler( null, position );
		}
	}

	get() {
		return this.gat( Array.from( arguments ) );
	}

	/**
	 *
	 * ignoreOffset means the position is in the *actual* array bounds...
	 *
	 * TODO: use ignoreOffset
	 * TODO: bounds checks
	 *
	 */
	gat( position, ignoreOffset = false ) {
		let current = this.array;
		position = ignoreOffset ? position : this.relative( position );
		for ( let i = 0 ; i < position.length ; i++ ) {
			const p = position[ i ];

			// TODO: for ignoreOffset check relative differently with wrap and all that
			if ( p < 0 || p >= current.length ) return undefined;

			current = current[ p ];
		}
		return current;
	}

	set() {
		const value = arguments[ arguments.length - 1 ];
		const position = Array.from ( arguments ).slice( 0, -1 );
		return that.sat( position, value );
	}

	// TODO: use ignoreOffset
	// TODO: bounds checks
	sat( position, value, ignoreOffset = false ) {
		const last = position.length - 1;

		let current = this.array;
		for ( let i = 0 ; i < last ; i++ ) {
			current = current[ position[ i ] ];
		}
		current[ last ] = value;

		return this;
	}

	// TODO: implement !cardinalOnly 
	neighbors( position, ignoreOffset = false, cardinalOnly = true ) {
		const that = this;
		return {
			*[Symbol.iterator] () {
				const tmp = position.slice( 0 );
				for( let dimension = 0 ; dimension < position.length ; dimension++ ) {
					const p = position[ dimension ];

					for ( let offset = 1 ; offset >= -1 ; offset -= 2 ) {
						if ( 0 == offset ) continue;
						tmp[ dimension ] = p + offset;

						const neighbor = that.gat( tmp, ignoreOffset );
						if ( neighbor ) {
							yield [neighbor,dimension,offset<0,tmp.slice(0)];
						}
					}
					tmp[ dimension ] = p;
				}
			}
		}
	}

	*[Symbol.iterator] () {
		const m = new MultidimensionalIterator( this, this.array );
		for ( const [mi,i] of m ) {
			yield [mi,i];
		}
	}

	// visit all the nodes 
	all() {
		const that = this;
		return {
			*[Symbol.iterator] () {
				const position = that.shape.map( _=> 0 );
				while( position[ 0 ] < that.shape[ 0 ] ) {
					yield [ that.gat( position, true ), that.relative( position ), position ];

					for ( let i = that.shape.length - 1 ; i >= 0 ; i-- ) {
						position[ i ]++;
						if ( i && position[ i ] >= that.shape[ i ] ) {
							position[ i ] = 0;
						} else {
							break;
						}
					}
				}
			}
		};
	}

	// FIXME: almost certainly not right...
	relative( position ) {
		return position.map( (p,i) => p + this.offset[i] );
	}

	// FIXME: almost certainly not right...
	absolute( position ) {
		return position.map( (p,i) => p - this.offset[i] );
	}

	scroll( offset ) {
		this.offset.forEach( (p,i) => this.offset[ i ] = p + offset[ i ] );
		return this;
	}
};
