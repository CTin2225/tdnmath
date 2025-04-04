import { useSignal } from "@preact/signals"
import { useEffect, useRef } from "preact/hooks"
import { qrcode } from "qrcode"
import { Room } from "../types.ts"
import { cn } from "../utils.ts"

export function MultiplayerHost(props: { data: Room }) {
	const { status, questions } = props.data
	const ws = useRef<WebSocket | null>(null)
	const players = useSignal<Map<string, { name: string; status: (-1 | 0 | 1)[]; score: number; connected: boolean }>>(new Map())
	// const answers = useSignal<>(new Map())
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
						status: data.data.status,
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

				case "answer": {
					const player = players.value.get(data.data.id)
					if (!player) return
					player.status = data.data.status
					player.score = data.data.score
					players.value.set(data.data.id, player)
					players.value = new Map(players.value)
					break
				}

				case "gamestate": {
					if (data.data === "start") {
						start.value = true
					} else if (data.data === "end") {
						start.value = false
					}
				}
			}
		}

		setInterval(() => ws.current?.send(JSON.stringify({ type: "ping" })), 5000)
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
			<h1 class="text-6xl">Quiz Toán</h1>
			<ul class="max-w-screen-lg w-full flex flex-col gap-3 text-black">
				{[...players.value.entries()].map(([_, player], i) => (
					<li key={i} class={cn(
						"w-full bg-gray-200 rounded-xl flex gap-6 items-center flex-1 px-6 py-4 text-3xl",
						!player.connected && "opacity-50",
					)}>
						<span class="w-1/5">{player.name}</span>
						<div class="w-full flex-1 grid grid-cols-10 gap-1">
							{player.status.map((status, i) => (
								<div key={i} class={cn(
									"w-full flex-1 rounded-full h-2 transition-all",
									status === 1 ? "bg-green-500" : status === -1 ? "bg-red-500" : "border-gray-500 border",
								)} />
							))}
						</div>
						<span class="w-1/12">{player.score}</span>
					</li>
				))}
				{Array(8 - players.value.size).fill(0).map((_, i) => (
					<li class="w-full bg-gray-200 rounded-xl flex gap-6 items-center flex-1 px-6 py-4 text-3xl opacity-25" key={i}>
						<span class="w-1/5">Người chơi {i + players.value.size + 1}</span>
						<div class="w-full flex-1 grid grid-cols-10 gap-1">
							{Array(questions.length).fill(0).map((_, i) => (
								<div key={i} class="w-full flex-1 rounded-full h-2 transition-all border-gray-500 border" />
							))}
						</div>
						<span class="w-1/12">
							0
						</span>
					</li>
				))}
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
							players.value.clear()
						} else {
							current.send(JSON.stringify({ type: "start", data: { questions } }))
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
					}}
				>
					Đặt lại phòng
				</button>
			</div>
		</div>
	)
}
