import { API_URL } from "@/config";
import { useQuery } from "@tanstack/react-query";
import UserDataTable from "./UserDataTable";

export type User = {
    id: number;
    fullname: string;
    email: string;
    login_type: string;
    role: string;
    active: boolean;
    created_at: Date;
};

async function fetchUsers() {
    const res = await fetch(`${API_URL}/users`, {
        credentials: "include",
    });
    const data = await res.json();

    return data;
}

export default function DashboardUsersTab() {
    const { data: users = [], isLoading: loading } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await fetchUsers();
            if (res.status === "success") return res.data as User[];
            return [];
        },
    });

    return (
        <div className="p-4">
            <h1 className="mb-4 mt-2 text-2xl font-medium">Users</h1>
            <UserDataTable users={users} loading={loading} />
        </div>
    );
}
