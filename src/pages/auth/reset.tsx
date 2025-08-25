import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Nav from "../../components/Nav";
import { ButtonLoader } from "../../components/Loading";
import { toast } from "../../components/Toast";

export default function ResetPassword() {
	const router = useRouter();
	const { token } = router.query;
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [success, setSuccess] = useState(false);
	const [validToken, setValidToken] = useState(true);

	useEffect(() => {
		if (!token) {
			setValidToken(false);
		}
	}, [token]);

	async function handleResetPassword(e: any) {
		e.preventDefault();

		if (password.length < 8) {
			toast.error(
				"Password too short",
				"Password must be at least 8 characters long",
			);
			return;
		}

		if (password !== confirmPassword) {
			toast.error(
				"Passwords don't match",
				"Please make sure both passwords are identical",
			);
			return;
		}

		setLoading(true);
		try {
			const response = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token, password }),
			});

			const data = await response.json();

			if (response.ok) {
				setSuccess(true);
				toast.success(
					"Password reset!",
					"Your password has been successfully updated",
				);
				setTimeout(() => {
					router.push("/signin");
				}, 2000);
			} else {
				if (response.status === 400) {
					setValidToken(false);
				}
				toast.error("Reset failed", data.error);
			}
		} catch (err) {
			toast.error("Connection error", "Please try again");
		} finally {
			setLoading(false);
		}
	}

	if (!validToken) {
		return (
			<>
				<Nav authed={false} />
				<main className="woob-container py-10">
					<div className="panel p-8 max-w-md mx-auto text-center">
						<div className="text-6xl mb-4">❌</div>
						<h2 className="text-xl font-semibold mb-2">Invalid Reset Link</h2>
						<p className="text-white/70 mb-4">
							This password reset link is invalid or has expired. Please request
							a new one.
						</p>
						<Link href="/signin" className="btn">
							Back to Sign In
						</Link>
					</div>
				</main>
			</>
		);
	}

	if (success) {
		return (
			<>
				<Nav authed={false} />
				<main className="woob-container py-10">
					<div className="panel p-8 max-w-md mx-auto text-center">
						<div className="text-6xl mb-4">✅</div>
						<h2 className="text-xl font-semibold mb-2">
							Password Reset Successful!
						</h2>
						<p className="text-white/70 mb-4">
							Your password has been updated. You can now sign in with your new
							password.
						</p>
						<Link href="/signin" className="btn">
							Continue to Sign In
						</Link>
					</div>
				</main>
			</>
		);
	}

	return (
		<>
			<Nav authed={false} />
			<main className="woob-container py-10">
				<div className="panel p-8 max-w-md mx-auto">
					<div className="text-center mb-6">
						<h2 className="text-2xl font-bold">Reset Your Password</h2>
						<p className="text-white/70 text-sm mt-1">
							Enter your new password below
						</p>
					</div>

					<form onSubmit={handleResetPassword} className="space-y-4">
						<div>
							<label className="label">New Password</label>
							<input
								type="password"
								className="input"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="Enter new password"
								minLength={8}
								required
							/>
							<p className="text-xs text-white/60 mt-1">
								Minimum 8 characters required
							</p>
						</div>

						<div>
							<label className="label">Confirm New Password</label>
							<input
								type="password"
								className="input"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="Confirm new password"
								minLength={8}
								required
							/>
						</div>

						<button
							className="btn w-full flex items-center justify-center gap-2"
							disabled={loading}
						>
							{loading ? (
								<>
									<ButtonLoader />
									Updating password...
								</>
							) : (
								<>🔒 Update Password</>
							)}
						</button>

						<div className="text-center pt-4 border-t border-white/10">
							<Link
								href="/signin"
								className="text-sm text-woob-accent hover:underline"
							>
								← Back to Sign In
							</Link>
						</div>
					</form>
				</div>
			</main>
		</>
	);
}
