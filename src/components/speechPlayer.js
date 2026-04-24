const decodeBase64Audio = (audioContent) => {
    const raw = atob(audioContent);
    return Uint8Array.from(raw, (character) => character.charCodeAt(0));
};

export const createSpeechPlayer = ({ onPlaybackStateChange } = {}) => {
    let audio = null;
    let audioUrl = null;
    let activeMessageIndex = null;

    const emitState = (messageIndex, isPlaying) => {
        onPlaybackStateChange?.({ messageIndex, isPlaying });
    };

    const cleanup = () => {
        const previousMessageIndex = activeMessageIndex;

        if (audio) {
            audio.pause();
            audio.src = '';
            audio = null;
        }

        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
            audioUrl = null;
        }

        activeMessageIndex = null;

        if (previousMessageIndex !== null) {
            emitState(previousMessageIndex, false);
        }
    };

    return {
        isPlaying(messageIndex) {
            return messageIndex !== null && activeMessageIndex === messageIndex;
        },
        stop() {
            cleanup();
        },
        async play({ audioContent, mimeType = 'audio/mpeg', messageIndex }) {
            cleanup();

            const bytes = decodeBase64Audio(audioContent);
            const blob = new Blob([bytes], { type: mimeType });
            audioUrl = URL.createObjectURL(blob);
            activeMessageIndex = messageIndex;
            audio = new Audio(audioUrl);
            audio.onended = cleanup;
            audio.onerror = cleanup;

            emitState(messageIndex, true);
            await audio.play();
        }
    };
};
