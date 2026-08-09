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
import { X, ChevronDown } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import SortIcon from "./SortIcon";
import { Button } from "./ui/button";
import TableSelectFilter from "./TableSelectFilter";
import Spinner from "./Spinner";
import type { User } from "./DashboardUsersTab";
import { UserEditModalAdmin } from "./UserEditModalAdmin";

type Props = {
    users: User[];
    loading: boolean;
};

const columnHelper = createColumnHelper<User>();

const PER_PAGE = 10;

export default function UserDataTable({ users, loading }: Props) {
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

    const columns = useMemo(function () {
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
            columnHelper.accessor((row) => row.fullname, {
                id: "Full Name",
                footer: (info) => info.column.id,
                filterFn: "includesString",
            }),
            columnHelper.accessor("email", {
                cell: (info) => info.renderValue(),
                footer: (info) => info.column.id,
            }),
            columnHelper.accessor("login_type", {
                header: () => "Login Type",
                size: 35,
                footer: (info) => info.column.id,
                enableGlobalFilter: false,
            }),
            columnHelper.accessor("role", {
                size: 35,
                footer: (info) => info.column.id,
                cell: (info) => {
                    const { role } = info.row.original;
                    const isAdmin = role === "admin";
                    return (
                        <Badge
                            variant={"outline"}
                            className={`${
                                isAdmin ? "text-orange-500" : "text-sky-500"
                            }`}
                        >
                            {role}
                        </Badge>
                    );
                },
                enableGlobalFilter: false,
            }),
            columnHelper.accessor("created_at", {
                header: () => "Created At",
                footer: (info) => info.column.id,
                cell: (info) => (
                    <span className="whitespace-nowrap">
                        {new Intl.DateTimeFormat("en-GB", {
                            year: "numeric",
                            month: "short",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                        }).format(new Date(info.row.original.created_at))}
                    </span>
                ),
                // enableGlobalFilter: false,
                filterFn: "equals",
                enableGlobalFilter: false,
                size: 15,
            }),
            columnHelper.accessor("active", {
                header: () => "status",
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
                id: "actions",
                header: "Action",
                enableHiding: false,
                enableSorting: false,
                size: 60,
                enableResizing: false,
                enableGlobalFilter: false,
                cell: (info) => {
                    return (
                        <div className="flex items-center justify-start">
                            <UserEditModalAdmin user={info.row.original} />
                        </div>
                    );
                },
            }),
        ];
    }, []);
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
        data: users,
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

                <div className="relative">
                    <TableSelectFilter columnName="login_type" table={table} />
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
                                                className={`w-full capitalize ${
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
                                key={row.index}
                                className={` odd:bg-white even:bg-gray-100 border-none ${
                                    row.getIsExpanded() &&
                                    "bg-green-50 text-green-600"
                                }`}
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell
                                        key={cell.column.id}
                                        style={{
                                            width: `${cell.column.getSize()}px`,
                                        }}
                                        className="border-r border-r-white break-words whitespace-normal"
                                    >
                                        <div
                                            className=""
                                            style={{
                                                paddingLeft: `${
                                                    row.depth * 1.5
                                                }rem`,
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
