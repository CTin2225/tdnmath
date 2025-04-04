import { Handlers } from "$fresh/server.ts"

export const handler: Handlers = {
	async GET() {
		const kv = await Deno.openKv()
		for await (const entry of kv.list({ prefix: [] })) {
			await kv.delete(entry.key)
		}

		return new Response("Deleted all data", { status: 200 })
	},
}
