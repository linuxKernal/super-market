import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { type Table as TableType } from "@tanstack/react-table";
import { useMemo } from "react";

export default function TableSelectFilter<T>({
    columnName,
    table,
}: {
    columnName: string;
    table: TableType<T>;
}) {
    const column = table.getColumn(columnName)!;

    const sortedUniqueValues = useMemo(
        () =>
            Array.from(column.getFacetedUniqueValues().keys())
                .sort()
                .slice(0, 5000),
        [column.getFacetedUniqueValues()]
    );

    return (
        <Select
            onValueChange={(value) =>
                value === "null"
                    ? column.setFilterValue("")
                    : column.setFilterValue(value)
            }
        >
            <SelectTrigger className="w-[180px] !outline-none !ring-0 focus:!outline-none focus:!ring-0">
                <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent className="bg-white">
                <SelectItem value="null" key="">
                    Default
                </SelectItem>
                {sortedUniqueValues.map((value) => (
                    <SelectItem
                        value={value}
                        key={value}
                        className="hover:bg-black/10"
                    >
                        <div className="font-semibold">{value}</div>
                        <div className="text-neutral-600">
                            ({column.getFacetedUniqueValues().get(value)})
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
