import { API_URL } from "@/config";

type ApiParams = {
    resource: string;
    payload: Record<PropertyKey, unknown>;
};

export type ApiResponce<T> =
    | {
          status: "success";
          data: T;
          page?: number;
          total_pages?: number;
      }
    | {
          status: "error";
          error: string;
      };

export async function sendRequest({
    resource,
    payload,
    method,
}: ApiParams & { method: string }) {
    const res = await fetch(`${API_URL}/${resource}`, {
        method,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });

    return res.json();
}

export async function createResource<T>({
    resource,
    payload,
}: ApiParams): Promise<ApiResponce<T>> {
    return await sendRequest({ resource, payload, method: "POST" });
}

export async function updateResource<T>({
    resource,
    payload,
}: ApiParams): Promise<ApiResponce<T>> {
    return await sendRequest({ resource, payload, method: "PATCH" });
}

export async function deleteResource(
    resource: string
): Promise<
    { status: "success"; message: string } | { status: "error"; error: string }
> {
    const res = await fetch(`${API_URL}/${resource}`, {
        credentials: "include",
        method: "DELETE",
    });

    return await res.json();
}

export function unwrapResponse<T>(data: ApiResponce<T>): {
    data: T;
    page?: number;
    totalPages?: number;
} {
    if (data.status === "error") throw new Error(data.error);

    return {
        data: data.data,
        page: data.page,
        totalPages: data.total_pages,
    };
}
