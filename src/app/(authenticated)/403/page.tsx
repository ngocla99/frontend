import UnauthorisedError from "@/components/errors/unauthorized-error";

export default function Forbidden() {
	return <UnauthorisedError />;
}
