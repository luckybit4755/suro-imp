const default_filler = (previous,position) => position.join( ',' );


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
		let current = this.array;
		for ( let i = 0 ; i < arguments.length ; i++ ) {
			current = current[ arguments[ i ] ];
		}
		return current;
	}

	set() {
		let current = this.array;
		const last = arguments.length - 2;

		for ( let i = 0 ; i < last ; i++ ) {
			current = current[ arguments[ i ] ];
		}

		const value = arguments[ last + 1 ];
		current[ last ] = value;

		return this;
	}

	scroll( offset ) {
		// TODO: this:
		return this;
	}
};
