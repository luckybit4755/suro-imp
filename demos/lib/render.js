import { createCanvas, registerFont } from 'canvas';
import fs   from 'fs';
import path from 'path';

const FONT_PATH = '/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf';
const FONT_FAM  = 'DejaVuMono';

let fontLoaded = false;

const stripAnsi = s => s.replace( /\[[0-9;]*m/g, '' );

export function saveImage( tiles, cb, outPath, opts = {} ) {
	const {
		fontSize = 18,
		bg       = '#0d1117',
		fg       = '#c9d1d9',
		padding  = 14,
	} = opts;

	if ( !fontLoaded ) {
		registerFont( FONT_PATH, { family: FONT_FAM } );
		fontLoaded = true;
	}

	// measure a single cell
	const probe = createCanvas( 64, 64 );
	const pctx  = probe.getContext( '2d' );
	pctx.font   = `${fontSize}px ${FONT_FAM}`;
	const cellW = pctx.measureText( 'M' ).width;
	const cellH = fontSize * 1.3;

	const rows = tiles.shape[0];
	const cols = tiles.shape[1];

	const W = Math.ceil( cols * cellW ) + padding * 2;
	const H = Math.ceil( rows * cellH ) + padding * 2;

	const canvas = createCanvas( W, H );
	const ctx    = canvas.getContext( '2d' );

	ctx.fillStyle    = bg;
	ctx.fillRect( 0, 0, W, H );
	ctx.font         = `${fontSize}px ${FONT_FAM}`;
	ctx.textBaseline = 'top';
	ctx.fillStyle    = fg;

	let ri = 0;
	for ( const [row] of tiles ) {
		let ci = 0;
		for ( const [tile] of row ) {
			const ch = stripAnsi( cb( tile ) );
			ctx.fillText( ch, padding + ci * cellW, padding + ri * cellH );
			ci++;
		}
		ri++;
	}

	const ext = path.extname( outPath ).toLowerCase();
	const buf = ( ext === '.jpg' || ext === '.jpeg' )
		? canvas.toBuffer( 'image/jpeg', { quality: 0.92 } )
		: canvas.toBuffer( 'image/png' );

	fs.writeFileSync( outPath, buf );
	process.stderr.write( `→ ${outPath}\n` );
}

export function parseOut( args ) {
	const i = args.findIndex( a => a.startsWith( '--out=' ) );
	if ( i === -1 ) return { args, out: null };
	const out = args[i].replace( '--out=', '' );
	return { args: args.filter( (_, j) => j !== i ), out };
}
