'use client'; 

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';


function QueryProvider({ children }: { children: React.ReactNode }) {
	
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						
						staleTime: 1000 * 60 * 5 
					}
				}
			})
	);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{/* Comment out the dev tools to fix build issues */}
			{/* {process.env.NODE_ENV === 'development' && (
				<ReactQueryDevtools initialIsOpen={false} />
			)} */}
		</QueryClientProvider>
	);
}

export default QueryProvider;
