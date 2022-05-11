import { Smasher } from './Smasher.js';

import { createHash } from 'crypto';

export class Ruler {
	/**
	 *
	 * description is an array of objects with a property for n,s,e,w
	 * which are expected to match using the === operator
	 *
	 * the result is a set of north / east rules that can be used
	 * by Smasher
	 *
	 */
	static fromDescription( description ) {
		const rules = Smasher.blankRules( description.length );
		description.forEach( (c,i) => {
			description.forEach( (k,j) => {
				if ( c.e == k.w ) {
					rules.get( Smasher.DIRECTIONS.EAST ).get( i ).add( j );
				}
				if ( c.n == k.s ) {
					rules.get( Smasher.DIRECTIONS.NORTH ).get( i ).add( j );
				}
			})
		});
		return rules;
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
