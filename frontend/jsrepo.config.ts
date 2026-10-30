import { defineConfig } from 'jsrepo';

export default defineConfig({
    registries: ['https://reactbits.dev/r'],
    paths: {
        component: './src/components',
        ui: './src/components/ui',
    },
});