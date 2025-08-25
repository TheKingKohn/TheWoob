import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Nav from "../../components/Nav";
import { ButtonLoader } from "../../components/Loading";
import { toast } from "../../components/Toast";

export default function VerifyEmail() {
	const router = useRouter();
	const { token } = router.query;
	const [loading, setLoading] = useState(false);
	const [verified, setVerified] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (token && typeof token === "string") {
			verifyEmail(token);
		}
	}, [token]);

	async function verifyEmail(verificationToken: string) {
		setLoading(true);
		try {
			const response = await fetch("/api/auth/verify-email", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token: verificationToken }),
			});

			const data = await response.json();

			if (response.ok) {
				setVerified(true);
				toast.success("Email verified!", "Your account is now active");
				setTimeout(() => {
					router.push("/signin");
				}, 2000);
			} else {
				setError(data.error || "Verification failed");
				toast.error("Verification failed", data.error);
			}
		} catch (err) {
			setError("Network error occurred");
			toast.error("Connection error", "Please try again");
		} finally {
			setLoading(false);
		}
	}

	async function resendVerification() {
		// This would need the user's email - for now, redirect to resend page
		router.push("/auth/resend-verification");
	}

	return (
		<>
			<Nav authed={false} />
			<main className="woob-container py-10">
				<div className="panel p-8 max-w-md mx-auto text-center">
					{loading ? (
						<>
							<div className="mb-4">
								<ButtonLoader />
							</div>
							<h2 className="text-xl font-semibold mb-2">
								Verifying your email...
							</h2>
							<p className="text-white/70">
								Please wait while we verify your account.
							</p>
						</>
					) : verified ? (
						<>
							<div className="text-6xl mb-4">✅</div>
							<h2 className="text-xl font-semibold mb-2">Email Verified!</h2>
							<p className="text-white/70 mb-4">
								Your account has been successfully verified. You can now sign in
								to TheWoob.
							</p>
							<Link href="/signin" className="btn">
								Continue to Sign In
							</Link>
						</>
					) : error ? (
						<>
							<div className="text-6xl mb-4">❌</div>
							<h2 className="text-xl font-semibold mb-2">
								Verification Failed
							</h2>
							<p className="text-white/70 mb-4">{error}</p>
							<div className="space-y-3">
								<button onClick={resendVerification} className="btn w-full">
									Request New Verification Link
								</button>
								<Link
									href="/signin"
									className="btn-outline w-full block text-center"
								>
									Back to Sign In
								</Link>
							</div>
						</>
					) : (
						<>
							<div className="text-6xl mb-4">📧</div>
							<h2 className="text-xl font-semibold mb-2">Email Verification</h2>
							<p className="text-white/70">
								Click the verification link in your email to activate your
								account.
							</p>
						</>
					)}
				</div>
			</main>
		</>
	);
}
