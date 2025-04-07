function randRange(lower: number, upper = 0) {
    if (lower > upper) [upper, lower] = [lower, upper];
    return Math.floor(Math.random() * (upper - lower + 1)) + lower;
}

const pickArray = <T>(arr: T[]): T =>
    arr[randRange(arr.length * 10) % arr.length];

const getEquation = () => {
    let firstNum = randRange(0, 10 ** ((randRange(0, 12) % 2) + 1) - 1);
    let secondNum = Math.min(
        99 - firstNum,
        randRange(
            10 ** (3 - firstNum.toString().length) - 2,
            10 ** (3 - firstNum.toString().length) - 1
        )
    );
    const operator = pickArray(["+", "-"] as const);

    if (operator === "-" && firstNum < secondNum)
        [firstNum, secondNum] = [secondNum, firstNum];

    const left = `${firstNum}${operator}${secondNum}`;
    const right = (
        operator === "-"
            ? Math.max(firstNum, secondNum) - Math.min(firstNum, secondNum)
            : firstNum + secondNum
    )
        .toString()
        .padStart(2, "0");

    return { left, right };
};

export default getEquation;
