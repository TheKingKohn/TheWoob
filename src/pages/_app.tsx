import type { AppProps } from "next/app";
import Head from "next/head";
import ToastContainer from "../components/Toast";
import { ThemeProvider } from "../components/ThemeContext";
import { ErrorBoundary } from "../components/ErrorBoundary";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
	return (
		<ThemeProvider>
			<ErrorBoundary>
				<Head>
					<title>TheWoob — Exclusive Members Club</title>
					<meta name="viewport" content="width=device-width, initial-scale=1" />
					<meta
						name="description"
						content="Premium marketplace for trusted local members. Invite-only access, verified sellers, elite transactions."
					/>
				</Head>
				<Component {...pageProps} />
				<ToastContainer />
			</ErrorBoundary>
		</ThemeProvider>
	);
}
