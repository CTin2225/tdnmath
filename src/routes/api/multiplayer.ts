import { Handler } from "$fresh/server.ts"
import { data } from "npm:autoprefixer@10.4.17"

const channel = new BroadcastChannel("game")

channel.onmessage = event => {
	const message = event.data
	try {
		const data = JSON.parse(message)
		console.log("Received from BroadcastChannel:", data)
		if (data.type === "join" && data.id === "host") return
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

	const id = ctx.url.searchParams.get("id")
	if (!id) {
		console.log("Missing id")
		socket.close(4000, "Missing id")
		return response
	}

	socket.onopen = async () => {
		console.log("WebSocket connection opened for", id)
		clients.set(id, socket)

		if (id !== "host") {
			const player = await kv.get<Player>(["players", id])
			socket.send(JSON.stringify({ type: "welcome", data: { id, status: Array(10).fill(0), score: 0, ...player.value } }))
		} else {
			const players = kv.list<Player>({ prefix: ["players"] })
			for await (const player of players) {
				if (player.value.id !== id) {
					socket.send(JSON.stringify({ type: "join", data: { ...player.value } }))
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
			switch (data.type) {
				case "join": {
					clients.set(data.data.id, socket)
					const playerData = { id: data.data.id, name: data.data.name.trim(), status: Array(10).fill(0), score: 0 }
					await kv.set(["players", data.data.id], playerData)
					relayToHost({ type: "join", data: playerData })
					return
				}

				case "quit": {
					clients.delete(data.data.id)
					await kv.delete(["players", data.data.id])
					relayToHost({ type: "quit", data: { id: data.data.id } })
					return
				}
			}

			channel.postMessage(JSON.stringify(data))
			relayToHost(data)
		} else {
			switch (data.type) {
				case "end":
				case "reset": {
					gameState = "idle"
					for await (const entry of kv.list({ prefix: ["players"] })) await kv.delete(entry.key)
					await kv.delete(["room"])
					break
				}
			}

			channel.postMessage(JSON.stringify(data))
			broadcastToClients(data) // Send to all clients in this isolate except host
			console.log("Relayed to all clients:", data)

			// handle game states
			// if (data.type === "start") {
			// 	gameState = "running"
			// 	broadcastToClients({ type: "start" })
			// } else if (data.type === "question") {
			// 	currentQuestion = { question: data.question, options: data.options }
			// 	broadcastToClients(data)
			// }
		}
	}

	socket.onclose = async () => {
		console.log("WebSocket connection closed for", id)
		clients.delete(id)
		if (id !== "host") relayToHost({ type: "leave", data: { id } })
	}

	socket.onerror = async error => {
		console.error("WebSocket error:", error)
		socket.close(4001, "WebSocket error")
		channel.postMessage(JSON.stringify({ type: "leave", data: { id } }))
		clients.delete(id)
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
