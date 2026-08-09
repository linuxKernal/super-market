type Props = {
    handleToggle: (value: boolean) => void;
    id: string;
    checked: boolean;
};

function ToggleSwitch({ checked, handleToggle, id }: Props) {
    return (
        <button
            type="button"
            id={id}
            onClick={() => handleToggle(!checked)}
            className={`
        relative inline-flex flex-shrink-0 h-7 w-14 border-2 border-transparent 
        rounded-full cursor-pointer transition-colors ease-in-out duration-200 
        focus:outline-none
        ${checked ? "bg-green-500" : "bg-gray-200"}
      `}
            role="switch"
            aria-checked={checked}
        >
            <span className="sr-only">Toggle</span>

            <span
                aria-hidden="true"
                className={`
          pointer-events-none inline-block size-[1.4rem] rounded-full bg-white 
          shadow transform ring-0 transition ease-in-out duration-200 my-auto
          ${checked ? "translate-x-7" : "translate-x-0.5"}
        `}
            />
        </button>
    );
}

export default ToggleSwitch;
