import { useState } from "react";
import Router from "next/router";
import Nav from "../components/Nav";
import { ButtonLoader } from "../components/Loading";
import { toast } from "../components/Toast";

export default function SignIn() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [name, setName] = useState("");
	const [affiliateCode, setAffiliateCode] = useState("");
	const [isSignUp, setIsSignUp] = useState(false);
	const [loading, setLoading] = useState(false);

	async function submit(e: any) {
		e.preventDefault();
		if (!email.trim()) {
			toast.error("Email required", "Please enter an email address");
			return;
		}
		if (!password.trim()) {
			toast.error("Password required", "Please enter a password");
			return;
		}
		if (isSignUp && password.length < 6) {
			toast.error(
				"Password too short",
				"Password must be at least 6 characters",
			);
			return;
		}

		setLoading(true);
		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: email.trim(),
					password: password.trim(),
					name: isSignUp ? name.trim() || null : null,
					affiliateCode:
						isSignUp && affiliateCode.trim() ? affiliateCode.trim() : undefined,
				}),
			});

			if (response.ok) {
				const result = await response.json();
				if (result.requiresVerification) {
					toast.success(
						"Account created!",
						"Please check your email to verify your account",
					);
				} else {
					toast.success("Welcome to the Club!", "You're now a verified member");
					setTimeout(() => {
						window.location.href = "/dashboard";
					}, 1000);
				}
			} else {
				const error = await response.json();
				toast.error(
					isSignUp ? "Sign up failed" : "Sign in failed",
					error.error || "Please try again",
				);
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

	return (
		<>
			<Nav authed={false} />
			<main className="woob-container py-10">
				<div className="panel p-8 max-w-md mx-auto">
					<h2 className="text-2xl font-bold">
						🎩 {isSignUp ? "Join" : "Enter"} the Elite Club
					</h2>
					<p className="text-white/70 text-sm mt-1">
						{isSignUp
							? "Create your exclusive member account"
							: "Sign in to your member account"}
					</p>
					<form onSubmit={submit} className="mt-6 space-y-4">
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
							<label className="label">Password</label>
							<input
								type="password"
								className="input"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder={
									isSignUp
										? "Choose a secure password (min 6 chars)"
										: "Enter your password"
								}
								required
							/>
						</div>
						{isSignUp && (
							<>
								<div>
									<label className="label">Display Name (optional)</label>
									<input
										className="input"
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="Your name"
									/>
								</div>
								<div>
									<label className="label">Referral Code (optional)</label>
									<input
										className="input"
										value={affiliateCode}
										onChange={(e) => setAffiliateCode(e.target.value)}
										placeholder="Enter referral code (if you have one)"
									/>
								</div>
							</>
						)}
						<button
							className="btn w-full flex items-center justify-center gap-2"
							disabled={loading}
						>
							{loading ? (
								<>
									<ButtonLoader />
									{isSignUp ? "Creating Account..." : "Signing In..."}
								</>
							) : (
								<>✨ {isSignUp ? "Create Account" : "Sign In"}</>
							)}
						</button>
					</form>
					<div className="mt-6 text-center">
						<button
							type="button"
							onClick={() => setIsSignUp(!isSignUp)}
							className="text-woob-accent hover:text-purple-400 text-sm transition-colors"
						>
							{isSignUp
								? "Already have an account? Sign in"
								: "Need an account? Join the club"}
						</button>
					</div>
				</div>
			</main>
		</>
	);
}
