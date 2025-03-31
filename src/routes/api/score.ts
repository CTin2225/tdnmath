import { Handlers } from "$fresh/server.ts"

export const handler: Handlers = {
	async POST(req: Request) {
		console.log(req)
		const data = await req.json()
		console.log(data)
		const kv = await Deno.openKv()
		const { id, score, name } = data
		const oldScore = await kv.get<{ score: number; name: string }>(["singlescores", id])
		console.log(oldScore)
		if (oldScore.value?.score && oldScore.value.score < score) {
			await kv.set(["singlescores", id], { score, name })
		}
		return new Response("OK", { status: 200 })
	},
}
