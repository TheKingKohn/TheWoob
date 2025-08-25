import React, { Component, ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Error caught by boundary:", error, errorInfo);
		// Here you could send error to logging service
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="min-h-screen flex items-center justify-center p-6">
					<div className="panel max-w-md w-full text-center">
						<div className="text-red-500 text-6xl mb-4">⚠️</div>
						<h2 className="heading-2 mb-4">Something went wrong</h2>
						<p className="body-text mb-6">
							We&apos;re sorry, but something unexpected happened. Please try
							refreshing the page.
						</p>
						<div className="space-y-3">
							<button
								onClick={() => window.location.reload()}
								className="btn w-full"
							>
								Refresh Page
							</button>
							<button
								onClick={() => this.setState({ hasError: false })}
								className="btn-outline w-full"
							>
								Try Again
							</button>
						</div>
						{process.env.NODE_ENV === "development" && this.state.error && (
							<details className="mt-6 text-left">
								<summary className="cursor-pointer text-sm text-white/60 hover:text-white/80">
									Error Details (Dev Mode)
								</summary>
								<pre className="mt-2 text-xs bg-black/40 p-3 rounded overflow-auto max-h-40">
									{this.state.error.stack}
								</pre>
							</details>
						)}
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}

// Hook version for functional components
export function useErrorHandler() {
	return (error: Error, errorInfo?: any) => {
		console.error("Error:", error, errorInfo);
		// You could integrate with error reporting service here
	};
}
