import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	type MagicLinkInput,
	magicLinkSchema,
	useSendMagicLink,
} from "../api/magic-link-auth";

interface MagicLinkFormProps {
	mode: "signin" | "signup";
}

export function MagicLinkForm({ mode }: MagicLinkFormProps) {
	const [emailSent, setEmailSent] = useState(false);
	const sendMagicLink = useSendMagicLink({
		mutationConfig: {
			onSuccess: () => {
				setEmailSent(true);
			},
		},
	});

	const form = useForm<MagicLinkInput>({
		resolver: zodResolver(magicLinkSchema),
		defaultValues: {
			email: "",
		},
	});

	const onSubmit = (values: MagicLinkInput) => {
		sendMagicLink.mutate(values);
	};

	if (emailSent) {
		return (
			<div className="mx-auto max-w-md space-y-6 rounded-lg border bg-card p-8 text-center shadow-lg">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
					<Mail className="h-6 w-6 text-primary" />
				</div>
				<div className="space-y-2">
					<h2 className="text-2xl font-bold">Check your email</h2>
					<p className="text-muted-foreground">
						We've sent a magic link to{" "}
						<span className="font-medium text-foreground">
							{form.getValues("email")}
						</span>
					</p>
					<p className="text-sm text-muted-foreground">
						Click the link in the email to{" "}
						{mode === "signin" ? "sign in" : "complete your registration"}
					</p>
				</div>
				<Button
					variant="outline"
					onClick={() => setEmailSent(false)}
					className="w-full"
				>
					Use a different email
				</Button>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-md space-y-6 rounded-lg border bg-card p-8 shadow-lg">
			<div className="space-y-2 text-center">
				<h1 className="text-3xl font-bold">
					{mode === "signin" ? "Welcome back" : "Get started"}
				</h1>
				<p className="text-muted-foreground">
					{mode === "signin"
						? "Enter your email to receive a sign-in link"
						: "Enter your email to create your account"}
				</p>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email address</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder="you@example.com"
										{...field}
										disabled={sendMagicLink.isPending}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button
						type="submit"
						className="w-full"
						disabled={sendMagicLink.isPending}
					>
						{sendMagicLink.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						{mode === "signin" ? "Send sign-in link" : "Send magic link"}
					</Button>
				</form>
			</Form>

			<p className="text-center text-sm text-muted-foreground">
				{mode === "signin" ? (
					<>
						Don't have an account?{" "}
						<a
							href="/auth/sign-up"
							className="font-medium text-primary hover:underline"
						>
							Sign up
						</a>
					</>
				) : (
					<>
						Already have an account?{" "}
						<a
							href="/auth/sign-in"
							className="font-medium text-primary hover:underline"
						>
							Sign in
						</a>
					</>
				)}
			</p>
		</div>
	);
}
