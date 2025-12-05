import { createTheme, MantineColorsTuple } from '@mantine/core';

// Neo-brutalism color palette
const vibrantYellow: MantineColorsTuple = [
    '#fff9db',
    '#fff3bf',
    '#ffe99f',
    '#ffdd7d',
    '#ffd15c',
    '#ffc43d',
    '#ffb700',
    '#e6a400',
    '#cc9200',
    '#b37f00',
];

const vibrantPink: MantineColorsTuple = [
    '#ffe9f5',
    '#ffd3eb',
    '#ffb3dd',
    '#ff8ccf',
    '#ff66c1',
    '#ff40b3',
    '#ff1aa5',
    '#e60094',
    '#cc0084',
    '#b30073',
];

const vibrantBlue: MantineColorsTuple = [
    '#e0f2ff',
    '#b3e0ff',
    '#80ccff',
    '#4db8ff',
    '#1aa3ff',
    '#008fff',
    '#007ae6',
    '#0066cc',
    '#0052b3',
    '#003d99',
];

const vibrantGreen: MantineColorsTuple = [
    '#e6f9f0',
    '#b3f0d4',
    '#80e7b8',
    '#4dde9c',
    '#1ad580',
    '#00cc66',
    '#00b85c',
    '#00a352',
    '#008f47',
    '#007a3d',
];

export const theme = createTheme({
    primaryColor: 'vibrantBlue',
    colors: {
        vibrantYellow,
        vibrantPink,
        vibrantBlue,
        vibrantGreen,
    },
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontFamilyMonospace: 'Monaco, Courier, monospace',
    headings: {
        fontFamily: 'Space Grotesk, Inter, sans-serif',
        fontWeight: '700',
    },
    defaultRadius: '0', // Sharp corners for neo-brutalism
    shadows: {
        xs: '2px 2px 0 #000',
        sm: '4px 4px 0 #000',
        md: '6px 6px 0 #000',
        lg: '8px 8px 0 #000',
        xl: '12px 12px 0 #000',
    },
    components: {
        Button: {
            defaultProps: {
                size: 'md',
            },
            styles: {
                root: {
                    border: '3px solid #000',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                        transform: 'translate(-2px, -2px)',
                        boxShadow: '6px 6px 0 #000',
                    },
                    '&:active': {
                        transform: 'translate(2px, 2px)',
                        boxShadow: '2px 2px 0 #000',
                    },
                },
            },
        },
        Card: {
            styles: {
                root: {
                    border: '3px solid #000',
                    borderRadius: 0,
                    boxShadow: '6px 6px 0 #000',
                },
            },
        },
        TextInput: {
            styles: {
                input: {
                    border: '3px solid #000',
                    borderRadius: 0,
                    '&:focus': {
                        borderColor: '#000',
                    },
                },
                label: {
                    fontWeight: 700,
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                },
            },
        },
        Select: {
            styles: {
                input: {
                    border: '3px solid #000',
                    borderRadius: 0,
                    '&:focus': {
                        borderColor: '#000',
                    },
                },
                label: {
                    fontWeight: 700,
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                },
            },
        },
        Modal: {
            styles: {
                content: {
                    border: '3px solid #000',
                    borderRadius: 0,
                    boxShadow: '8px 8px 0 #000',
                },
                header: {
                    borderBottom: '3px solid #000',
                    paddingBottom: '1rem',
                },
            },
        },
        Table: {
            styles: {
                table: {
                    border: '3px solid #000',
                },
                th: {
                    border: '2px solid #000',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    backgroundColor: '#ffd15c',
                },
                td: {
                    border: '2px solid #000',
                },
            },
        },
    },
});
