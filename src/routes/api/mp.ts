import { Handler } from "$fresh/server.ts"

const channel = new BroadcastChannel("game")

channel.onmessage = event => {
	const message = event.data
	try {
		const data = JSON.parse(message)
		console.log("Received from BroadcastChannel:", data)
		relayToHost(data)
	} catch (e) {
		console.error("Failed to parse BroadcastChannel message:", e)
	}
}

const clients = new Map<string, WebSocket>()
let gameState: "idle" | "running" = "idle" // Track game state
let currentQuestion: { question: string; options: string[] } | null = null // Track current question

type Player = {
	id: string
	name: string
	status: (-1 | 0 | 1)[]
	score: number
}

export const handler: Handler = async (req, ctx) => {
	const { response, socket } = Deno.upgradeWebSocket(req)
	const kv = await Deno.openKv()

	const name = ctx.url.searchParams.get("name")
	const id = ctx.url.searchParams.get("id")
	if (!id || !name) {
		console.log("Missing name or id")
		socket.close(4000, "Missing name or id")
		return response
	}

	socket.onopen = async () => {
		console.log("WebSocket connection opened for", name, id)
		clients.set(id, socket)
		const playerData = (await kv.get<Player>(["players", id])).value ?? { id, name, status: Array(10).fill(0), score: 0 } as Player
		playerData.name = name

		await kv.set(["players", id], playerData)

		channel.postMessage(JSON.stringify({ type: "join", ...playerData }))
		if (id !== "host") relayToHost({ type: "join", ...playerData })
		else {
			const players = kv.list<Player>({ prefix: ["players"] })
			for await (const player of players) {
				if (player.value.id !== id) {
					socket.send(JSON.stringify({ type: "join", ...player.value }))
				}
			}
		}

		// Send current question to new client if game is running
		// if (gameState === "running" && id !== "host" && currentQuestion) {
		// 	socket.send(JSON.stringify({ type: "question", ...currentQuestion }))
		// }
	}

	socket.onmessage = async event => {
		const data = JSON.parse(event.data)
		if (data.type === "ping") socket.send(JSON.stringify({ type: "pong" }))
		else if (id !== "host") {
			channel.postMessage(JSON.stringify(data))
			relayToHost(data)
		} else {
			channel.postMessage(JSON.stringify(data))
			broadcastToClients(data) // Send to all clients in this isolate except host
			console.log("Relayed to all clients:", data)

			// Handle game states
			if (data.type === "start") {
				gameState = "running"
				broadcastToClients({ type: "start" })
			} else if (data.type === "question") {
				currentQuestion = { question: data.question, options: data.options }
				broadcastToClients(data)
			}
		}
	}

	socket.onclose = async () => {
		console.log("WebSocket connection closed for", name, id)
		clients.delete(id)
		await kv.delete(["players", id])

		channel.postMessage(JSON.stringify({ type: "leave", name, id }))
		if (id !== "host") relayToHost({ type: "leave", name, id })
	}

	socket.onerror = async error => {
		console.error("WebSocket error:", error)
		socket.close(4001, "WebSocket error")
		channel.postMessage(JSON.stringify({ type: "leave", name, id }))
		clients.delete(id)
		await kv.delete(["players", id])
	}

	return response
}

function relayToHost(data: object) {
	if (clients.has("host")) {
		const socket = clients.get("host")!
		if (socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(data))
			console.log("Relayed to host:", data)
		}
	} else {
		channel.postMessage(JSON.stringify(data))
		console.log("Relayed to all other isolates:", data)
	}
}

function broadcastToClients(data: object) {
	for (const [clientId, clientSocket] of clients) {
		if (clientId !== "host" && clientSocket.readyState === WebSocket.OPEN) {
			clientSocket.send(JSON.stringify(data))
		}
	}
}
