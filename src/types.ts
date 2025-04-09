export type Question = {
	difficulty: number
	question: string
	image: string | null
	choices: string[]
	answer: string | number
	explanation: string | null
	id: number
}

export type Room = {
	status: "waiting" | "playing" | "finished"
	questions: Question[]
	players: string[]
}
