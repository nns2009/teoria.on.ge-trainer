import { existsSync } from "https://deno.land/std/fs/mod.ts";
import { DOMParser, Element } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

import {
	parseHTML, sleep, randomBetween,
	saveData, loadData, dataFilename
} from './Common.ts';

const questionsUrl = (page: number) => `http://teoria.on.ge/tickets/2?page=${page}`;

async function fetchPageQuestions(pageIndex: number) {	
	const response = await fetch(questionsUrl(pageIndex), {
		"headers": {
			"accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
			"accept-language": "en-US,en;q=0.9,de;q=0.8,es;q=0.7,ru;q=0.6,ko;q=0.5",
			"cache-control": "max-age=0",
			"upgrade-insecure-requests": "1",
			"Cookie": "store.test; store.test; _ga=GA1.2.1866861768.1636146727; _gid=GA1.2.1549751187.1636146727; fpestid=ZMQL2NwUWRnkLQIqR6lwhq3HsZOioGjJuhqD2FIsV5dFgHyY4lgFO9RlbJqdexGTZQayeA; store.test; _gat=1; exam-settings=%7B%22category%22%3A2%2C%22locale%22%3A%22ru%22%2C%22skin%22%3A%22dark%22%2C%22user%22%3A0%2C%22created%22%3A1636230481%7D"
		},
		"referrerPolicy": "strict-origin-when-cross-origin",
		"body": null,
		"method": "GET",
		"mode": "cors",
		"credentials": "include"
	});

	const html = await response.text();
	const $html = parseHTML(html);
	if ($html == null) {
		throw new Error(`Error parsing html of page #${pageIndex}`);
	}
	
	const parent = $html;
	
	const questionItems = [...parent.querySelectorAll('.item')].map(item => <Element>item);
	const questions: {
		[index: number]: string
	} = {};
	
	for (const item of questionItems) {
		const match = (item.querySelector('.t-num') as Element).textContent.match(/#(\d+)/) as RegExpMatchArray;
		const questionIndex = parseInt(match[1]);
		questions[questionIndex] = item.outerHTML;
	}

	return questions;
}

let data;
if (existsSync(dataFilename))
	data = loadData();
else {
	console.info(`Database file "${dataFilename}" not found, starting from scratch ...`);
	data = {
		questions: {},
		pagesFetched: [],
	};
}

const minRequestDelay = 3.2;
const maxRequestDelay = 7.8;
let firstRequest = true;
let fetchedSomething = false;

for (let i = 1; i <= 55; i++) {
	if (data.pagesFetched.includes(i))
		continue;

	if (!firstRequest) {
		await sleep(randomBetween(minRequestDelay, maxRequestDelay));
	}
	firstRequest = false;

	console.log(`Fetching page #${i}`);
	const pageQuestion = await fetchPageQuestions(i);
	for (const [qi, qContent] of Object.entries(pageQuestion)) {
		if (data.questions[qi]) {
			console.warn(`Warning: question #${qi} has already been downlaoded before`);
		}
		data.questions[qi] = qContent;
	}
	data.pagesFetched.push(i);

	if (Object.keys(pageQuestion).length === 0) {
		console.warn(`Warning: no questions loaded for page #${i}`);
	} else {
		fetchedSomething = true;
		saveData(data);
	}
}

console.info('Finished');
