import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Edit } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import type { User } from "./DashboardUsersTab";
import { useState } from "react";
import { API_URL } from "@/config";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import Spinner from "./Spinner";

type Props = {
    user: User;
};

export function UserEditModalAdmin({ user }: Props) {
    const queryClient = useQueryClient();
    const [{ id, role, active }, setUser] = useState(user);
    const [loading, setLoading] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => setIsModalOpen(true);

    const closeModal = () => setIsModalOpen(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/users/${id}`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ role, active }),
            });

            const data = await res.json();

            if (data.status === "success") {
                queryClient.invalidateQueries({ queryKey: ["users"] });
                closeModal();
                toast.success("updated successfully");
            } else throw new Error("update failed. something went wrong");
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : typeof error === "string"
                        ? error
                        : "something went wrong";
            toast.error(message);
        } finally {
            setLoading(false);
        }
    }
    return (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
                <Button
                    onClick={openModal}
                    variant="outline"
                    size="sm"
                    className="text-orange-400"
                >
                    <Edit className="size-4" />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white border-none">
                <DialogHeader>
                    <DialogTitle>Edit profile</DialogTitle>
                    <DialogDescription>
                        Make changes to your profile here. Click save when
                        you&apos;re done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4">
                        <div className="grid gap-3">
                            <Label htmlFor="name-1">Role</Label>
                            <Select
                                defaultValue={role}
                                onValueChange={(value) =>
                                    setUser((prev) => ({
                                        ...prev,
                                        role: value,
                                    }))
                                }
                            >
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="select" />
                                </SelectTrigger>
                                <SelectContent className="bg-white">
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="user">User</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-3">
                            <Label htmlFor="username-1">Status</Label>
                            <div className="flex items-center space-x-2">
                                <Switch
                                    checked={active}
                                    onCheckedChange={(value) =>
                                        setUser((prev) => ({
                                            ...prev,
                                            active: value,
                                        }))
                                    }
                                    id="airplane-mode"
                                    className="bg-neutral-300 data-[state=checked]:bg-green-500"
                                />
                                <Label htmlFor="airplane-mode">
                                    Active/Inactive
                                </Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                disabled={loading}
                                className="border-red-500 text-red-500"
                            >
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-green-500 text-white px-4 disabled:bg-green-300 flex gap-2"
                        >
                            Save
                            {loading && <Spinner />}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
