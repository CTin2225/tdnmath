import { useSignal } from "@preact/signals"
import { useEffect, useRef } from "preact/hooks"
import { qrcode } from "qrcode"
import { Room } from "../types.ts"

export function MultiplayerHost(props: { data: Room }) {
	const { status, questions } = props.data
	const ws = useRef<WebSocket | null>(null)
	const players = useSignal<Map<string, { name: string; status: (-1 | 0 | 1)[] }>>(new Map())
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

		setInterval(() => ws.current?.send(JSON.stringify({ type: "ping" })), 5000)
	}, [])

	return (
		<div class="flex flex-col items-center gap-4">
			{qr.value && (
				<div class="fixed top-4 left-4 flex flex-col gap-1 items-center">
					<img src={qr.value ?? ""} alt="QRCode" width="128" class="p-2 bg-white" />
					<span class="text-lg">Scan để chơi!</span>
				</div>
			)}
			<h1 class="text-3xl">Quiz Toán</h1>
			<ul>
				{[...players.value.entries()].map(([id, player], i) => (
					<li key={id}>
						<span>
							{player.name}
						</span>
						{player.status.map((status, i) => (
							<span key={id + i} className={`status ${status === -1 ? "wrong" : status === 0 ? "waiting" : "correct"}`}>
								{status === -1 ? "❌" : status === 0 ? "⏳" : "✅"}
							</span>
						))}
					</li>
				))}
			</ul>
			<button
				type="button"
				class="px-4 py-2 transition-all hover:translate-y-1 hover:shadow-none rounded-lg shadow-[0_4px_0_0] focus:ring-1 ring-black outline-none bg-blue-500 shadow-blue-600 text-white disabled:opacity-25"
				onClick={() => {
					const { current } = ws
					if (!current) return alert("Chưa có kết nối")

					if (start.value) {
						const a = confirm("Bạn có chắc muốn kết thúc không?")
						if (!a) return
						current.send(JSON.stringify({ type: "end" }))
						start.value = false
					} else {
						current.send(JSON.stringify({ type: "start", data: { questions } }))
						start.value = true
					}
				}}
			>
				{start.value ? "Kết thúc" : "Bắt đầu"}
			</button>
		</div>
	)
}
