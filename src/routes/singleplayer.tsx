import Singleplayer from "../islands/Singleplayer.tsx"
import data from "../static/questions.json" with { type: "json" }
import { pickRandom } from "../utils.ts";

export default function BrowserPage() {
	const questions = [
		...pickRandom(data.filter(e=> e.difficulty === 1), 1),
		...pickRandom(data.filter(e=> e.difficulty === 2), 2),
		...pickRandom(data.filter(e=> e.difficulty === 3), 3),
		...pickRandom(data.filter(e=> e.difficulty === 4), 1),
		...pickRandom(data.filter(e=> e.difficulty === 5), 1),
	]

	return <Singleplayer questions={questions} />
}
