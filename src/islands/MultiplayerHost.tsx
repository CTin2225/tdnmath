import { useSignal } from "@preact/signals"
import { useEffect, useRef } from "preact/hooks"
import { qrcode } from "qrcode"
import { Question } from "../types.ts"
import { cn } from "../utils.ts"

export function MultiplayerHost() {
	const questions = useSignal<Question[] | null>(null)
	const ws = useRef<WebSocket | null>(null)
	const players = useSignal<Map<string, { name: string; answers: (string | number | null)[]; score: number; connected: boolean }>>(
		new Map(),
	)
	const qr = useSignal<string | null>(null)
	const start = useSignal(false)

	useEffect(() => {
		const generateQRCode = async () => {
			const qrCode = await qrcode(`http://${location.host}/multiplayer/join`) as unknown as string // bad lib ts type
			qr.value = qrCode
		}

		generateQRCode()
	}, [])

	useEffect(() => {
		const wsUrl = `${location.origin.replace("http", "ws")}/api/multiplayer?name=host&id=host`
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
				case "join": {
					if (data.data.id === "host") return
					players.value.set(data.data.id, {
						name: data.data.name,
						answers: data.data.answers,
						score: data.data.score,
						connected: true,
					})
					players.value = new Map(players.value)
					break
				}

				case "leave": {
					if (data.data.id === "host") return
					const player = players.value.get(data.data.id)
					if (!player) return
					players.value.set(data.data.id, {
						...player,
						connected: false,
					})
					players.value = new Map(players.value)
					break
				}

				case "quit": {
					if (data.data.id === "host") return
					players.value.delete(data.data.id)
					players.value = new Map(players.value)
					break
				}

				case "start": {
					questions.value = data.data.questions
					start.value = true
					break
				}

				case "answer": {
					const player = players.value.get(data.data.id)
					if (!player) return
					player.answers = data.data.answers
					player.score = data.data.score
					players.value.set(data.data.id, player)
					players.value = new Map(players.value)
					break
				}

				case "gamestate": {
					if (data.data.status === "playing") {
						start.value = true
						questions.value = data.data.questions
					}
					break
				}
			}
		}

		setInterval(() => ws.current?.send(JSON.stringify({ type: "ping" })), 30000)
	}, [])

	return (
		<div class="w-full flex flex-col items-center my-auto gap-8 text-white">
			<div className="fixed top-0 left-0 inset-0 -z-10 bg-gray-900/50"></div>
			{qr.value && (
				<div class="fixed top-4 left-4 flex flex-col items-center bg-white">
					<img src={qr.value ?? ""} alt="QRCode" width="128" class="p-2 pb-0 bg-white" />
					<span class="text-xl text-black">Scan để chơi!</span>
				</div>
			)}
			<h1 class="text-6xl mt-20">Quiz Toán</h1>
			<ul class="max-w-screen-lg w-full flex flex-col gap-3 text-black">
				{[...players.value.entries()].sort((a, b) => b[1].score - a[1].score).map(([id, player]) => (
					<li key={id} class={cn(
						"w-full bg-gray-200 rounded-xl flex gap-6 items-center flex-1 px-6 py-4 text-3xl transition-all",
						!player.connected && "opacity-50",
					)}>
						<span class="w-1/5">{player.name}</span>
						<div class="w-full flex-1 grid grid-cols-8 gap-1">
							{player.answers.map((ans, i) => (
								<div key={i} class={cn(
									"w-full flex-1 rounded-full h-2 transition-all",
									ans === null ? "border-gray-500 border" : ans === questions.value?.[i]?.answer ? "bg-green-500" : "bg-red-500",
								)} />
							))}
						</div>
						<span class="w-1/12">{player.score}</span>
					</li>
				))}
				{players.value.size < 1 && (
					<li class="w-full bg-gray-200 rounded-xl flex gap-6 items-center flex-1 px-6 py-4 text-3xl">
						Chưa có người chơi nào
					</li>
				)}
			</ul>
			<div className="flex gap-3">
				<button
					type="button"
					class="px-4 py-2 transition-all hover:translate-y-1 hover:shadow-none rounded-lg shadow-[0_4px_0_0] focus:ring-1 ring-black outline-none bg-blue-500 shadow-blue-600 text-white text-2xl disabled:opacity-25"
					disabled={players.value.size < 1}
					onClick={() => {
						const { current } = ws
						if (!current) return alert("Chưa có kết nối")
						if (start.value) {
							const a = confirm("Bạn có chắc muốn kết thúc không?")
							if (!a) return
							current.send(JSON.stringify({ type: "end" }))
							start.value = false
						} else {
							current.send(JSON.stringify({ type: "start" }))
							start.value = true
						}
					}}
				>
					{start.value ? "Kết thúc" : "Bắt đầu"}
				</button>
				<button
					type="button"
					class="px-4 py-2 transition-all hover:translate-y-1 hover:shadow-none rounded-lg shadow-[0_4px_0_0] focus:ring-1 ring-black outline-none bg-rose-500 shadow-rose-600 text-white text-2xl disabled:opacity-25"
					onClick={() => {
						const { current } = ws
						if (!current) return alert("Chưa có kết nối")
						const a = confirm("Bạn có chắc chắn muốn đặt lại phòng không?")
						if (!a) return
						current.send(JSON.stringify({ type: "reset" }))
						start.value = false
						location.reload()
					}}
				>
					Đặt lại phòng
				</button>
			</div>
		</div>
	)
}
