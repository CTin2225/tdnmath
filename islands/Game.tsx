import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";
type GameCardProps = {
  name: string;
  description: string;
  href: string;
  image: string;
  children?: any;
  qr?: string;
};

export default function GameCard(props: GameCardProps) {
  const showModal = useSignal(false);
  const scrollPosition = useSignal(0);

  // Effect to handle scroll locking and restoration
  useEffect(() => {
    if (showModal.value) {
      // Save current scroll position
      scrollPosition.value = window.scrollY;
      // Scroll to top
      window.scrollTo(0, 0);
      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      // Restore scroll position
      document.body.style.overflow = "";
      window.scrollTo(0, scrollPosition.value);
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [showModal.value]);

  return (
    <>
      <button
        type="button"
        class="max-w-full bg-white rounded-xl shadow-md p-8 flex flex-col lg:flex-row flex-wrap gap-4 justify-between hover:scale-110 ease-out transition-all items-center text-balance text-center text-blue-400"
        onClick={() => {
          showModal.value = true;
        }}
      >
        <img
          src={`/${props.image}`}
          class="w-1/3 max-w-24 lg:w-full h-auto"
        />
        <div className="flex flex-col gap-1 mx-auto">
          <h2 class="text-xl font-bold">{props.name}</h2>
          <p class="">{props.description}</p>
        </div>
        {props.qr && (
          <img
            src={`/${props.qr}`}
            class="w-1/3 max-w-24 lg:w-full h-auto"
            alt="QR code"
          />
        )}
      </button>
      <div
        class={`fixed inset-0 bg-black/90 flex justify-center transition-all duration-300 z-10 p-4 ${
          showModal.value ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) showModal.value = false;
        }}
      >
        <div class="sticky top-2 flex flex-col gap-2 bg-white rounded-lg shadow-lg p-4 w-full max-w-lg h-max max-h-[100dvh]">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold">{props.name} - Hướng dẫn chơi</h2>
            <button
              type="button"
              class="text-red-500"
              onClick={() => (showModal.value = false)}
            >
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="flex flex-col gap-1 overflow-y-auto py-2 border-y max-h-[70dvh] border-black/50">
            {props.children}
          </div>
          <a
            class="bg-blue-400 px-3 py-2 rounded-lg mx-auto mt-2"
            href={props.href}
          >
            Chơi ngay →
          </a>
        </div>
      </div>
    </>
  );
}
