import { Field } from '../../../lib/model/Field.js';

const all = ( field ) => {
	let expectedCount = field.shape.reduce( (s,v)=>s*v, 1 );
	let actualCount = 0;
	for ( const [cell,position] of field.all() ) {
		const gat = position.join( ',' );
		expect( gat ).toEqual( cell );
		actualCount++;
	}
	expect( actualCount ).toEqual( expectedCount );
};

test('1d-test',() => {
	const shape = [3];
	const field = new Field( shape );
	expect( field.array.length ).toEqual( shape[0] );

	for ( let i = 0 ; i < field.shape[ 0 ] ; i++ ) {
		const expected = '' + i;
		expect( field.array[ i ] ).toEqual( expected );
		expect( field.get( i ) ).toEqual( expected );
	}

	for ( const [cell,c] of field ) { // 3
		const expected = `${c}`;
		expect( expected ).toEqual( cell );
	}

	all( field );
});

test('2d-test',() => {
	const shape = [4,3];
	const field = new Field( shape );
	expect( field.array.length ).toEqual( shape[ 0 ] );
	expect( field.array[0].length ).toEqual( shape[ 1 ] );

	for ( let i = 0 ; i < field.shape[ 0 ] ; i++ ) {
		for ( let j = 0 ; j < field.shape[ 1 ] ; j++ ) {
			const expected = [i,j].join(',');
			expect( field.array[ i ][ j ] ).toEqual( expected );
			expect( field.get( i, j ) ).toEqual( expected );
		}
	}

	for ( const [row,r] of field ) { // 4
		for ( const [cell,c] of row ) { // 3
			const expected = `${r},${c}`;
			expect( expected ).toEqual( cell );
		}
	}

	all( field );
});

test('3d-test',() => {
	const shape = [5,4,3];
	const field = new Field( shape );
	expect( field.array.length ).toEqual( shape[ 0 ] );
	expect( field.array[0].length ).toEqual( shape[ 1 ] );
	expect( field.array[0][1].length ).toEqual( shape[ 2 ] );

	for ( let i = -1 ; i < field.shape[ 0 ] + 1 ; i++ ) {
		for ( let j = -1 ; j < field.shape[ 1 ] + 1 ; j++ ) {
			for ( let k = -1 ; k < field.shape[ 2 ] + 1 ; k++ ) {
				if ( i < 0 || j < 0 || k < 0 || i >= field.shape[ 0 ] || j >= field.shape[ 1 ] || k >= field.shape[ 2 ] ) {
					expect( field.get( i, j, k ) ).toEqual( undefined );
					continue;
				}

				const expected = [i,j,k].join(',');
				expect( field.array[ i ][ j ][ k ] ).toEqual( expected );
				expect( field.get(  i, j, k ) ).toEqual( expected );
			}
		}
	}

	for( const [level,l] of field ) { // 4
		for ( const [row,r] of level ) { // 3
			for ( const [cell,c] of row ) { // 2
				const expected = `${l},${r},${c}`;
				expect( expected ).toEqual( cell );
			}
		}
	}

	all( field );

	const neighbors = [
		'0 false 4,2,1 -> 4,2,1',
		'0 true 2,2,1 -> 2,2,1',
		'1 false 3,3,1 -> 3,3,1',
		'1 true 3,1,1 -> 3,1,1',
		'2 false 3,2,2 -> 3,2,2',
		'2 true 3,2,0 -> 3,2,0'
	];
	let index = 0;
	for ( const [neighbor,dimension,reversed,position] of field.neighbors( [3,2,1] ) ) {
		const actual = `${dimension} ${reversed} ${position} -> ${neighbor}`
		expect( actual ).toEqual( neighbors[ index++ ] );
	}
	expect( index ).toEqual( neighbors.length );
});

const copy = ( field ) => {
	const a = [];
	for ( const [row,r,i] of field ) {
		const b = [];
		a.push( b );
		for ( const [cell,c,j] of row ) { 
			b.push( `${cell}@[${r},${c}]` );
		}
	}
	a.toString = () => a.map( r => r.join( '  ' ) ).join( '\n' );
	return a;
}

test.only('scrolling-test',() => {
	const field = new Field( [5,5] );

	// bit dull this...
	expect( field.get( 0,0 ) ).toEqual( '0,0' ); 

	// now things get interesting...
	field.scroll( [1,2] ); // rows 1-5, cols: 2-7
	console.log( ''+ copy( field ) );

	// should be out of bounds now
	expect( field.get( 0,0 ) ).toEqual( undefined );
	expect( field.get( 6,2 ) ).toEqual( undefined );
	expect( field.get( 1,1 ) ).toEqual( undefined );
	expect( field.get( 1,9 ) ).toEqual( undefined );
	expect( field.get( 1,2 ) ).toEqual( '1,2' );

	field.scroll( [99,98] ); // rows 1-5, cols: 2-7
	expect( field.offset[ 0 ] ).toEqual( 100 );
	expect( field.offset[ 1 ] ).toEqual( 100 );
	console.log( ''+ copy( field ) );
	expect( field.get( 101, 101 ) ).toEqual( '1,1' );

	field.offset = [-33,-44];
	console.log( ''+ copy( field ) );
	expect( field.get( -99,-33 ) ).toEqual( undefined );
	expect( field.get( -34,-45 ) ).toEqual( undefined );
	expect( field.get( -29,-39 ) ).toEqual( undefined );
	expect( field.get( -28,-40 ) ).toEqual( undefined );
	expect( field.get( -33,-44 ) ).toEqual( '2,1' );
	expect( field.get( -30,-40 ) ).toEqual( '0,0' );


	/////////////////////////////////////////////////////////////////////////////

	// reset the offset and verify things look normal
	field.offset = [ 0, 0 ];

	for ( let i = 0 ; i < 6 ; i++ ) {
		for ( let j = 0 ; j < 6 ; j++ ) {
			const bounds = field.inbounds( [i, j] );
			const inBounds = ( i <5 && j <5 );
			try { 
				expect( bounds ).toEqual( inBounds );
			} catch ( e ) {
				throw new Error( `at ${i},${j}:` + e );
			}

			const gat = field.get( i, j );
			const gett = ( i > 4 || j > 4 ) ? undefined : `${i},${j}`;
			expect( gat ).toEqual( gett );
		}
	}

	// now scroll and change the cells that have "moved into view"

	for ( const [ cell,relative,absolute,scrolled ] of field.scroll( [1,1], true ) ) {
		if( scrolled ) {
			field.sat(relative,'>'+relative.join(''));
		}
	}

	console.log( ''+ copy( field ) );

	// verified the 0 row and column are no longer in view and that 
	// the modication are as expected

	for ( let i = 0 ; i < 6 ; i++ ) {
		for ( let j = 0 ; j < 6 ; j++ ) {
			const bounds = field.inbounds( [i, j] );
			const inBounds = ( i > 0 && j > 0 );
			try { 
				expect( bounds ).toEqual( inBounds );
			} catch ( e ) {
				throw new Error( `at ${i},${j}:` + e );
			}

			const gat = field.get( i, j );
			const gett = ( i < 1 || j < 1 ) ? undefined : (
				( i > 4 || j > 4 ) ? `>${i}${j}` : `${i},${j}`
			);
			expect( gat ).toEqual( gett );
		}
	}
});
