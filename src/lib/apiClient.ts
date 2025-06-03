const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://29yhyi3c91xw.manus.space";

interface ApiClientOptions {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    token?: string | null;
}

async function apiClient<T>(endpoint: string, options: ApiClientOptions = {}): Promise<T> {
    const { method = "GET", headers = {}, body, token } = options;

    const config: RequestInit = {
        method,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
    };

    if (token) {
        config.headers = {
            ...config.headers,
            "Authorization": `Bearer ${token}`,
        };
    }

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                // If response is not JSON, use status text
                errorData = { message: response.statusText };
            }
            // Throw an error object that includes the status and the parsed error data
            const error: any = new Error(errorData.message || `API request failed with status ${response.status}`);
            error.status = response.status;
            error.data = errorData; // Attach the full error data from API
            throw error;
        }

        // Handle cases where response might be empty (e.g., 204 No Content)
        if (response.status === 204) {
            return null as T; // Or an appropriate empty value
        }

        return await response.json() as T;
    } catch (error: any) {
        console.error(`API Client Error (${method} ${endpoint}):`, error.message);
        // Re-throw the error so it can be caught by the calling function
        // This allows for specific error handling in components (e.g., displaying messages to the user)
        throw error;
    }
}

export default apiClient;

