import data from "../../static/questions.json" with { type: "json" }
import { MultiplayerHost } from "../../islands/MultiplayerHost.tsx"
import { pickRandom } from "../../utils.ts";
import { Question, Room } from "../../types.ts";

export default async function HostPage() {
	const kv = await Deno.openKv()
	const questions = pickRandom<Question>(data, 10)
	const currentRoom = await kv.get<Room>(["room"])

	if (!currentRoom || !currentRoom.value || currentRoom.value.status === "finished") {
		currentRoom.value = {
			status: "waiting",
			questions,
		}
		await kv.set(["room"], currentRoom.value)
	}

	return <MultiplayerHost data={currentRoom.value} />
}
