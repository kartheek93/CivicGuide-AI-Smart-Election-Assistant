import { createApp } from './src/app/createApp.js';

const { app, config } = await createApp();

app.listen(config.port, () => {
    console.log(`CivicGuide AI server running on http://localhost:${config.port}`);
});
