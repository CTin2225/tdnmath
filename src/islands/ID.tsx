import { useSignal } from "@preact/signals"
import { useEffect } from "preact/hooks"
import { cn } from "../utils.ts"

export function genId() {
	const chars = "0123456789abcdefghijklmnopqrstuvwxyz"
	let result = ""
	for (let i = 0; i < 8; i++) {
		result += chars[Math.floor(Math.random() * chars.length)]
		if (i === 3) result += "-"
	}
	return result
}

export function PlayerID(props: { class?: string }) {
	const playerid = useSignal<string | null>(null)

	useEffect(() => {
		playerid.value = localStorage.getItem("playerID") ?? genId()
		localStorage.setItem("playerID", playerid.value)
	}, [])

	return playerid.value ? <span class={cn("text-sm text-gray-600/60", props.class)}>Player ID: {playerid.value}</span> : null
}
