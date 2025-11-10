// Helper function to convert base64 to File
export const base64ToFile = async (
	base64: string,
	filename: string,
): Promise<File> => {
	const response = await fetch(base64);
	const blob = await response.blob();
	return new File([blob], filename, { type: blob.type });
};
