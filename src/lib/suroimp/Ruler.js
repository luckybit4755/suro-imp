import { Rules } from '../model/Rules.js';

import { createHash } from 'crypto';

export class Ruler {
	static DIRECTIONS = '>ewsnud'.split('').map((v,i,a)=>i?a[0][v]=v:a[i]={})[0];

    static blankRules( count = 0 ) {
        const rules = new Map()
            .set( Ruler.DIRECTIONS.NORTH, new Map() )
            .set( Ruler.DIRECTIONS.EAST, new Map() )
        ;
        while ( count-- ) {
            for( const [direction, map] of rules.entries() ) {
                map.set( count, new Set() );
            }
        }
        return rules;
    }

	/**
	 *
	 * description is an array of objects with a property like n,s,e,w
	 * which are expected to match using the === operator
	 *
	 * +-----+--------------+------+
	 * | dim | directions   | keys |
	 * +-----+--------------+------+
	 * | 1d  | east, west   | e, w |
	 * | 2d  | south, north | s, n |
	 * | 3d  | up down      | u, d |
	 * +-----+--------------+------+
	 *
	 * returns an array of rules per dimension
	 * highest dimension first
	 *
	 */
	static fromDescription( description ) {
		const count = description.length;
		const directions = Object.keys( Ruler.DIRECTIONS );

		// bit hacky...
		const dimensions = directions.filter( 
			direction => direction in description[ 0 ]
		).length / 2;

		if ( dimensions != Math.floor( dimensions ) ) {
			throw new Error( 'fractal rules not currently supported' );
		}

		const rz = new Array( dimensions ).fill( 0 ).map( 
			_=> new Array( count ).fill( 0 ).map( _ => new Set() )
		);

		description.forEach( (c,i) => description.forEach( (k,j) => {
			for ( let dimension = 0 ; dimension < dimensions ; dimension++ ) {
				// eg: e,w
				const d1 = directions[ 2 * dimension + 0 ];
				const d2 = directions[ 2 * dimension + 1 ];
				// note: highest dimensions are first
				if( c[ d1 ] === k[ d2 ] ) {
					rz[ dimensions - dimension - 1 ][ i ].add( j );
				}
			}
		}));
		return new Rules( rz );
	}

	static fuzzer( v ) {
		return Math.floor( v / 10 );
	}

	/**
	 *
	 * data should be an array of imageData objects which all have
	 * the same dimensions
	 *
	 *
	 */
	static fromImageData( data , fuzzer = (v)=>Ruler.fuzzer(v) ) {
		return Ruler.fromDescription(
			data.map( imageData => Ruler.edgeLord( imageData ) )
		);
	}

	/**
	 *
	 * Even with the "fuzzer" this is still a bit too exact, but it
	 * is quick and easy
	 *
	 * sorry... couldn't resist the joke...
	 *
	 */
	static edgeLord( imageData, fuzzer = (v)=>Ruler.fuzzer(v) ) {
		const edges = Ruler.edging( imageData );
		return { 
			  n: Ruler.digest( edges.n.map( v => fuzzer( v ) ) )
			, s: Ruler.digest( edges.s.map( v => fuzzer( v ) ) )
			, e: Ruler.digest( edges.e.map( v => fuzzer( v ) ) )
			, w: Ruler.digest( edges.w.map( v => fuzzer( v ) ) )
		};
	}

	/**
	 *
	 * pull of the tiles along the edges of the pixel data
	 *
	 */
	static edging( imageData ) {
		const width = 4 * imageData.width;
		const max = width * imageData.height;
		const n = imageData.data.slice( 0, width );
		const s = imageData.data.slice( max - width, max );
		const e = new Array( 4 * imageData.height ).fill(0);
		const w = new Array( 4 * imageData.height ).fill(0);

		for ( let y = 0, index = 0, ei = 0, wi = 0 ; y < imageData.height ; y++, index += width ) {
			for ( let i = 0 ; i < 4 ; i++ ) {
				w[ wi++ ] = imageData.data[ index + i ];
				e[ ei++ ] = imageData.data[ index + i + width - 4 ];
			}
		}

		return {n:n,s:s,e:e,w:w};
	}

	static digest( value, hash = 'md5', output = 'hex' ) {
		if ( Array.isArray( value ) ) {
			value = Buffer.from( value );
		}
        return createHash( hash ).update( value ).digest( output )
    }
};
