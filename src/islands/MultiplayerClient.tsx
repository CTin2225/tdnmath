import { useSignal } from "@preact/signals"
import katex from "katex"
import { useEffect, useRef } from "preact/hooks"
import { Question } from "../types.ts"
import { cn } from "../utils.ts"
import { genId, PlayerID } from "./ID.tsx"

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
	40,
	45,
	50,
	55,
	60,
]

export function MultiplayerClient() {
	const ws = useRef<WebSocket | null>(null)
	const playerid = useSignal<string | null>(null)
	const playername = useSignal<string | null>(null)

	const questionsList = useSignal<Question[]>([])
	const questions = questionsList.value
	const score = useSignal(0)
	const timerProgress = useSignal(0)

	const currentQuestion = useSignal(0)
	const answers = useSignal(Array(questions.length).fill(null))

	const skipButton = useRef<HTMLButtonElement>(null)
	const answer = useSignal<string | number | null>(null)
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

	const isCorrect = (qi: number, ans: string | number | null) => {
		const q = questions[qi]
		if (ans === null) return false
		return ans.toString().toLowerCase().replaceAll(",", ".") === q.answer.toString().toLowerCase().replaceAll(",", ".")
	}

	const choose = (choice: number) => answer.value = showAnswer.value ? answer.value : choice

	const proceed = (mode: "skip" | "submit" | "choose" = "choose") => {
		clearTimeout(timeout.current)

		if (mode !== "skip") {
			if (isCorrect(qi, answer.value)) {
				const maxTime = timerLengthMap[q.difficulty - 1] * 1000
				const timeElapsed = maxTime - (timerProgress.value / 100) * maxTime
				const pts = timeElapsed < 5000 ? 100 : Math.max(0, 100 - ((timeElapsed - 5000) / (maxTime - 5000)) * 100)
				score.value = parseFloat((score.value + pts).toFixed(2))
			}
			showAnswer.value = true
		}

		answers.value[qi] = answer.value
		answers.value = [...answers.value]

		ws.current?.send(JSON.stringify({
			type: "answer",
			data: {
				id: playerid.value,
				answers: answers.value,
				score: score.value,
			},
		}))

		timeout.current = setTimeout(() => {
			currentQuestion.value = Math.min(qi + 1, questions.length)
			answer.value = null
			showAnswer.value = false
		}, mode === "skip" ? 0 : 5000)
	}

	useEffect(() => {
		playerid.value = localStorage.getItem("playerID") ?? genId()
		localStorage.setItem("playerID", playerid.value)

		const wsUrl = `${location.origin.replace("http", "ws")}/api/multiplayer?name=${playername.value}&id=${playerid.value}`
		ws.current = new WebSocket(wsUrl)

		ws.current.onopen = () => {
			console.log("WebSocket connection opened")
		}

		ws.current.onclose = () => {
			console.log("WebSocket connection closed")
			setTimeout(() => ws.current = new WebSocket(wsUrl), 3000)
		}

		ws.current.onerror = error => {
			console.error("WebSocket error:", error)
			setTimeout(() => ws.current = new WebSocket(wsUrl), 3000)
		}

		ws.current.onmessage = event => {
			const data = JSON.parse(event.data)

			switch (data.type) {
				case "welcome": {
					if (data.data.name) playername.value = data.data.name
					else {
						while (!playername.value) {
							playername.value = prompt("Nhập tên của bạn")
							if (playername.value === null) {
								ws.current?.send(JSON.stringify({ type: "quit", data: { id: playerid.value } }))
								location.href = "/"
								return
							} else if (playername.value.trim().length === 0) alert("Tên không được để trống!")
							else if (playername.value.length > 16) {
								alert("Tên quá dài! Tối đa 16 ký tự.")
								playername.value = null
							}
						}
					}
					ws.current?.send(JSON.stringify({ type: "join", data: { id: playerid.value, name: playername.value } }))
					break
				}

				case "join": {
					if (!data.data.answers || !data.data.questions || data.data.status !== "playing") return
					answers.value = data.data.answers
					score.value = data.data.score
					questionsList.value = data.data.questions
					const curQ = 8 - answers.value.toReversed().findIndex((a, i) => a !== null && i < questionsList.value.length)
					currentQuestion.value = curQ === 11 ? 0 : curQ
					break
				}

				case "full": {
					alert("Ôi không, phòng đã đầy rồi! Quay lại sau bạn nhé!")
					ws.current?.send(JSON.stringify({ type: "quit", data: { id: playerid.value } }))
					location.href = "/"
					break
				}

				case "start": {
					score.value = 0
					questionsList.value = data.data.questions
					answers.value = Array(questionsList.value.length).fill(null)
					currentQuestion.value = 0
					answer.value = null
					showAnswer.value = false
					timerProgress.value = 0
					break
				}

				case "end": {
					currentQuestion.value = questionsList.value.length
					break
				}

				case "reset": {
					location.href = "/"
					break
				}
			}
		}

		setInterval(() => ws.current?.send(JSON.stringify({ type: "ping" })), 30000)
	}, [])

	useEffect(() => {
		if (currentQuestion.value >= questions.length) return

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
				proceed(answer.value !== null ? "submit" : "skip")
			}
		}

		animationFrameId = requestAnimationFrame(animate)

		return () => {
			cancelAnimationFrame(animationFrameId)
		}
	}, [currentQuestion.value, questions])

	return (
		<div class="flex flex-1 flex-col w-full gap-4">
			<PlayerID class="fixed top-2 left-4" />
			<span class="text-sm text-gray-600/60 fixed top-2 right-4">{playername.value}</span>
			<div class="sticky top-4 z-10 flex gap-4 justify-center items-center bg-white/50 backdrop-blur border border-gray-300/60 rounded-xl px-2 py-1 w-max mx-auto shadow-lg">
				<span>Điểm</span>
				<span class="text-2xl font-bold">{score.value}</span>
			</div>
			<div class="grid grid-cols-8 gap-1">
				{answers.value.map((c, i) => (
					<div key={i} class={cn(
						"flex-1 rounded-full h-2 transition-all",
						diffBorderMap[questions[i].difficulty - 1],
						c === null
							? (i === qi ? diffBgMap[q.difficulty - 1] : "bg-transparent")
							: isCorrect(i, c)
							? "bg-emerald-400"
							: "bg-rose-400",
						i === qi ? "animate-pulse shadow-[0_0_4px_0_#0008] border-2" : "border",
					)} />
				))}
			</div>
			{questions.length === 0 && (
				// wait message and leave button
				<div class="flex flex-col gap-4 items-center justify-center w-full">
					<span class="text-2xl font-bold text-center">
						Chờ game bắt đầu bạn nhé! <br />
						<span class="text-sm text-gray-400">Game đã bắt đầu mà bạn vẫn chưa vào được? Hãy thử refresh!</span>
					</span>
					<button
						type="button"
						class="px-4 py-2 transition-all hover:translate-y-1 hover:shadow-none rounded-lg shadow-[0_4px_0_0] focus:ring-1 ring-black outline-none bg-red-500 shadow-red-600 text-white text-2xl disabled:opacity-25"
						onClick={() => {
							ws.current?.send(JSON.stringify({ type: "quit", data: { id: playerid.value } }))
							location.href = "/"
						}}
					>
						Rời khỏi phòng
					</button>
				</div>
			)}
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
										showAnswer.value && answer.value !== null
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
									value={answer.value === null ? "" : answer.value}
									onInput={e => {
										const value = (e.target as HTMLInputElement).value
										if (value.length === 0) answer.value = null
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
									answer.value !== null && !showAnswer.value
										? "bg-blue-500 shadow-blue-600 active:bg-blue-600"
										: "bg-zinc-500 shadow-zinc-600 active:bg-zinc-600",
								)}
								onClick={() => {
									proceed(answer.value !== null && !showAnswer.value ? "submit" : "skip")
									const { current } = skipButton
									if (!current) return
									current.disabled = true
									setTimeout(() => current.disabled = false, 1000)
								}}
							>
								{showAnswer.value ? "Tiếp" : answer.value !== null ? "Gửi" : "Bỏ qua"}
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
