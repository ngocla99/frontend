const STORE_NAME = {
	THEME: "theme",
	AUTH: "auth",
} as const;

export default STORE_NAME;

export interface PersistStore<T> {
	state: T;
}
