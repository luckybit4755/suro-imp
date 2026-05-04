const default_filler = (previous,position) => position.join( ',' );

/**
 *
 * TODO:
 * - make scrolling work...
 *
 */
class FieldIterator {
	constructor( field, arr, depth = 0 ) {
		this.field = field;
		this.arr = arr;
		this.depth = depth;
		this.leaf = this.depth >= this.field.shape.length - 1;
	}

	*[Symbol.iterator] () {
		const offset = this.field.offset[ this.depth ];
		for ( let i = 0 ; i < this.arr.length ; i++ ) {
			const absolute = i + offset;
			let scrolled = ( absolute ) % this.arr.length;
			if ( scrolled < 0 ) scrolled += this.arr.length;

			const v = this.arr[ scrolled ];
			const w = ( this.leaf
				? v 
				: new FieldIterator( this.field, v, this.depth + 1 )
			);
			yield [w,absolute,scrolled];
		}
	}
}

/**
 *
 * TODO:
 * - make scrolling work...
 *
 */
export class Field {
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

		for ( let i = 0 ; i < position.length ; i++ ) {
			let p = position[ i ];

			if ( ignoreOffset ) {
				if ( p < 0 || p >= current.length ) return undefined;
			} else {
				const o = this.offset[ i ];
				if ( p < o || p >= o + this.shape[ i ] ) return undefined
				p = p % current.length;
				if ( p < 0 ) p += current.length;
			}
				
			current = current[ p ];
		}
		return current;
	}

	set() {
		const value = arguments[ arguments.length - 1 ];
		const position = Array.from ( arguments ).slice( 0, -1 );
		return this.sat( position, value );
	}

	sat( position, value, ignoreOffset = false ) {
		let current = this.array;
		for ( let i = 0 ; i < position.length ; i++ ) {
			let p = position[ i ];
			if ( ignoreOffset ) {
				if ( p < 0 || p >= current.length ) return this;
			} else {
				const o = this.offset[ i ];
				if ( p < o || p >= o + this.shape[ i ] ) return this;
				p = p % current.length;
				if ( p < 0 ) p += current.length;
			}

			if ( i == position.length - 1 ) {
				current[ p ] = value;
			} else {
				current = current[ p ];
			}
		}

		return this;
	}

	// TODO: implement !cardinalOnly 
	// unlike other operations, the "neighbor" position is typically "absolute" or not..
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
		const m = new FieldIterator( this, this.array );
		for ( const [mi,absolute,scrolled] of m ) {
			yield [mi,absolute,scrolled];
		}
	}

	// visit all the nodes in viewport order
	// for each raw array index r in dim d, the viewport position is:
	//   visual_i = (r - offset%shape + shape) % shape   (where in the visual scan this raw slot appears)
	//   viewport  = visual_i + offset
	// this matches what gat() computes: gat(viewport) → array[viewport % shape] = array[r]
	all() {
		const that = this;
		return {
			*[Symbol.iterator] () {
				const raw = that.shape.map( _=> 0 );
				while ( raw[ 0 ] < that.shape[ 0 ] ) {
					const position = raw.map( (r, d) => {
						const mod = ( ( that.offset[ d ] % that.shape[ d ] ) + that.shape[ d ] ) % that.shape[ d ];
						return ( r - mod + that.shape[ d ] ) % that.shape[ d ] + that.offset[ d ];
					} );
					yield [ that.gat( raw, true ), position, raw ];

					for ( let i = that.shape.length - 1 ; i >= 0 ; i-- ) {
						raw[ i ]++;
						if ( i && raw[ i ] >= that.shape[ i ] ) {
							raw[ i ] = 0;
						} else {
							break;
						}
					}
				}
			}
		};
	}

	relative( position ) {
		return position.map( (p,i) => p + this.offset[i] );
	}

	absolute( position ) {
		return position.map( (p,i) => p - this.offset[i] );
	}

	inbounds( position, offset = null ) {
		offset = offset ? offset : this.offset;

		let current = this.array;
		for ( let i = 0 ; i < position.length ; i++ ) {
			const p = position[ i ];
			const o = offset[ i ];
			const s = this.shape[ i ];
			if ( p < o || p >= o + s ) return false;
		}
		return true;
	}

	scroll( offset, iterator = false ) {
		const previous = iterator ? this.offset.slice( 0 ) : null;

		this.offset.forEach( (p,i) => this.offset[ i ] = p + offset[ i ] );

		if ( iterator ) {
			const that = this;
			return {
				*[Symbol.iterator] () {
					for ( const [cell,relative,absolute] of that.all() ) {
						const moveIntoView = !that.inbounds( relative, previous );// && that.inbounds( relative );
						yield[ cell,relative,absolute,moveIntoView ];
					}
				}
			}
		}
		return this;
	}
};
