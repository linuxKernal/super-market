import { useMemo, useState } from "react";
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getGroupedRowModel,
    getSortedRowModel,
    useReactTable,
    getFacetedRowModel,
    getFacetedUniqueValues,
    type GroupingState,
    type RowSelectionState,
    type SortingState,
    getPaginationRowModel,
    type VisibilityState,
} from "@tanstack/react-table";
import { Trash2, Edit, X, ChevronDown } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

import { Checkbox } from "@/components/ui/checkbox";
import type { Product } from "./Products";
import { Input } from "@/components/ui/input";
import SortIcon from "./SortIcon";
import { Button } from "./ui/button";
import TableSelectFilter from "./TableSelectFilter";
import type { ActionType } from "./ProductTab";
import Spinner from "./Spinner";

export interface ProductMain extends Product {
    categoryName: string;
    subCategoryName: string;
}

type Props = {
    products: ProductMain[];
    loading: boolean;
    handleProductAction: (type: ActionType, id: number) => void;
};

const columnHelper = createColumnHelper<ProductMain>();

const HeaderLabel = ({ name }: { name: string }) => {
    return (
        <span className="flex items-center">
            <p className="capitalize break-words whitespace-normal">{name}</p>
        </span>
    );
};

const PER_PAGE = 10;

export default function ProductDataTable({
    products,
    loading,
    handleProductAction,
}: Props) {
    const [globalFilter, setGlobalFilter] = useState();
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [pagination, setPagination] = useState({
        pageIndex: 5,
        pageSize: PER_PAGE,
    });

    const [sorting, setSorting] = useState<SortingState>([
        {
            id: "id",
            desc: false,
        },
    ]);
    const [groupBy, setGroupBy] = useState<GroupingState>([]);

    const columns = useMemo(
        function () {
            return [
                columnHelper.display({
                    id: "select-col",
                    enableHiding: false,
                    enableSorting: false,
                    header: ({ table }) => (
                        <div className="flex justify-center w-10">
                            <Checkbox
                                id="select_all"
                                checked={table.getIsAllPageRowsSelected()}
                                onClick={table.getToggleAllRowsSelectedHandler()}
                            />
                        </div>
                    ),
                    cell: ({ row }) => (
                        <div className="flex justify-center w-10">
                            <Checkbox
                                checked={row.getIsSelected()}
                                disabled={!row.getCanSelect()}
                                onClick={row.getToggleSelectedHandler()}
                            />
                        </div>
                    ),
                    enableResizing: false,
                    size: 10,
                }),
                columnHelper.accessor("id", {
                    footer: (info) => info.column.id,
                    size: 10,
                }),
                columnHelper.accessor((row) => row.name, {
                    id: "Product Name",
                    header: () => <HeaderLabel name="Product Name" />,
                    footer: (info) => info.column.id,
                    filterFn: "includesString",
                }),
                columnHelper.accessor("categoryName", {
                    header: () => <HeaderLabel name="Category Name" />,
                    cell: (info) => info.renderValue(),
                    footer: (info) => info.column.id,
                }),
                columnHelper.accessor("subCategoryName", {
                    header: () => <HeaderLabel name="Sub Category" />,

                    footer: (info) => info.column.id,
                }),
                columnHelper.accessor("price", {
                    header: () => <HeaderLabel name="Price" />,
                    footer: (info) => info.column.id,
                    aggregationFn: "max",
                    size: 30,
                }),
                columnHelper.accessor("weight", {
                    header: () => <HeaderLabel name="Weight" />,
                    footer: (info) => info.column.id,
                    // enableGlobalFilter: false,
                    filterFn: "equals",
                    size: 15,
                }),
                columnHelper.accessor("brandName", {
                    header: () => <HeaderLabel name="Brand Name" />,
                    footer: (info) => info.column.id,
                    filterFn: "equals",
                    // enableGlobalFilter: false,
                }),
                columnHelper.accessor("stocks", {
                    header: () => <HeaderLabel name="Stocks" />,
                    footer: (info) => info.column.id,
                    size: 15,
                    // enableGlobalFilter: false,
                }),
                columnHelper.accessor("discount", {
                    header: () => <HeaderLabel name="Discount" />,
                    footer: (info) => info.column.id,
                    size: 15,
                    // enableGlobalFilter: false,
                }),
                columnHelper.accessor("active", {
                    header: () => <HeaderLabel name="Status" />,
                    footer: (info) => info.column.id,
                    cell: (info) => {
                        const { active } = info.row.original;
                        return (
                            <Badge
                                className={`${
                                    active
                                        ? "bg-green-100 text-green-500"
                                        : "bg-red-100 text-red-500"
                                }`}
                            >
                                {active ? "active" : "inactive"}
                            </Badge>
                        );
                    },
                    size: 35,
                    enableGlobalFilter: false,
                }),
                columnHelper.display({
                    id: "count",
                    header: "Count",
                    enableSorting: false,
                    aggregationFn: "count",
                    enableHiding: false,
                    cell: (info) => {
                        const { row, getValue } = info;
                        const isGrouped = row.getIsGrouped();
                        if (!isGrouped) return getValue();

                        return (
                            <div
                                style={{ paddingLeft: `${row.depth * 1.5}rem` }}
                                className="cursor-pointer"
                            >
                                {isGrouped ? (
                                    <button
                                        onClick={row.getToggleExpandedHandler()}
                                        style={{ marginRight: "0.5rem" }}
                                    >
                                        <span>
                                            {row.getIsExpanded() ? "▾" : "▸"}{" "}
                                        </span>
                                        <span>
                                            ({row.subRows.length} items)
                                        </span>
                                    </button>
                                ) : null}
                            </div>
                        );
                    },
                    size: 15,
                }),
                columnHelper.display({
                    id: "actions",
                    header: "Action",
                    enableHiding: false,
                    enableSorting: false,
                    size: 60,
                    enableResizing: false,
                    cell: (info) => {
                        return (
                            <div className="flex items-center gap-x-2 justify-center">
                                <button
                                    onClick={() => {
                                        handleProductAction(
                                            "edit",
                                            +info.row.original.id
                                        );
                                    }}
                                >
                                    <Edit className="size-4" />
                                </button>
                                <button
                                    onClick={() => {
                                        handleProductAction(
                                            "delete",
                                            +info.row.original.id
                                        );
                                    }}
                                >
                                    <Trash2 className="text-red-500 size-4" />
                                </button>
                            </div>
                        );
                    },
                }),
            ];
        },
        [handleProductAction]
    );
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        columns.reduce(
            (acc, curr) => {
                if (curr.id && !(curr.id in acc))
                    acc[curr.id] = curr.id !== "count" && true;
                return acc;
            },
            {
                weight: false,
            } as VisibilityState
        )
    );

    // function handleCloseModel() {
    //     setActionId(null);
    //     setActionType(null);
    // }

    const table = useReactTable({
        data: products,
        columns,
        state: {
            globalFilter,
            rowSelection,
            columnVisibility,
            pagination,
            sorting,
            grouping: groupBy,
        },
        getRowId: (row) => String(row.id),
        onSortingChange: setSorting,
        onGroupingChange: setGroupBy,
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        groupedColumnMode: "reorder",
        columnResizeMode: "onChange",
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onPaginationChange: setPagination,
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        getGroupedRowModel: getGroupedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        // globalFilterFn: "arrIncludes",
        // getPaginationRowModel: getPaginationRowModel(),
    });

    const totalPages = Math.ceil(
        table.getFilteredRowModel().rows.length / PER_PAGE
    );
    let start = pagination.pageIndex - 2;
    const end = pagination.pageIndex + 2;

    const paginationDots = [];
    if (totalPages > 1) {
        if (start > 0) {
            paginationDots.push(
                <PaginationItem key={1}>
                    <PaginationLink
                        href="#"
                        data-page={0}
                        isActive={pagination.pageIndex === 0}
                    >
                        {1}
                    </PaginationLink>
                </PaginationItem>
            );
            paginationDots.push(
                <PaginationItem key={"ellipsisStart"}>
                    <PaginationEllipsis />
                </PaginationItem>
            );
        }

        while (start <= end && start < totalPages) {
            if (start >= 0)
                paginationDots.push(
                    <PaginationItem key={start + 1}>
                        <PaginationLink
                            data-page={start}
                            isActive={pagination.pageIndex === start}
                            href="#"
                        >
                            {start + 1}
                        </PaginationLink>
                    </PaginationItem>
                );
            start++;
        }

        if (start < totalPages) {
            paginationDots.push(
                <PaginationItem key={"ellipsisEnd"}>
                    <PaginationEllipsis />
                </PaginationItem>
            );
            paginationDots.push(
                <PaginationItem key={start + 1}>
                    <PaginationLink
                        data-page={start}
                        isActive={pagination.pageIndex === start}
                        href="#"
                    >
                        {start + 1}
                    </PaginationLink>
                </PaginationItem>
            );
        }
    }

    return (
        <div className="h-full">
            <div className="flex gap-4 items-center">
                <Input
                    type="text"
                    onChange={(e) =>
                        table.setGlobalFilter(String(e.target.value))
                    }
                    className="!outline-none !ring-0 focus:!outline-none focus:!ring-0 w-80"
                    placeholder="Search"
                />
                <Select
                    defaultValue="null"
                    onValueChange={(value) => {
                        table.getColumn("count")?.toggleVisibility(true);
                        return value === "null"
                            ? setGroupBy([])
                            : setGroupBy([value]);
                    }}
                >
                    <SelectTrigger className="w-[180px] !outline-none !ring-0 focus:!outline-none focus:!ring-0">
                        <SelectValue placeholder="Group By" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                        <SelectItem value="null">Group by (default)</SelectItem>
                        <SelectItem
                            value="subCategoryName"
                            className="hover:bg-black/10"
                        >
                            Sub Category
                        </SelectItem>
                        <SelectItem value="categoryName">Category</SelectItem>
                    </SelectContent>
                </Select>
                <div className="relative">
                    <TableSelectFilter columnName="brandName" table={table} />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="border border-neutral-300"
                        >
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-56 bg-white border border-neutral-300 divide-y-[1px] divide-neutral-200"
                        align="start"
                    >
                        {table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())
                            .map((column) => (
                                <>
                                    <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="rounded-none py-2"
                                    >
                                        <label
                                            key={column.id}
                                            className="flex gap-x-2 items-center w-full"
                                        >
                                            <input
                                                className="text-neutral-500"
                                                checked={column.getIsVisible()}
                                                disabled={!column.getCanHide()}
                                                onChange={column.getToggleVisibilityHandler()}
                                                type="checkbox"
                                            />
                                            {column.id}
                                        </label>
                                    </DropdownMenuItem>
                                </>
                            ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {(table.getIsSomeRowsSelected() ||
                    table.getIsAllRowsSelected()) && (
                    <Button variant="outline" className="text-red-500">
                        <X />
                        Delete
                    </Button>
                )}
            </div>
            <div className="mt-4 text-sm text-zinc-600">
                {Object.keys(rowSelection).length !== 0 &&
                    `Selected ${Object.keys(rowSelection).length} rows`}
            </div>
            <div className="relative h-full pb-8">
                {loading && (
                    <div className="absolute inset-0 flex justify-center items-center z-100">
                        <Spinner />
                    </div>
                )}
                <Table className="text-neutral-800 h-full">
                    <TableHeader className="bg-sky-500 text-white">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className={``}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead
                                        {...{
                                            key: header.id,
                                            colSpan: header.colSpan,
                                            style: {
                                                width: `${header.getSize()}px`,
                                            },
                                        }}
                                        className={` relative border-r ${
                                            header.column.getCanSort()
                                                ? "cursor-pointer select-none"
                                                : ""
                                        }`}
                                    >
                                        <div className="flex w-full">
                                            <div
                                                className={`w-full ${
                                                    header.column.getCanSort() &&
                                                    "flex gap-x-2"
                                                }`}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                          header.column
                                                              .columnDef.header,
                                                          header.getContext()
                                                      )}
                                                {header.column.getCanSort() && (
                                                    <SortIcon
                                                        status={
                                                            header.column.getIsSorted() ||
                                                            "default"
                                                        }
                                                    />
                                                )}
                                            </div>
                                            {header.column.getCanResize() && (
                                                <div
                                                    style={{
                                                        transform: `translateX(${
                                                            (table.options
                                                                .columnResizeDirection ===
                                                            "rtl"
                                                                ? -1
                                                                : 1) *
                                                            (table.getState()
                                                                .columnSizingInfo
                                                                .deltaOffset ??
                                                                0)
                                                        }px)`,
                                                    }}
                                                    className={`resizer ${
                                                        table.options
                                                            .columnResizeDirection
                                                    } ${
                                                        header.column.getIsResizing()
                                                            ? "isResizing"
                                                            : ""
                                                    }`}
                                                    {...{
                                                        onDoubleClick: () =>
                                                            header.column.resetSize(),
                                                        onMouseDown:
                                                            header.getResizeHandler(),
                                                        onTouchStart:
                                                            header.getResizeHandler(),
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                className={` odd:bg-white even:bg-gray-100 border-none ${
                                    row.getIsExpanded() &&
                                    "bg-green-50 text-green-600"
                                }`}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                        key={cell.id}
                                        className="border-r border-r-white break-words whitespace-normal"
                                    >
                                        <div
                                            className=""
                                            style={{
                                                paddingLeft: `${
                                                    row.depth * 1.5
                                                }rem`,
                                                width: cell.column.getSize(),
                                            }}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </div>
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                <div className="my-8 pb-8">
                    {(table.getCanPreviousPage() || table.getCanNextPage()) && (
                        <Pagination>
                            <PaginationContent
                                onClick={(e) => {
                                    const target =
                                        e.target as HTMLElement | null;
                                    const page = target?.dataset?.page;
                                    if (page) table.setPageIndex(+page);
                                }}
                            >
                                <PaginationItem
                                    className={`select-none ${
                                        !table.getCanPreviousPage() &&
                                        "opacity-40 pointer-events-none"
                                    }`}
                                    onClick={() => table.previousPage()}
                                >
                                    <PaginationPrevious href="#" />
                                </PaginationItem>
                                {paginationDots}
                                <PaginationItem
                                    onClick={() => table.nextPage()}
                                    className={`select-none ${
                                        !table.getCanNextPage() &&
                                        "opacity-40 pointer-events-none"
                                    }`}
                                >
                                    <PaginationNext href="#" />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </div>
            </div>
        </div>
    );
}
