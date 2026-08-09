export default function CardskeletonLoading() {
    return (
        <div>
            <div className="w-56 border border-neutral-200 animate-pulse rounded-md grid grid-rows-[auto_1fr] relative pointer-events-none">
                <div className="w-full h-40 relative">
                    <div className="w-full h-[160px] object-contain rounded-t-md bg-neutral-200"></div>
                </div>
                <div className="p-4 text-neutral-800 flex flex-col justify-between">
                    <div className="space-y-1">
                        <h1 className="text-sm font-semibold bg-neutral-200 w-8/12 h-4 rounded-lg"></h1>
                        <p className="bg-neutral-200 w-5/12 h-3 rounded-lg"></p>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                        <div className="flex gap-1 items-center flex-wrap w-1/2">
                            <b className="font-bold leading-3 flex bg-neutral-200 w-5/12 h-3 rounded-lg"></b>
                        </div>
                        <div className="bg-neutral-200 w-16 h-6 rounded-md"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
