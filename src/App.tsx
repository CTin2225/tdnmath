import { useEffect, useRef, useState } from "react";
import "./App.css";
import KeyBoard from "./components/ui/KeyBoard";
import Screen from "./components/ui/Screen";
import { Separator } from "./components/ui/separator";
import { Row } from "./types";
import getEquation from "./utils/getEquation";
import handlePlayGame from "./utils/handlePlayGame";

const initialState: Array<Row> = [
    {
        left: [
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
        ],
        right: [
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
        ],
    },
    {
        left: [
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
        ],
        right: [
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
        ],
    },
    {
        left: [
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
        ],
        right: [
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
        ],
    },
    {
        left: [
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
        ],
        right: [
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
        ],
    },
    {
        left: [
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
        ],
        right: [
            {
                text: "",
                state: 0,
            },
            {
                text: "",
                state: 0,
            },
        ],
    },
];

const equationExpected = getEquation();
function App() {
    const [screenArray, setScreenArray] = useState<Array<Row>>(initialState);
    const [rowIndex, setRowIndex] = useState<number>(0);
    const [columnIndex, setColumnIndex] = useState<number>(0);
    const [disabled, setDisabled] = useState<string[]>([]);

    const [timeLeft, setTimeLeft] = useState<number>(90);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const [gameState, setGameState] = useState<number>(0);

    const handleTimeOut = (gameState: number) => {
        // alert("Hết giờ rồi thằng nhóc!");
        if (gameState == 1) alert("Bạn thua rồi, chơi lại bạn nhé hihi");
        else alert("Uầy bạn là nhất, nhất bạn rồi");

        window.location.reload();
    }
    
    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current) // Clear existing timer
    
        timerRef.current = setInterval(() => {
          setTimeLeft((prevTime) => {
            if (prevTime <= 1) {
              clearInterval(timerRef.current!)
              // Defer the call to onTimeout to avoid updating parent state during render
              setTimeout(() => {
                setGameState(1);
              }, 0)
              return 0
            }
            return prevTime - 1
          })
        }, 1000)
    
        return () => {
          if (timerRef.current) clearInterval(timerRef.current)
        }
      }, [handleTimeOut])

      useEffect(() => {
        if (gameState == 0 && rowIndex >= 5) setGameState(1);
      }, [rowIndex, gameState]);
      useEffect(() => {
        if (gameState == 0) return;
        handleTimeOut(gameState);
      }, [gameState]);

    useEffect(() => {
        const handleKeyDown = (e: { key: string }) => {
            let input = "";
            if (e.key === "Enter") input = "=";
            else if (e.key === "Backspace" || e.key === "Delete") input = "D";
            else if (
                [
                    "+",
                    "-",
                    "0",
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                ].includes(e.key)
            )
                input = e.key;

            // console.log(e.key);
            if (input !== "")
                handlePlayGame(
                    equationExpected,
                    input as string,
                    screenArray,
                    setScreenArray,
                    rowIndex,
                    setRowIndex,
                    columnIndex,
                    setColumnIndex,
                    disabled,
                    setDisabled,
                    setGameState
                );
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [columnIndex, disabled, rowIndex, screenArray]);

    return (
        <div className="flex justify-center h-screen">
            <div className="max-w-[400px] w-full flex items-center flex-col">
                <span className="text-3xl font-medium">MATHLE by Tổ Toán TĐN</span>
                <Separator />
                <h1 className="font-bold text-2xl mt-8">Thời gian còn lại: 
                    <span className={`${timeLeft <= 10 ? "text-red-500" : "text-black"} ml-1`}>{timeLeft}s</span>
                </h1>
                <Screen screenArray={screenArray} />
                <KeyBoard
                    screenArray={screenArray}
                    setScreenArray={setScreenArray}
                    rowIndex={rowIndex}
                    setRowIndex={setRowIndex}
                    columnIndex={columnIndex}
                    setColumnIndex={setColumnIndex}
                    equationExpected={equationExpected}
                    disabled={disabled}
                    setDisabled={setDisabled}
                    setGameState={setGameState}
                />
            </div>
        </div>
    );
}

export default App;
