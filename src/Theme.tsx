'use client';
import React from 'react';
import { Roboto } from 'next/font/google';
import { createTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const roboto = Roboto({
    weight: ['300', '400', '500', '700'],
    subsets: ['latin'],
    display: 'swap',
});

export function getTheme(prefersDarkMode?: boolean) {
    return createTheme({
        palette: {
            mode: prefersDarkMode ? 'dark' : 'light',
        },
        typography: {
            fontFamily: roboto.style.fontFamily,
        },
        components: {
            MuiAlert: {
                styleOverrides: {
                    root: ({ ownerState }) => ({
                        ...(ownerState.severity === 'info' && {
                            backgroundColor: '#60a5fa',
                        }),
                    }),
                },
            },
        },
    });
}

export default function Theme({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

    const theme = React.useMemo(
        () => getTheme(prefersDarkMode),
        [prefersDarkMode],
    );

    return (
        <ThemeProvider theme={theme} >
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
}

