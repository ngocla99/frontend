import axios from "axios";
import Cookies from "js-cookie";

const BASE_API_URL = import.meta.env.VITE_BASE_API_URL;

const apiClient = axios.create({
	baseURL: BASE_API_URL,
	headers: {
		"Content-Type": "application/json",
		"ngrok-skip-browser-warning": "true",
	},
});

// Add token (if existed) to request when reload
apiClient.interceptors.request.use(
	(config) => {
		const token = Cookies.get("access_token")
			? JSON.parse(Cookies.get("access_token") as string)
			: null;
		if (token && !config.headers.Authorization) {
			config.headers.Authorization = `Bearer ${token}`;
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
		// If the error status is 401 and the error message is not 'INVALID_CREDENTIALS',
		// it means the token has expired and we need to refresh it
		if (
			error.response.status === 401 &&
			error.response.data.message !== "INVALID_CREDENTIALS"
		) {
			Cookies.set("token", "");
			// window.location.replace("/sign-in");
		}

		return Promise.reject(error);
	},
);

export default apiClient;
