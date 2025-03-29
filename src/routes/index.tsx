import { ComponentProps } from "preact"

function Mode(props: { accent?: string } & ComponentProps<"a">) {
	return (
		<a href={props.href}
			class="w-full text-lg p-4 bg-white/10 backdrop-blur-xl border-2 border-[var(--accent)] hover:bg-[var(--accent)] rounded-lg text-[var(--accent)] hover:text-white text-center transition-all"
			style={{ "--accent": props.accent ?? "#2196f3" }}
		>
			{props.children}
		</a>
	)
}

export default function Home() {
	return (
		<div class="flex-1 flex flex-col gap-6 items-center justify-center px-4 py-8">
			<img src="/logo.svg" class="w-full max-w-64" alt="Logo trường THPT Chuyên Trần Đại Nghĩa" />
			<div class="flex flex-col items-center gap-4">
				<h1 class="text-4xl font-bold text-center text-balance">
					Chào bạn đến với Minigame Toán Học
				</h1>
				<Mode href="/singleplayer">
					<strong class="text-2xl">
						Chơi một người
					</strong>
					<p>
						Tranh top bảng xếp hạng!
					</p>
				</Mode>
				<Mode accent="#68B684" href="/multiplayer">
					<strong class="text-2xl">
						Chơi nhiều người (soon)
					</strong>
					<p>
						Thách đấu với bạn bè!
					</p>
				</Mode>
				<Mode accent="#FF9800" href="/leaderboard">
					<strong class="text-2xl">
						Bảng xếp hạng
					</strong>
					<p>
						Xem ai là người giỏi nhất!
					</p>
				</Mode>
				<Mode accent="#000" href="/browser">
					<strong class="text-2xl">
						Kiểm tra câu hỏi
					</strong>
				</Mode>
			</div>
		</div>
	)
}
