import { Row } from "@/types";

const colorState = [
    "border-blue-300",
    "bg-gray-400",
    "bg-amber-400",
    "bg-green-300",
];

const Screen = ({ screenArray }: { screenArray: Array<Row> }) => {
    return (
        <div className="grow flex flex-col items-center justify-center flex-1 text-center">
            <div className="grid grid-rows-5  w-[400px] gap-[5px]">
                {screenArray.map((items: Row, index1: number) => (
                    <div
                        key={index1}
                        className="grid grid-cols-7 px-4 gap-[8px]">
                        {items.left.map((item, index2) => (
                            <div
                                key={index2}
                                className={`border h-[50px] flex justify-center items-center ${
                                    colorState[item.state]
                                }`}>
                                {item.text}
                            </div>
                        ))}
                        <div className="text-lg flex justify-center items-center">
                            =
                        </div>
                        {items.right.map((item, index2) => (
                            <div
                                key={index2}
                                className={`border h-[50px] flex justify-center items-center ${
                                    colorState[item.state]
                                }`}>
                                {item.text}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Screen;
