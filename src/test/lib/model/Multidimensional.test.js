import { Multidimensional } from '../../../lib/model/Multidimensional.js';

const all = ( m ) => {
	let expectedCount = m.shape.reduce( (s,v)=>s*v, 1 );
	let actualCount = 0;
	for ( const [cell,position] of m.all() ) {
		const gat = position.join( ',' );
		expect( gat ).toEqual( cell );
		actualCount++;
	}
	expect( actualCount ).toEqual( expectedCount );
};

test('1d-test',() => {
	const shape = [3];
	const m = new Multidimensional( shape );
	expect( m.array.length ).toEqual( shape[0] );

	for ( let i = 0 ; i < m.shape[ 0 ] ; i++ ) {
		const expected = '' + i;
		expect( m.array[ i ] ).toEqual( expected );
		expect( m.get( i ) ).toEqual( expected );
	}

	for ( const [cell,c] of m ) { // 3
		const expected = `${c}`;
		expect( expected ).toEqual( cell );
	}

	all( m );
});

test('2d-test',() => {
	const shape = [4,3];
	const m = new Multidimensional( shape );
	expect( m.array.length ).toEqual( shape[ 0 ] );
	expect( m.array[0].length ).toEqual( shape[ 1 ] );

	for ( let i = 0 ; i < m.shape[ 0 ] ; i++ ) {
		for ( let j = 0 ; j < m.shape[ 1 ] ; j++ ) {
			const expected = [i,j].join(',');
			expect( m.array[ i ][ j ] ).toEqual( expected );
			expect( m.get( i, j ) ).toEqual( expected );
		}
	}

	for ( const [row,r] of m ) { // 4
		for ( const [cell,c] of row ) { // 3
			const expected = `${r},${c}`;
			expect( expected ).toEqual( cell );
		}
	}

	all( m );
});

test('3d-test',() => {
	const shape = [5,4,3];
	const m = new Multidimensional( shape );
	expect( m.array.length ).toEqual( shape[ 0 ] );
	expect( m.array[0].length ).toEqual( shape[ 1 ] );
	expect( m.array[0][1].length ).toEqual( shape[ 2 ] );

	for ( let i = -1 ; i < m.shape[ 0 ] + 1 ; i++ ) {
		for ( let j = -1 ; j < m.shape[ 1 ] + 1 ; j++ ) {
			for ( let k = -1 ; k < m.shape[ 2 ] + 1 ; k++ ) {
				if ( i < 0 || j < 0 || k < 0 || i >= m.shape[ 0 ] || j >= m.shape[ 1 ] || k >= m.shape[ 2 ] ) {
					expect( m.get( i, j, k ) ).toEqual( undefined );
					continue;
				}

				const expected = [i,j,k].join(',');
				expect( m.array[ i ][ j ][ k ] ).toEqual( expected );
				expect( m.get(  i, j, k ) ).toEqual( expected );
			}
		}
	}

	for( const [level,l] of m ) { // 4
		for ( const [row,r] of level ) { // 3
			for ( const [cell,c] of row ) { // 2
				const expected = `${l},${r},${c}`;
				expect( expected ).toEqual( cell );
			}
		}
	}

	all( m );

	console.log(...m.neighbors( [3,2,1] ) );
	for ( const [neighbor,dimension,reversed,position] of m.neighbors( [3,2,1] ) ) {
		console.log( dimension, reversed, position, '->', neighbor );
	}
});
