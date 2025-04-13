import React from 'react';

type ErrorBoundaryProps = {
	children: React.ReactNode;
	fallback?: React.ReactNode;
};

type ErrorBoundaryState = {
	hasError: boolean;
};

export class ErrorBoundary extends React.Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		// You can log the error to an error reporting service here
		console.error('Error caught by ErrorBoundary:', error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			// You can render any custom fallback UI
			return (
				this.props.fallback || (
					<div className='flex justify-center items-center h-96'>
						<div className='text-center'>
							<p className='text-muted-foreground'>Something went wrong</p>
							<button
								className='mt-4 px-4 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90'
								onClick={() => this.setState({ hasError: false })}>
								Try again
							</button>
						</div>
					</div>
				)
			);
		}

		return this.props.children;
	}
}
