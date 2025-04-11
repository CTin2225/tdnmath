import { MouseEvent, useEffect } from "react";
import { Button } from "./button";
import { Row } from "@/types";
import handlePlayGame from "@/utils/handlePlayGame";
import { ButtonName, buttonNames, listButtons } from "@/constants";

const KeyBoard = ({
    screenArray,
    setScreenArray,
    rowIndex,
    setRowIndex,
    columnIndex,
    setColumnIndex,
    equationExpected,
    disabled,
    setDisabled,
    setGameState,
}: {
    screenArray: Row[];
    setScreenArray: React.Dispatch<React.SetStateAction<Row[]>>;
    rowIndex: number;
    setRowIndex: React.Dispatch<React.SetStateAction<number>>;
    columnIndex: number;
    setColumnIndex: React.Dispatch<React.SetStateAction<number>>;
    equationExpected: { left: string; right: string };
    disabled: string[];
    setDisabled: React.Dispatch<React.SetStateAction<string[]>>;
    setGameState: React.Dispatch<React.SetStateAction<number>>;
}) => {
    useEffect(() => {
        if (columnIndex <= 5) {
            setDisabled((prevState) => [...prevState, "="]);
        } else {
            setDisabled((prevState) =>
                prevState.filter((item) => item !== "=")
            );
        }
        if (columnIndex <= 0) {
            setDisabled((prevState) => [...prevState, "D"]);
        } else {
            setDisabled((prevState) =>
                prevState.filter((item) => item !== "D")
            );
        }
    }, [columnIndex, setDisabled]);

    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
        const input = (e.target as HTMLElement).getAttribute("name");

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

    return (
        <div className="justify-self-end pb-2">
            <div className="grid grid-cols-3 gap-[5px]">
                {listButtons.map((btn: ButtonName) => (
                    <Button
                        disabled={disabled.includes(buttonNames[btn])}
                        onClick={handleClick}
                        name={buttonNames[btn]}
                        className="p-7 text-lg"
                        key={buttonNames[btn]}>
                        {btn}
                    </Button>
                ))}
            </div>
        </div>
    );
};

export default KeyBoard;
