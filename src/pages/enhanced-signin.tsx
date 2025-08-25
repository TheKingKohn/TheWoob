import { useState } from "react";
import Router from "next/router";
import Link from "next/link";
import Nav from "../components/Nav";
import { ButtonLoader } from "../components/Loading";
import { toast } from "../components/Toast";

export default function EnhancedSignIn() {
	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [password, setPassword] = useState("");
	const [usePassword, setUsePassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [showForgotPassword, setShowForgotPassword] = useState(false);

	async function handleSignIn(e: any) {
		e.preventDefault();
		if (!email.trim()) {
			toast.error("Email required", "Please enter an email address");
			return;
		}

		if (usePassword && !password) {
			toast.error("Password required", "Please enter your password");
			return;
		}

		setLoading(true);
		try {
			const body = {
				email: email.trim(),
				name: name.trim() || null,
				...(usePassword && { password }),
			};

			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			const data = await response.json();

			if (response.ok) {
				if (data.requiresVerification) {
					toast.success(
						"Check your email!",
						"Please verify your email to complete registration",
					);
					return;
				}

				toast.success("Welcome to TheWoob!", "You're now signed in");
				setTimeout(() => {
					window.location.href = "/dashboard";
				}, 1000);
			} else {
				if (response.status === 423) {
					toast.error("Account locked", data.error);
				} else if (response.status === 403) {
					toast.error("Email verification required", data.error);
					// Show resend verification option
				} else if (response.status === 429) {
					toast.error("Too many attempts", data.error);
				} else {
					toast.error("Sign in failed", data.error || "Please try again");
				}
			}
		} catch (err) {
			console.error("Login error:", err);
			toast.error(
				"Connection error",
				"Please check your internet and try again",
			);
		} finally {
			setLoading(false);
		}
	}

	async function handleForgotPassword(e: any) {
		e.preventDefault();
		if (!email.trim()) {
			toast.error("Email required", "Please enter your email address first");
			return;
		}

		setLoading(true);
		try {
			const response = await fetch("/api/auth/forgot-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: email.trim() }),
			});

			const data = await response.json();
			if (response.ok) {
				toast.success("Reset link sent!", data.message);
				setShowForgotPassword(false);
			} else {
				toast.error("Error", data.error);
			}
		} catch (err) {
			toast.error("Connection error", "Please try again");
		} finally {
			setLoading(false);
		}
	}

	return (
		<>
			<Nav authed={false} />
			<main className="woob-container py-10">
				<div className="panel p-8 max-w-md mx-auto">
					<div className="text-center mb-6">
						<h2 className="text-2xl font-bold">Sign in to TheWoob</h2>
						<p className="text-white/70 text-sm mt-1">
							{usePassword
								? "Enter your email and password"
								: "Enter any email to create or access your account"}
						</p>
					</div>

					{showForgotPassword ? (
						<form onSubmit={handleForgotPassword} className="space-y-4">
							<div>
								<label className="label">Email Address</label>
								<input
									type="email"
									className="input"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="your@email.com"
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
										Sending reset link...
									</>
								) : (
									"📧 Send Reset Link"
								)}
							</button>
							<button
								type="button"
								className="btn-outline w-full"
								onClick={() => setShowForgotPassword(false)}
							>
								← Back to Sign In
							</button>
						</form>
					) : (
						<form onSubmit={handleSignIn} className="space-y-4">
							<div>
								<label className="label">Email Address</label>
								<input
									type="email"
									className="input"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="your@email.com"
									required
								/>
							</div>

							<div>
								<label className="label">Display Name (optional)</label>
								<input
									className="input"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Your name"
								/>
							</div>

							{/* Password toggle */}
							<div className="flex items-center gap-3">
								<input
									type="checkbox"
									id="usePassword"
									checked={usePassword}
									onChange={(e) => setUsePassword(e.target.checked)}
									className="w-4 h-4"
								/>
								<label htmlFor="usePassword" className="text-sm text-white/80">
									Use password for enhanced security
								</label>
							</div>

							{usePassword && (
								<div>
									<label className="label">Password</label>
									<input
										type="password"
										className="input"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										placeholder="Enter your password"
										minLength={8}
									/>
									<p className="text-xs text-white/60 mt-1">
										Minimum 8 characters required
									</p>
								</div>
							)}

							<button
								className="btn w-full flex items-center justify-center gap-2"
								disabled={loading}
							>
								{loading ? (
									<>
										<ButtonLoader />
										Signing in...
									</>
								) : (
									<>🚀 Sign In</>
								)}
							</button>

							{usePassword && (
								<div className="text-center">
									<button
										type="button"
										className="text-sm text-woob-accent hover:underline"
										onClick={() => setShowForgotPassword(true)}
									>
										Forgot your password?
									</button>
								</div>
							)}

							<div className="text-center pt-4 border-t border-white/10">
								<p className="text-xs text-white/60">
									{usePassword
										? "Password-based authentication provides enhanced security for your account."
										: "Passwordless sign-in lets you access your account quickly with just your email."}
								</p>
							</div>
						</form>
					)}
				</div>
			</main>
		</>
	);
}
