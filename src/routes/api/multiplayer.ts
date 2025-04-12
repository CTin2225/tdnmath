import { pickRandom } from "../../utils.ts";
import questions from "../../static/questions.json" with { type: "json" }
import { Handler } from "$fresh/server.ts"
import { Room } from "../../types.ts"

const channel = new BroadcastChannel("game")

channel.onmessage = event => {
	const message = event.data
	try {
		const data = JSON.parse(message)
		console.log("Received from BroadcastChannel:", data)
		if (data.type === "join" && data.id === "host") return
		relayToHost(data)
		broadcastToClients(data)
	} catch (e) {
		console.error("Failed to parse BroadcastChannel message:", e)
	}
}

const clients = new Map<string, WebSocket>()
// let gameState: "idle" | "running" = "idle" // Track game state
// let currentQuestion: { question: string; options: string[] } | null = null // Track current question

type Player = {
	id: string
	name: string
	answers: (string | number | null)[]
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
			socket.send(JSON.stringify({ type: "welcome", data: { id, answers: Array(8).fill(null), score: 0, ...player.value } }))
		} else {
			const players = kv.list<Player>({ prefix: ["players"] })
			for await (const player of players) {
				if (player.value.id !== "host") socket.send(JSON.stringify({ type: "join", data: { ...player.value } }))
			}

			const room = await kv.get<Room>(["room"])
			socket.send(JSON.stringify({ type: "gamestate", data: { ...room.value } }))
		}
	}

	socket.onmessage = async event => {
		const data = JSON.parse(event.data)

		if (data.type === "ping") socket.send(JSON.stringify({ type: "pong" }))
		else if (id !== "host") {
			switch (data.type) {
				case "join": {
					clients.set(data.data.id, socket)
					const existingPlayer = await kv.get<Player>(["players", data.data.id])
					const playerData = { id: data.data.id, name: data.data.name.trim(), answers: Array(8).fill(null), score: 0,
						...existingPlayer.value }
					await kv.set(["players", data.data.id], playerData)

					const room = await kv.get<Room>(["room"])
					if (room.value?.players.length === 8) {
						socket.send(JSON.stringify({ type: "full", data: { message: "Room is full" } }))
						return
					}

					findHostAndSend({ type: "join", data: playerData })
					socket.send(JSON.stringify({ type: "join", data: { ...playerData, ...room.value } }))
					await kv.set(["room"], { ...room.value, players: [...(room.value?.players || []), data.data.id] })
					return
				}

				case "answer": {
					const player = await kv.get<Player>(["players", data.data.id])
					if (!player.value) return
					await kv.set(["players", data.data.id], { ...player.value, answers: data.data.answers, score: data.data.score })
					findHostAndSend({ type: "answer", data: { ...player.value, answers: data.data.answers, score: data.data.score } })
					return
				}

				case "quit": {
					clients.delete(data.data.id)
					await kv.delete(["players", data.data.id])
					const room = await kv.get<Room>(["room"])
					if (room.value) {
						room.value.players = room.value.players.filter((playerId: string) => playerId !== data.data.id)
						await kv.set(["room"], room.value)
					}
					findHostAndSend({ type: "quit", data: { id: data.data.id } })
					return
				}
			}
		} else {
			switch (data.type) {
				case "end":
				case "reset": {
					broadcastToChannel(data)
					broadcastToClients(data)

					await kv.delete(["room"])
					for await (const entry of kv.list({ prefix: ["players"] })) await kv.delete(entry.key)

					for (const [clientId, clientSocket] of clients) {
						if (clientId !== "host") {
							clientSocket.close(4000, "Game ended")
							clients.delete(clientId)
						}
					}
					break
				}

				case "start": {
					const room = await kv.get<Room>(["room"])
					const roomData = { questions: [
						...pickRandom(questions.filter(e=> e.difficulty === 1), 1),
						...pickRandom(questions.filter(e=> e.difficulty === 2), 2),
						...pickRandom(questions.filter(e=> e.difficulty === 3), 3),
						...pickRandom(questions.filter(e=> e.difficulty === 4), 1),
						...pickRandom(questions.filter(e=> e.difficulty === 5), 1),
					], ...room.value, status: "playing" }
					await kv.set(["room"], roomData)
					relayToHost({ type: "start", data: roomData })
					broadcastToChannel({ type: "start", data: roomData })
					broadcastToClients({ type: "start", data: roomData })
					break
				}
			}

			console.log("Relayed to all clients:", data.type === "start" ? "[questions]" : data)
		}
	}

	socket.onclose = () => {
		console.log("WebSocket connection closed for", id)
		clients.delete(id)
		if (id !== "host") findHostAndSend({ type: "leave", data: { id } })
	}

	socket.onerror = error => {
		console.error("WebSocket error:", error)
		socket.close(4001, "WebSocket error")
		channel.postMessage(JSON.stringify({ type: "leave", data: { id } }))
		clients.delete(id)
	}

	return response
}

function findHostAndSend(data: Record<string, object | string | number>) {
	relayToHost(data)
	broadcastToChannel(data)
}

function relayToHost(data: Record<string, object | string | number>) {
	if (clients.has("host")) {
		const socket = clients.get("host")!
		if (socket.readyState === WebSocket.OPEN) {
			socket.send(JSON.stringify(data))
			console.log("Relayed to host:", data)
		}
	}
}

function broadcastToChannel(data: Record<string, object | string | number>) {
	channel.postMessage(JSON.stringify(data))
	console.log("Relayed to other isolates:", data.type === "start" ? "[questions]" : data)
}

function broadcastToClients(data: Record<string, object | string | number>) {
	for (const [clientId, clientSocket] of clients) {
		if (clientId !== "host" && clientSocket.readyState === WebSocket.OPEN) {
			clientSocket.send(JSON.stringify(data))
		}
	}
}
