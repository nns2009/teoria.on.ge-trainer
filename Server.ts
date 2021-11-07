import { existsSync } from "https://deno.land/std/fs/mod.ts";
import { listenAndServe } from "https://deno.land/std@0.113.0/http/server.ts";

import {
	parseHTML, sleep, randomBetween,
	saveData, loadData, dataFilename
} from './Common.ts';

const templateFilename = 'Template.html';
if (!existsSync(templateFilename)) {
	throw new Error(`Template with filename "${templateFilename}" was not found`);
}
const template = Deno.readTextFileSync(templateFilename);

const contentMarker = '=====CONTENT=====';
if (!template.includes(contentMarker))
	throw new Error(`Template doesn't include the content marker "${contentMarker}"`);

if (!existsSync(dataFilename))
	throw new Error(`Database with filename "${dataFilename}" was not found`);
const data = loadData();

console.log("http://localhost:8000/");
listenAndServe(":8000", (req) => {
	const url = new URL(req.url);
	const questionNumbersString = (url.searchParams.get('questionNumbers') ?? '').trim();
	
	const questionsNumbers = questionNumbersString.split(',').map(qis => parseInt(qis.trim()));
	console.log('q:', questionNumbersString, questionsNumbers);

	const questionHtmls = questionsNumbers.map(index =>
		isNaN(index) ? `<h1>Warning: #${index} is NaN</h1>` :
		data.questions[index] ? data.questions[index] :
		`<h1>Warning: question #${index} is missing from the database</h1>`
	);

	const questionsArrayString = '[' + Object.keys(data.questions).join(', ') + ']';
	
	const content =
		`
		<div>
			All questions: <br/>
			${questionsArrayString}
		</div>
		<script>
			const allQuestionNumbers = ${questionsArrayString};
			console.log('All question numbers loaded into "allQuestionNumbers" variable');
		</script>
		<form method="get">
			<textarea name="questionNumbers" rows="10" cols="100">${questionNumbersString}</textarea>
			<input type="submit" value="Load" />
		</form>
		<h1>${questionHtmls.length} questions shown</h1>`
		+ questionHtmls.join('');

	const responseHtml = template.replace(contentMarker, content);
	
	return new Response(
		responseHtml,
		{
			headers: {
				"content-type": "text/html; charset=utf-8",
			},
		}
	);
});