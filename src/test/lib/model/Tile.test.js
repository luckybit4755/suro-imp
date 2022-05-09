import { Tile } from '../../../lib/model/Tile.js';

test( 'basic-tile', () => {
	const count = 5;
	const t1 = new Tile(0,0, count);
	
	//console.log( t1.toString() );
	expect( t1.toString() ).toEqual( '(0,0>01234)' );
	expect( t1.count ).toEqual( count );
	expect( t1.value ).toBeNull();
	expect( t1.count ).toEqual( t1.possibilities.size )

	t1.restrict( new Set([2,3]) );
	expect( t1.toString() ).toEqual( '(0,0>__23_)' );
	//console.log( t1.toString() );
	expect( t1.count ).toEqual( 2 );
	expect( t1.count ).toEqual( t1.possibilities.size )
	expect( t1.value ).toBeNull();

	t1.collapse( 2 )
	//console.log( t1.toString() );
	expect( t1.toString() ).toEqual( '(0,0>__2__)' );
	expect( t1.count ).toEqual( 1 );
	expect( t1.count ).toEqual( t1.possibilities.size )
	expect( t1.value ).toEqual( 2 );

	t1.set( new Set([1,4]) );
	//console.log( t1.toString() );
	expect( t1.toString() ).toEqual( '(0,0>_1__4)' );
	expect( t1.count ).toEqual( 2 );
	expect( t1.count ).toEqual( t1.possibilities.size );
	expect( t1.value ).toBeNull();

	const t2 = new Tile(0,1, count);
	//console.log( t2.toString() );
	t2.restrict( new Set([0,3]) );
	expect( t2.toString() ).toEqual( '(0,1>0__3_)' );
	expect( t2.count ).toEqual( 2 );
	expect( t2.count ).toEqual( t2.possibilities.size );

	const a = new Array();
	t1.cross( t2, (v,w)=>a.push(`${v},${w}`) );
	expect( a.length ).toEqual( 4 );
	expect( a.join( ', ' ) ).toEqual( '1,0, 1,3, 4,0, 4,3' );

	const b = new Array();
	t2.cross( t1, (v,w)=>b.push(`${v},${w}`) );
	expect( b.length ).toEqual( 4 );
	expect( b.join( ', ' ) ).toEqual( '0,1, 0,4, 3,1, 3,4' );

	const c = new Array();
	t1.cross( t1, (v,w)=>c.push(`${v},${w}`) );
	expect( c.length ).toEqual( 4 );
	expect( c.join( ', ' ) ).toEqual( '1,1, 1,4, 4,1, 4,4' );

	// verify there is no change

	expect( t1.toString() ).toEqual( '(0,0>_1__4)' );
	expect( t1.count ).toEqual( 2 );
	expect( t1.count ).toEqual( t1.possibilities.size );
	expect( t1.value ).toBeNull();

	expect( t2.toString() ).toEqual( '(0,1>0__3_)' );
	expect( t2.count ).toEqual( 2 );
	expect( t2.count ).toEqual( t2.possibilities.size );
});
