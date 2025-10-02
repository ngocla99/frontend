import axios from "axios";
import Cookies from "js-cookie";
import { supabase } from "./supabase";

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

const apiClient = axios.create({
	baseURL: BASE_API_URL,
	headers: {
		"Content-Type": "application/json",
		"ngrok-skip-browser-warning": "true",
	},
});

// Add token to all requests (supports both Supabase and legacy OAuth)
apiClient.interceptors.request.use(
	async (config) => {
		// Priority 1: Try Supabase session (magic link flow)
		const {
			data: { session },
		} = await supabase.auth.getSession();

		if (session?.access_token && !config.headers.Authorization) {
			config.headers.Authorization = `Bearer ${session.access_token}`;
			return config;
		}

		// Priority 2: Fall back to legacy OAuth token from cookies
		const cookieToken = Cookies.get("access_token");
		if (cookieToken && !config.headers.Authorization) {
			const token = JSON.parse(cookieToken);
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}
		}

		return config;
	},
	(error) => Promise.reject(error),
);

// Add a response interceptor
apiClient.interceptors.response.use(
	async (response) => {
		return response.data;
	},
	async (error) => {
		// If the error status is 401, the token may have expired
		if (error.response?.status === 401) {
			// Try to refresh the session
			const {
				data: { session },
				error: refreshError,
			} = await supabase.auth.refreshSession();

			if (refreshError || !session) {
				// If refresh fails, sign out and redirect to sign in
				await supabase.auth.signOut();
				window.location.replace("/auth/sign-in");
				return Promise.reject(error);
			}

			// Retry the original request with new token
			const originalRequest = error.config;
			originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
			return axios(originalRequest);
		}

		return Promise.reject(error);
	},
);

export default apiClient;
