type Props = {
    handleIncrement: () => void;
    handleDecrement: () => void;
    count: number;
};

export default function ProductCounter({
    handleIncrement,
    handleDecrement,
    count,
}: Props) {
    return (
        <div
            className={`flex w-fit rounded-md border ${
                count <= 0
                    ? "border-green-600 text-green-600"
                    : "border-green-600 text-white bg-green-600"
            }  cursor-pointer`}
        >
            {count <= 0 ? (
                <button
                    className="font-bold py-1 px-4 text-center w-full"
                    onClick={handleIncrement}
                >
                    ADD
                </button>
            ) : (
                <>
                    <button
                        className="px-2 py-1 rounded-l-md font-semibold"
                        onClick={handleDecrement}
                    >
                        -
                    </button>
                    <p className="py-1 w-[20px] text-center cursor-default select-none">
                        {count}
                    </p>
                    <button
                        className="px-2 py-1 rounded-r-md font-semibold"
                        onClick={handleIncrement}
                    >
                        +
                    </button>
                </>
            )}
        </div>
    );
}
