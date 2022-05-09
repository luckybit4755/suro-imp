import { Smasher } from './Smasher';

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
};
