import { Row } from "@/types";
import Mexp from "math-expression-evaluator";
import { buttonNames } from "@/constants";

const mexp = new Mexp();

const genColors = (answer: string, response: string) => {
    const output: number[] = Array(6).fill(1);
    const chars = response.split("").map((e, i) => [e, i] as const);

    for (const [, i] of chars.filter(([c, i]) => answer[i] === c)) {
        output[i] = 3;
        answer = answer.slice(0, i) + "x" + answer.slice(i + 1);
    }

    for (const [char, i] of chars.filter(
        ([c, i]) => answer[i] !== c && answer[i] !== "x"
    )) {
        if (answer.includes(char)) {
            output[i] = 2;
            const ind = answer.indexOf(char);
            answer = answer.slice(0, ind) + "x" + answer.slice(ind + 1);
        }
    }

    return output;
};

const handlePlayGame = (
    equationExpected: { left: string; right: string },
    input: string,
    screenArray: Row[],
    setScreenArray: React.Dispatch<React.SetStateAction<Row[]>>,
    rowIndex: number,
    setRowIndex: React.Dispatch<React.SetStateAction<number>>,
    columnIndex: number,
    setColumnIndex: React.Dispatch<React.SetStateAction<number>>,
    disabled: string[],
    setDisabled: React.Dispatch<React.SetStateAction<string[]>>
) => {
    const updatedScreenArray = [...screenArray];

    try {
        switch (input) {
            case "N":
                window.location.reload();
                break;
            case "D":
                if (columnIndex > 4) {
                    updatedScreenArray[rowIndex].right[columnIndex - 5].text =
                        "";
                } else
                    updatedScreenArray[rowIndex].left[columnIndex - 1].text =
                        "";
                setColumnIndex(columnIndex - 1);
                break;
            case "=":
                if (columnIndex > 5) {
                    const leftEquation = updatedScreenArray[rowIndex].left
                        .map((item) => item.text)
                        .join("");
                    const rightEquation = updatedScreenArray[rowIndex].right
                        .map((item) => item.text)
                        .join("");

                    const resultLeftEquation = mexp.eval(
                        leftEquation,
                        [mexp.tokens[39], mexp.tokens[40]],
                        { "+": 23, "-": 47 }
                    );

                    if (
                        resultLeftEquation !== Number(rightEquation) ||
                        (!leftEquation.includes("+") &&
                            !leftEquation.includes("-"))
                    ) {
                        alert("Phương trình không hợp lệ");
                        return;
                    }

                    const stringOutput = leftEquation + rightEquation;
                    const stringExpected =
                        equationExpected.left + equationExpected.right;

                    const rowResult = genColors(stringExpected, stringOutput);

                    console.log(rowResult)

                    for (let i = 0; i < rowResult.length; i++) {
                        if (i >= 4)
                            updatedScreenArray[rowIndex].right[i - 4].state =
                                rowResult[i] as 0 | 1 | 2 | 3;
                        else
                            updatedScreenArray[rowIndex].left[i].state =
                                rowResult[i] as 0 | 1 | 2 | 3;
                    }

                    let newDisabled = [...disabled];

                    let checkAccepted = true;
                    for (let i = 0; i < rowResult.length; i++) {
                        if (rowResult[i] !== 3) {
                            checkAccepted = false;
                            break;
                        }
                    }
                    if (checkAccepted)
                        newDisabled = Object.values(buttonNames).filter(
                            (item) => item !== "N"
                        );

                    setDisabled(newDisabled);
                    setRowIndex(rowIndex + 1);
                    setColumnIndex(0);
                }
                break;
            default:
                if (columnIndex >= 4) {
                    updatedScreenArray[rowIndex].right[columnIndex - 4].text =
                        input as string;
                } else
                    updatedScreenArray[rowIndex].left[columnIndex].text =
                        input as string;
                setColumnIndex(columnIndex + 1);
        }
    } catch (error) {
        console.log(error)
        alert("Không thể nhập");
    }
    setScreenArray(updatedScreenArray);
};

export default handlePlayGame;
