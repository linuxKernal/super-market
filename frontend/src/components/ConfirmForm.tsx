import type { ReactNode } from "react";

type Props = {
    children: ReactNode;
    handleCancel: () => void;
    handleConfirm: () => void;
};

function ConfirmForm({ children, handleCancel, handleConfirm }: Props) {
    return (
        <div className="bg-white p-8 rounded-sm pt-10 w-96 space-y-4">
            {children}
            <div className="flex gap-3 justify-center">
                <button
                    onClick={handleCancel}
                    className="bg-green-500 text-white py-2 w-1/3 rounded-sm"
                >
                    Cancel
                </button>
                <button
                    onClick={handleConfirm}
                    className="border border-red-500 text-red-500 py-2 w-1/3 rounded-sm"
                >
                    Delete
                </button>
            </div>
        </div>
    );
}

export default ConfirmForm;
