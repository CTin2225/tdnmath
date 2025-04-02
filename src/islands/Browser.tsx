import { useSignal } from "@preact/signals"
import katex from "katex"
import { useEffect } from "preact/hooks"
import { Question } from "../types.ts"
import { PlayerID } from "./ID.tsx"

const difficultyColorMap = [
	"bg-gray-200",
	"bg-purple-300",
	"bg-blue-300",
	"bg-green-300",
	"bg-yellow-300",
	"bg-red-300",
]

export default function QuestionBrowser(props: { data: Question[] }) {
	const index = useSignal(0)

	useEffect(() => {
		const params = new URLSearchParams(globalThis.location.search)
		const idParam = params.keys().next().value
		const id = idParam ? Number(idParam) : 1
		index.value = Math.max(0, Math.min(id - 1, props.data.length - 1))
	}, [])

	const navigate = (next: number) => {
		const newIndex = Math.max(0, Math.min(index.value + next, props.data.length - 1))
		index.value = newIndex
		history.pushState(null, "", `/browser?${newIndex + 1}`)
	}

	const question: Question = props.data[index.value]

	const renderMathText = (text: string | null) => {
		if (!text) return null

		const regex = /\$(.*?)\$/g
		const parts = text.split(regex)

		return parts.map((part, i) =>
			// deno-lint-ignore react-no-danger
			i % 2 === 1 ? <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(part, { throwOnError: false }) }} /> : part
		)
	}

	return (
		<div class="flex-1 w-full text-lg flex flex-col gap-6 items-center">
			<div class="flex gap-4">
				<a href="/" class="px-4 py-2 bg-gray-400 text-white rounded">🏠 Home</a>
				<button type="button" onClick={() => navigate(-1)} disabled={index.value === 0}
					class="px-4 py-2 bg-blue-400 text-white rounded disabled:opacity-50"
				>
					&larr; Trước
				</button>
				<button type="button" onClick={() => navigate(1)} disabled={index.value === props.data.length - 1}
					class="px-4 py-2 bg-blue-400 text-white rounded disabled:opacity-50"
				>
					Sau &rarr;
				</button>
			</div>
			<div key={index.value} class="flex flex-col gap-3 bg-white p-6 rounded-lg shadow-lg w-full max-w-xl">
				<div class="flex flex-col gap-1 mb-2">
					<span>Độ khó {question.difficulty}</span>
					<div class="flex gap-1">
						{/* difficulty color bars */}
						{[...Array(5)].map((_, i) => (
							<div key={i}
								class={`w-full h-2 rounded-full ${
									question.difficulty && i < question.difficulty ? difficultyColorMap[i + 1] : "bg-gray-200"
								}`} />
						))}
					</div>
				</div>
				<h2 class="text-xl whitespace-pre-wrap font-semibold text-gray-800 leading-tight">{renderMathText(question.question)}</h2>
				{question.image && (
					<img src={question.image.startsWith("http") ? question.image : `/questions/${question.image}`} alt="Question Image"
						class="mt-2 rounded-md" />
				)}
				{question.choices.length
					? (
						<ul class="flex flex-col gap-2 py-1">
							{question.choices.map((choice, i) => (
								<li key={i} class={`p-2 rounded ${i === question.answer ? "bg-green-400" : "bg-blue-100"}`}>
									{renderMathText(choice.toString())}
								</li>
							))}
						</ul>
					)
					: <div class="p-2 rounded bg-blue-300">Đáp án: {renderMathText(question.answer?.toString())}</div>}
				<div class="flex flex-col gap-2">
					{question.explanation?.split("\n").map((line, i) => (
						<p key={i} class="text-gray-600 whitespace-pre-wrap leading-tight">{renderMathText(line)}</p>
					))}
				</div>
				<span class="text-sm text-gray-400">
					#{index.value + 1}/{question.id}
				</span>
			</div>
			<PlayerID />
		</div>
	)
}
