import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/authContext";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "react-toastify";
import { API_URL } from "@/config";
import { Edit, Plus, MapPin, Check, Camera } from "lucide-react";
import { Country, State } from "country-state-city";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface AddressData {
    id?: number;
    name: string;
    address_1: string;
    address_2: string;
    mobile: string;
    landmark: string;
    pincode: string;
    city: string;
    state: string;
    country_code: string;
    is_default_shipping: boolean;
}

const emptyAddress: AddressData = {
    name: "",
    address_1: "",
    address_2: "",
    mobile: "",
    landmark: "",
    pincode: "",
    city: "",
    state: "",
    country_code: "",
    is_default_shipping: false,
};

const profileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters")
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"]
});
type PasswordFormValues = z.infer<typeof passwordSchema>;

const addressSchema = z.object({
    name: z.string().min(1, "Name is required"),
    address_1: z.string().min(1, "Address line 1 is required"),
    address_2: z.string(),
    mobile: z.string().min(10, "Valid mobile number is required"),
    landmark: z.string(),
    city: z.string().min(1, "City is required"),
    pincode: z.string().min(4, "Valid pincode is required"),
    country_code: z.string().min(1, "Country is required"),
    state: z.string().min(1, "State is required"),
    is_default_shipping: z.boolean(),
});
type AddressFormValues = z.infer<typeof addressSchema>;

export default function SettingsPage() {
    const { user, setUserData } = useAuth();

    const [image, setImage] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [addresses, setAddresses] = useState<AddressData[]>([]);
    const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: "" },
    });

    const passwordForm = useForm<PasswordFormValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
        },
    });

    const addressForm = useForm<AddressFormValues>({
        resolver: zodResolver(addressSchema),
        defaultValues: emptyAddress as any,
    });

    const fetchAddresses = async () => {
        try {
            const res = await fetch(`${API_URL}/users/me/addresses`, {
                credentials: "include",
            });
            const data = await res.json();
            if (data.status === "success") {
                setAddresses(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch addresses", error);
        }
    };

    useEffect(() => {
        if (user) {
            profileForm.reset({ name: user.fullname || "" });
            setImage(user.image || "");
            setImagePreview(user.image || "");
            fetchAddresses();
        }
    }, [user, profileForm]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                toast.error("Please select an image file.");
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image must be less than 5MB.");
                return;
            }
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleProfileSubmit = async (values: ProfileFormValues) => {
        if (!user) return;

        setIsSaving(true);
        try {
            let imageUrl = image;

            if (imageFile) {
                const formData = new FormData();
                formData.append("file", imageFile);

                const uploadRes = await fetch(
                    `${API_URL}/users/profile-image`,
                    {
                        method: "POST",
                        body: formData,
                        credentials: "include",
                    }
                );
                const uploadData = await uploadRes.json();
                if (uploadData.status === "success") {
                    imageUrl = uploadData.public_url;
                    setImage(imageUrl);
                    setImageFile(null);
                } else {
                    toast.error(uploadData.detail || "Failed to upload image.");
                    setIsSaving(false);
                    return;
                }
            }

            const res = await fetch(`${API_URL}/users/${user.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ fullname: values.name, image: imageUrl }),
                credentials: "include",
            });
            const data = await res.json();
            if (data.status === "success") {
                setUserData(data.data);
                toast.success("Profile updated successfully!");
            } else {
                toast.error(data.message || "Failed to update profile.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while updating profile.");
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordSubmit = async (values: PasswordFormValues) => {
        setIsSaving(true);
        try {
            const res = await fetch(`${API_URL}/users/me/password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    currentPassword: values.currentPassword,
                    newPassword: values.newPassword,
                }),
                credentials: "include",
            });
            const data = await res.json();
            if (data.status === "success") {
                toast.success("Password updated successfully!");
                passwordForm.reset();
            } else {
                toast.error(data.detail || data.error || "Failed to update password.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while updating the password.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddressSubmit = async (values: AddressFormValues) => {
        setIsSaving(true);

        try {
            const isEditing = editingAddressId !== null;
            const method = isEditing ? "PATCH" : "POST";
            const url = isEditing
                ? `${API_URL}/users/me/addresses/${editingAddressId}`
                : `${API_URL}/users/me/addresses`;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
                credentials: "include",
            });

            const data = await res.json();
            if (data.status === "success") {
                toast.success(
                    isEditing ? "Address updated!" : "Address added!"
                );
                cancelEditing();
                fetchAddresses();
            } else {
                toast.error(data.detail || "Failed to save address.");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while saving address.");
        } finally {
            setIsSaving(false);
        }
    };

    const startEditAddress = (addr: AddressData) => {
        setEditingAddressId(addr.id || null);
        addressForm.reset({
            name: addr.name || "",
            address_1: addr.address_1 || "",
            address_2: addr.address_2 || "",
            mobile: addr.mobile ? String(addr.mobile) : "",
            landmark: addr.landmark || "",
            city: addr.city || "",
            pincode: addr.pincode ? String(addr.pincode) : "",
            country_code: addr.country_code || "",
            state: addr.state || "",
            is_default_shipping: addr.is_default_shipping || false
        });
        setIsAddingNew(false);
    };

    const startAddNew = () => {
        setEditingAddressId(null);
        addressForm.reset({
            ...emptyAddress,
            is_default_shipping: addresses.length === 0,
        } as any);
        setIsAddingNew(true);
    };

    const cancelEditing = () => {
        setEditingAddressId(null);
        setIsAddingNew(false);
        addressForm.reset(emptyAddress as any);
    };

    return (
        <div className="container mx-auto py-10 px-4 md:px-8 space-y-8 max-w-4xl h-full">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your account settings and update your profile
                    information.
                </p>
            </div>

            <div className="grid gap-10">
                <Card>
                    <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
                        <CardHeader className="pb-6">
                            <CardTitle>Profile Details</CardTitle>
                            <CardDescription>
                                Update your personal information and profile picture.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    {...profileForm.register("name")}
                                />
                                {profileForm.formState.errors.name && (
                                    <p className="text-red-500 text-sm">{profileForm.formState.errors.name.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label>Profile Image</Label>
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm bg-gray-100">
                                            {imagePreview ? (
                                                <img
                                                    src={imagePreview}
                                                    alt="Profile preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl font-semibold">
                                                    {profileForm.watch("name")?.charAt(0)?.toUpperCase() || "?"}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute bottom-0 right-0 w-8 h-8 bg-emerald-600 hover:bg-emerald-700 rounded-full flex items-center justify-center shadow-md transition-colors cursor-pointer border-2 border-white"
                                        >
                                            <Camera className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600 mb-1">
                                            Click the camera icon to upload a new photo.
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            JPG, PNG or GIF. Max 5MB.
                                        </p>
                                        {imageFile && (
                                            <p className="text-sm text-emerald-600 mt-2 font-medium">
                                                ✓ {imageFile.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4">
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer rounded-lg px-6 py-2.5 font-medium shadow-sm transition-all hover:shadow-md"
                            >
                                {isSaving ? "Saving..." : "Save Profile"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Password Card */}
                <Card>
                    <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
                        <CardHeader className="pb-6">
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>
                                Secure your account with a fresh password.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    {...passwordForm.register("currentPassword")}
                                />
                                {passwordForm.formState.errors.currentPassword && (
                                    <p className="text-red-500 text-sm">{passwordForm.formState.errors.currentPassword.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    {...passwordForm.register("newPassword")}
                                />
                                {passwordForm.formState.errors.newPassword && (
                                    <p className="text-red-500 text-sm">{passwordForm.formState.errors.newPassword.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm Password</Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    {...passwordForm.register("confirmPassword")}
                                />
                                {passwordForm.formState.errors.confirmPassword && (
                                    <p className="text-red-500 text-sm">{passwordForm.formState.errors.confirmPassword.message}</p>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4">
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="bg-gray-800 hover:bg-gray-900 text-white cursor-pointer rounded-lg px-6 py-2.5 font-medium shadow-sm transition-all hover:shadow-md"
                            >
                                {isSaving ? "Updating Password..." : "Update Password"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                {/* Addresses Card */}
                <Card id="addresses" className="scroll-mt-6">
                    <CardHeader className="pb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Shipping Addresses</CardTitle>
                                <CardDescription className="mt-1.5">
                                    Manage your shipping addresses. You can add multiple addresses and edit them anytime.
                                </CardDescription>
                            </div>
                            {!isAddingNew && editingAddressId === null && (
                                <Button
                                    type="button"
                                    onClick={startAddNew}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer rounded-lg px-4 py-2 font-medium shadow-sm transition-all hover:shadow-md flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Address
                                </Button>
                            )}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-2">
                        {addresses.length > 0 && editingAddressId === null && !isAddingNew && (
                            <div className="grid gap-3">
                                {addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        className="relative flex items-start gap-4 p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-100/70 transition-colors group"
                                    >
                                        <div className="flex-shrink-0 mt-0.5">
                                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <MapPin className="w-5 h-5 text-emerald-600" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {addr.name && (
                                                    <span className="font-semibold text-gray-900">
                                                        {addr.name}
                                                    </span>
                                                )}
                                                {addr.is_default_shipping && (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                                        <Check className="w-3 h-3" />
                                                        Default
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                {[
                                                    addr.address_1,
                                                    addr.address_2,
                                                    addr.landmark,
                                                ]
                                                    .filter(Boolean)
                                                    .join(", ")}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {[
                                                    addr.city,
                                                    addr.state,
                                                    addr.pincode,
                                                ]
                                                    .filter(Boolean)
                                                    .join(", ")}
                                                {addr.country_code &&
                                                    ` (${addr.country_code})`}
                                            </p>
                                            {addr.mobile && (
                                                <p className="text-sm text-gray-500 mt-1">
                                                    📞 {addr.mobile}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() =>
                                                    startEditAddress(addr)
                                                }
                                                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-gray-500 hover:text-emerald-600 hover:bg-emerald-50"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {addresses.length === 0 && editingAddressId === null && !isAddingNew && (
                            <div className="text-center py-8 text-gray-500">
                                <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p className="font-medium text-gray-700">
                                    No addresses yet
                                </p>
                                <p className="text-sm mt-1">
                                    Add your first shipping address to get
                                    started.
                                </p>
                            </div>
                        )}

                        {(editingAddressId !== null || isAddingNew) && (
                            <form onSubmit={addressForm.handleSubmit(handleAddressSubmit)}>
                                <div className="p-5 rounded-xl border-2 border-emerald-200 bg-emerald-50/30 space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-semibold text-gray-900">
                                            {isAddingNew
                                                ? "Add New Address"
                                                : "Edit Address"}
                                        </h4>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="addr_name">Name</Label>
                                        <Input
                                            id="addr_name"
                                            {...addressForm.register("name")}
                                            placeholder="e.g. Home, Office"
                                        />
                                        {addressForm.formState.errors.name && (
                                            <p className="text-red-500 text-sm">{addressForm.formState.errors.name.message}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="edit_address_1">Address Line 1</Label>
                                            <Input
                                                id="edit_address_1"
                                                {...addressForm.register("address_1")}
                                            />
                                            {addressForm.formState.errors.address_1 && (
                                                <p className="text-red-500 text-sm">{addressForm.formState.errors.address_1.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit_address_2">Address Line 2 (Optional)</Label>
                                            <Input
                                                id="edit_address_2"
                                                {...addressForm.register("address_2")}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit_mobile">Mobile Number</Label>
                                            <Input
                                                id="edit_mobile"
                                                {...addressForm.register("mobile")}
                                            />
                                            {addressForm.formState.errors.mobile && (
                                                <p className="text-red-500 text-sm">{addressForm.formState.errors.mobile.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit_landmark">Landmark (Optional)</Label>
                                            <Input
                                                id="edit_landmark"
                                                {...addressForm.register("landmark")}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit_city">City/Town</Label>
                                            <Input
                                                id="edit_city"
                                                {...addressForm.register("city")}
                                            />
                                            {addressForm.formState.errors.city && (
                                                <p className="text-red-500 text-sm">{addressForm.formState.errors.city.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit_pincode">Pincode</Label>
                                            <Input
                                                id="edit_pincode"
                                                {...addressForm.register("pincode")}
                                            />
                                            {addressForm.formState.errors.pincode && (
                                                <p className="text-red-500 text-sm">{addressForm.formState.errors.pincode.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit_country_code">Country</Label>
                                            <Controller
                                                name="country_code"
                                                control={addressForm.control}
                                                render={({ field }) => (
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={(val) => {
                                                            field.onChange(val);
                                                            addressForm.setValue("state", "");
                                                        }}
                                                    >
                                                        <SelectTrigger id="edit_country_code" className="w-full">
                                                            <SelectValue placeholder="Select Country..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Country.getAllCountries().map((country: { isoCode: string, name: string }) => (
                                                                <SelectItem key={country.isoCode} value={country.isoCode}>
                                                                    {country.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {addressForm.formState.errors.country_code && (
                                                <p className="text-red-500 text-sm">{addressForm.formState.errors.country_code.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="edit_state">State</Label>
                                            <Controller
                                                name="state"
                                                control={addressForm.control}
                                                render={({ field }) => (
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                        disabled={!addressForm.watch("country_code")}
                                                    >
                                                        <SelectTrigger id="edit_state" className="w-full">
                                                            <SelectValue placeholder="Select State..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {addressForm.watch("country_code") && State.getStatesOfCountry(addressForm.watch("country_code")).map((state: { isoCode: string, name: string }) => (
                                                                <SelectItem key={state.isoCode} value={state.name}>
                                                                    {state.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {addressForm.formState.errors.state && (
                                                <p className="text-red-500 text-sm">{addressForm.formState.errors.state.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-1">
                                        <Controller
                                            name="is_default_shipping"
                                            control={addressForm.control}
                                            render={({ field }) => (
                                                <input
                                                    type="checkbox"
                                                    id="edit_default"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    className="accent-emerald-600 w-4 h-4"
                                                />
                                            )}
                                        />
                                        <Label
                                            htmlFor="edit_default"
                                            className="cursor-pointer text-sm"
                                        >
                                            Set as default shipping address
                                        </Label>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            type="submit"
                                            disabled={isSaving}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer rounded-lg px-6 py-2.5 font-medium shadow-sm transition-all hover:shadow-md"
                                        >
                                            {isSaving
                                                ? "Saving..."
                                                : isAddingNew
                                                    ? "Add Address"
                                                    : "Save Changes"}
                                        </Button>
                                        <Button
                                            type="button"
                                            onClick={cancelEditing}
                                            className="bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 cursor-pointer rounded-lg px-6 py-2.5 font-medium shadow-sm transition-all"
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
