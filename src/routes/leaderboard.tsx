import { cn } from "../utils.ts"

const kv = await Deno.openKv()
export default async function Leaderboard() {
	const dbscores = kv.list<{ score: number; name: string }>({ prefix: ["singlescores"] })
	const scores: { score: number; name: string }[] = []
	for await (const { value } of dbscores) {
		scores.push(value)
	}
	scores.sort((a, b) => b.score - a.score)

	let r = 0

	return (
		<div class="flex flex-col gap-4 w-full max-w-2xl mx-auto p-4 items-center">
			<div className="fixed -z-10 inset-0 bg-gray-900/50"></div>
			<h1 class="text-4xl text-white">Bảng xếp hạng</h1>
			<ul class="flex flex-1 w-full flex-col gap-4">
				{scores.map((v, i) => {
					if (r === 0 || (i > 0 && scores[i - 1].score !== scores[i].score)) r++

					return (
						<li class={cn(
							"text-2xl flex justify-between p-2 rounded-xl shadow-[0_0_6px_0] before:content-[''] before:absolute before:-z-10 before:w-full before:h-full before:rounded-xl before:top-0 before:left-0",
							r === 1
								? "bg-yellow-500 shadow-yellow-500"
								: r === 2
								? "bg-gray-100 shadow-white/80"
								: r === 3
								? "bg-amber-600 shadow-amber-500"
								: "bg-gray-300 shadow-none",
						)}>
							<span class="flex gap-2">
								<span class="text-3xl px-2">{r}</span>
								<span>{v.name}</span>
							</span>
							<span>{v.score}</span>
						</li>
					)
				})}
			</ul>
		</div>
	)
}
