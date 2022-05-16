import { Multidimensional } from '../../../lib/model/Multidimensional.js';

test('1d-test',() => {
	const shape = [3];
	const m = new Multidimensional( shape );
	expect( m.array.length ).toEqual( shape[0] );

	for ( let i = 0 ; i < m.shape[ 0 ] ; i++ ) {
		const expected = '' + i;
		expect( m.array[ i ] ).toEqual( expected );
		expect( m.get( i ) ).toEqual( expected );
	}
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
});

test('3d-test',() => {
	const shape = [5,4,3];
	const m = new Multidimensional( shape );
	expect( m.array.length ).toEqual( shape[ 0 ] );
	expect( m.array[0].length ).toEqual( shape[ 1 ] );
	expect( m.array[0][1].length ).toEqual( shape[ 2 ] );

	for ( let i = 0 ; i < m.shape[ 0 ] ; i++ ) {
		for ( let j = 0 ; j < m.shape[ 1 ] ; j++ ) {
			for ( let k = 0 ; k < m.shape[ 2 ] ; k++ ) {
				const expected = [i,j,k].join(',');
				expect( m.array[ i ][ j ][ k ] ).toEqual( expected );
				expect( m.get(  i, j, k ) ).toEqual( expected );
			}
		}
	}
});
