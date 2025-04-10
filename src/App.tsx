import { useEffect, useState } from "react";
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
                    setDisabled
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
                />
            </div>
        </div>
    );
}

export default App;
