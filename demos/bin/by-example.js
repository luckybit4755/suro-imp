#!/usr/bin/env node 

import { Smasher } from '../../src/lib/suroimp/Smasher.js';
import { Ruler }   from '../../src/lib/suroimp/Ruler.js';
import { Rules }   from '../../src/lib/model/Rules.js';

import * as fs from 'fs';

class bcrack {
	main(args) {
		let width = 80
		let height = 24
		let file = null

		for (const arg of args) {
			if (/^-w=/.test(arg)) width = parseInt(arg.replace(/.*=/,'')); else
			if (/^-h=/.test(arg)) height = parseInt(arg.replace(/.*=/,'')); else {
				if (/^-/.test(arg)) {
					file = null;
					break
				} else {
					if (file) {
						file = null;
						break
					} else {
						file = arg
					}
				}
			}
		}
		if (!file) {
			return console.log('usage: by-example [-w=width] [-h=height] <example.txt>')
		}
		const txt = fs.readFileSync(file).toString()
        const rules = Ruler.fromTextMap(txt)

        const smasher = new Smasher(rules);
        const map = smasher.createMap([height,width])
        Smasher.printTiles(map, (t)=> t.hasValue() ? rules.tiles[t.value] : '\u001B[41m?\u001B[0m')
	}
};

new bcrack().main(process.argv.slice(2));
