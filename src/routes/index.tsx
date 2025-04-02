import { ComponentProps } from "preact"
import { PlayerID } from "../islands/ID.tsx"

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
				<div className="w-full flex flex-col items-center gap-2 bg-white/50 border border-gray-300/75 shadow-lg p-2 backdrop-blur-md rounded-xl">
					<strong class="text-2xl">
						Chơi cá nhân
					</strong>
					<div className="flex w-full gap-4">
						<Mode href="/singleplayer">
							Chơi ngay
						</Mode>
						<Mode accent="#FF9800" href="/multiplayer">
							Bảng xếp hạng
						</Mode>
					</div>
				</div>
				<div className="w-full flex flex-col items-center gap-2 bg-white/50 border border-gray-300/75 shadow-lg p-2 backdrop-blur-md rounded-xl">
					<strong class="text-2xl">
						Chơi theo nhóm
					</strong>
					<div className="flex w-full gap-4">
						<Mode accent="#58A674" href="/multiplayer/host">
							Tạo phòng
						</Mode>
						<Mode accent="#b48ead" href="/multiplayer/join">
							Tham gia phòng
						</Mode>
					</div>
				</div>
				<hr class="border border-gray-400/50 w-11/12" />
				<Mode accent="#000" href="/browser">
					<strong class="text-2xl">
						Kiểm tra câu hỏi
					</strong>
				</Mode>
			</div>
			<PlayerID />
		</div>
	)
}
