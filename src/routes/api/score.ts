import { Handlers } from "$fresh/server.ts"

export const handler: Handlers = {
	async POST(req: Request) {
		const data = await req.json()
		const kv = await Deno.openKv()
		const { id, score, name } = data
		const oldScore = await kv.get<{ score: number; name: string }>(["singlescores", id])
		if (oldScore.value?.score && oldScore.value.score > score) {
			await kv.set(["singlescores", id], { score, name })
		}
		return new Response("OK", { status: 200 })
	},
}
