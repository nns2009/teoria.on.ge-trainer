import { existsSync } from "https://deno.land/std/fs/mod.ts";
import { DOMParser, Element } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

const parser = new DOMParser();
export const parseHTML = (html: string) => parser.parseFromString(html, "text/html");

export function sleep(seconds: number) {
	return new Promise((accept, _reject) => setTimeout(accept, seconds * 1000));
}

export function randomBetween(a: number, b: number) {
	return a + Math.random() * (b - a);
}

const saver = (filename: string) => (object: any) => Deno.writeTextFileSync(filename, JSON.stringify(object, null, 4));
const loader = (filename: string) => () => JSON.parse(Deno.readTextFileSync(filename));

export const dataFilename = 'Database.json';
export const saveData = saver(dataFilename);
export const loadData = loader(dataFilename);
