import { useSignal } from "@preact/signals"
import katex from "katex"
import { useEffect, useRef } from "preact/hooks"
import { Question } from "../types.ts"
import { cn } from "../utils.ts"

const diffBgMap = [
	"bg-purple-300",
	"bg-blue-300",
	"bg-green-300",
	"bg-yellow-300",
	"bg-red-300",
]

const diffBorderMap = [
	"border-purple-500",
	"border-blue-500",
	"border-green-500",
	"border-yellow-500",
	"border-red-500",
]

const bgMap = [
	"bg-red-500 shadow-red-600 active:bg-red-600",
	"bg-blue-500 shadow-blue-600 active:bg-blue-600",
	"bg-yellow-500 shadow-yellow-600 active:bg-yellow-600",
	"bg-green-500 shadow-green-600 active:bg-green-600",
]

const timerLengthMap = [
	25,
	30,
	35,
	40,
	45,
]

export default function Singleplayer(props: { questions: Question[] }) {
	const { questions } = props
	const score = useSignal(0)
	const timerProgress = useSignal(0)

	const currentQuestion = useSignal(0)
	const answers = useSignal(Array(questions.length).fill(-1))

	const skipButton = useRef<HTMLButtonElement>(null)
	const answer = useSignal<string | number>(-1)
	const showAnswer = useSignal(false)
	const timeout = useRef<number>()

	const qi = currentQuestion.value
	const q = questions[Math.min(qi, questions.length - 1)]

	const renderMathText = (text: string | null) => {
		if (!text) return null

		const regex = /\$(.*?)\$/g
		const parts = text.split(regex)

		return parts.map((part, i) =>
			// deno-lint-ignore react-no-danger
			i % 2 === 1 ? <span key={i} dangerouslySetInnerHTML={{ __html: katex.renderToString(part, { throwOnError: false }) }} /> : part
		)
	}

	const isCorrect = (qi: number, ans: string | number) => {
		const q = questions[qi]
		if (!q.answer) return false
		return ans.toString() === q.answer.toString()
	}

	const choose = (choice: number) => answer.value = showAnswer.value ? answer.value : choice

	const proceed = (mode: "skip" | "submit" | "choose" = "choose") => {
		clearTimeout(timeout.current)

		if (mode !== "skip") {
			if (answer.value.toString().toLowerCase().replaceAll(",", ".") === q.answer.toString().toLowerCase().replaceAll(",", ".")) {
				const maxTime = timerLengthMap[q.difficulty - 1] * 1000
				const timeElapsed = maxTime - (timerProgress.value / 100) * maxTime
				const pts = timeElapsed < 5000 ? 100 : Math.max(0, 100 - ((timeElapsed - 5000) / (maxTime - 5000)) * 100)
				score.value = parseFloat((score.value + pts).toFixed(2))
			}
			showAnswer.value = true
		}

		if (answer.value !== -1) answers.value[qi] = answer.value
		answers.value = [...answers.value]

		timeout.current = setTimeout(() => {
			currentQuestion.value = Math.min(qi + 1, questions.length)
			answer.value = -1
			showAnswer.value = false
		}, mode === "skip" ? 0 : 5000)
	}

	useEffect(() => {
		if (currentQuestion.value === questions.length) {
			timerProgress.value = 0
			clearTimeout(timeout.current)

			const id = localStorage.getItem("id")
				|| Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

			let name: string | null = ""
			while (!name?.trim().length && name !== null) name = prompt("Nhập tên của bạn để lưu điểm số, hoặc hủy để quay về trang chính")

			if (name === null) {
				location.href = "/"
				return
			}

			fetch("/api/score", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ score: score.value, name, id }),
			})
		}
		const timeLimit = timerLengthMap[q.difficulty - 1] * 1000
		const startTime = performance.now()
		let animationFrameId: number

		const animate = () => {
			if (showAnswer.value) return

			const currentTime = performance.now()
			const elapsed = currentTime - startTime
			const remaining = Math.max(0, timeLimit - elapsed)
			const progress = (remaining / timeLimit) * 100
			timerProgress.value = progress

			if (remaining > 0) {
				animationFrameId = requestAnimationFrame(animate)
			} else {
				proceed(answer.value !== -1 ? "submit" : "skip")
			}
		}

		animationFrameId = requestAnimationFrame(animate)

		return () => {
			cancelAnimationFrame(animationFrameId)
		}
	}, [currentQuestion.value])

	return (
		<div class="flex flex-1 flex-col w-full gap-4">
			<div class="sticky top-4 z-10 flex gap-4 justify-center items-center bg-white/50 backdrop-blur border border-gray-300/60 rounded-xl px-2 py-1 w-max mx-auto shadow-lg">
				<span>Điểm</span>
				<span class="text-2xl font-bold">{score.value}</span>
			</div>
			<div class="grid grid-cols-10 gap-1">
				{answers.value.map((c, i) => (
					<div key={i} class={cn(
						"flex-1 rounded-full h-2 transition-all",
						diffBorderMap[questions[i].difficulty - 1],
						c === -1
							? (i === qi ? diffBgMap[q.difficulty - 1] : "bg-transparent")
							: isCorrect(i, c)
							? "bg-emerald-400"
							: "bg-rose-400",
						i === qi ? "animate-pulse shadow-[0_0_4px_0_#0008] border-2" : "border",
					)} />
				))}
			</div>

			{currentQuestion.value < questions.length
				? (
					<>
						<div className="flex flex-1 gap-4 flex-col items-center justify-center">
							<div class="flex gap-3 w-full max-w-sm bg-white/50 backdrop-blur border border-gray-300/60 rounded-full px-3 py-1 shadow-lg">
								<span>Độ khó {q.difficulty}</span>
								<div class="flex flex-1 gap-1 items-center">
									{[...Array(5)].map((_, i) => (
										<div key={i} class={cn(
											"flex-1 h-2 rounded-full",
											q.difficulty && i < q.difficulty ? diffBgMap[i] : "bg-gray-300",
										)} />
									))}
								</div>
							</div>
							<div class="flex flex-col gap-1 text-2xl md:text-3xl text-center text-balance leading-tight whitespace-pre-wrap max-w-screen-lg">
								{q.question.split("\n").map((line, i) => <p key={i}>{i === 0 ? `Câu ${qi + 1}. ` : ""}{renderMathText(line)}</p>)}
							</div>
							{q.image && (
								<img src={q.image.startsWith("http") ? q.image : `/questions/${q.image}`} alt="Question Image"
									class="rounded-md max-w-[min(32rem,100%)] max-h-[32rem] mx-auto" />
							)}
							{showAnswer.value && q.explanation && (
								<div class="flex flex-col gap-2 col-span-2 text-xl bg-white/50 backdrop-blur-md rounded-xl shadow-lg px-4 py-3 max-w-screen-md">
									{q.choices.length === 0
										&& <div class="p-2 rounded bg-blue-400">Đáp án: {renderMathText(q.answer?.toString())}</div>}
									<div class="flex flex-col gap-2 text-left">
										{q.explanation?.split("\n").map((line, i) => (
											<p key={i} class="text-gray-600 whitespace-pre-wrap leading-tight">{renderMathText(line)}</p>
										))}
									</div>
								</div>
							)}
						</div>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-x-2 gap-y-3 text-white text-xl text-balance text-center">
							{q.choices.map((c, i) => (
								<button
									type="button"
									class={cn(
										"px-4 py-2 md:py-4 transition-all hover:translate-y-1 hover:shadow-none rounded-lg shadow-[0_4px_0_0] focus:ring-1 ring-black outline-none",
										answer.value === c ? "animate-pulse translate-y-1 shadow-none" : "",
										showAnswer.value && answer.value !== -1
											? q.answer === i ? "bg-green-500 shadow-green-600" : "bg-red-500 shadow-red-600"
											: bgMap[i],
									)}
									onClick={e => {
										choose(i)
										if (!showAnswer.value) proceed()
										e.currentTarget.blur()
									}}
								>
									{renderMathText(c.toString())}
								</button>
							))}
							{q.choices.length === 0 && (
								<input
									type="text"
									class="px-4 py-4 col-span-2 transition-all hover:translate-y-1 hover:shadow-[0_0_0_0] rounded-md bg-gray-500 shadow-[0_4px_0_0] shadow-gray-600"
									value={answer.value === -1 ? "" : answer.value}
									onInput={e => {
										const value = (e.target as HTMLInputElement).value
										if (value.length === 0) answer.value = -1
										else if (/^[0-9.,-]*$/.test(value)) answer.value = value
									}}
								/>
							)}
						</div>
						<div className="sticky bottom-4 p-2 bg-white/50 backdrop-blur-md rounded-xl flex items-end gap-2 text-white w-full">
							<div className="flex justify-end items-end flex-1 relative w-full h-full gap-1">
								<span className="absolute text-sm text-gray-400 bottom-4"
									style={{ right: `min(calc(100% - 1rem), ${100.5 - timerProgress.value}%)` }}
								>
									{Math.ceil(timerProgress.value / 100 * timerLengthMap[q.difficulty - 1])}s
								</span>
								<div className="absolute w-full rounded-full bg-blue-500/20 overflow-hidden h-3">
									<div className="h-3 rounded-full bg-blue-600" style={{ width: `${timerProgress.value}%` }} />
								</div>
							</div>
							<button
								type="button"
								ref={skipButton}
								class={cn(
									"px-3 py-1.5 transition-all hover:translate-y-1 hover:shadow-[0_0_0_0] rounded-md shadow-[0_4px_0_0] disabled:opacity-50 focus:brightness-125 focus:ring-1 ring-zinc-300 outline-none",
									answer.value !== -1 && !showAnswer.value
										? "bg-blue-500 shadow-blue-600 active:bg-blue-600"
										: "bg-zinc-500 shadow-zinc-600 active:bg-zinc-600",
								)}
								onClick={() => {
									proceed(answer.value !== -1 && !showAnswer.value ? "submit" : "skip")
									const { current } = skipButton
									if (!current) return
									current.disabled = true
									setTimeout(() => current.disabled = false, 10)
								}}
							>
								{showAnswer.value ? "Tiếp" : answer.value !== -1 ? "Gửi" : "Bỏ qua"}
							</button>
						</div>
					</>
				)
				: questions.map((question, i) => (
					<div key={i} class="flex flex-col gap-3 bg-white p-6 rounded-lg shadow-md w-full max-w-3xl mx-auto">
						<div class="flex flex-col gap-1 mb-2">
							<div className="flex justify-between">
								<span>Độ khó {question.difficulty}</span>
								<span class="text-sm text-gray-400">#{question.id}</span>
							</div>
							<div class="flex gap-1">
								{/* difficulty color bars */}
								{[...Array(5)].map((_, i) => (
									<div key={i}
										class={`w-full h-2 rounded-full ${
											question.difficulty && i < question.difficulty ? diffBgMap[i] : "bg-gray-200"
										}`} />
								))}
							</div>
						</div>
						<h2 class="text-xl whitespace-pre-wrap font-semibold text-gray-800 leading-tight">
							{renderMathText(question.question)}
						</h2>
						{question.image && (
							<img src={question.image.startsWith("http") ? question.image : `/questions/${question.image}`} alt="Question Image"
								class="rounded-md max-w-[min(32rem,100%)] max-h-[32rem] mx-auto" />
						)}
						{question.choices.length
							? (
								<ul class="flex flex-col gap-2 py-1">
									{question.choices.map((c, i) => (
										<li key={i} class={cn("p-2 rounded", i === question.answer ? "bg-green-400" : "bg-blue-100")}>
											<span class="text-xl font-semibold text-gray-800">{renderMathText(c.toString())}</span>
										</li>
									))}
								</ul>
							)
							: <div class="p-2 rounded bg-blue-300">Đáp án: {renderMathText(question.answer?.toString())}</div>}
						{question.explanation && (
							<div class="flex flex-col gap-2">
								{question.explanation.split("\n").map((line, i) => (
									<p key={i} class="text-gray-600 whitespace-pre-wrap leading-tight">{renderMathText(line)}</p>
								))}
							</div>
						)}
					</div>
				))}
		</div>
	)
}
