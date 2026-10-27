// Audio Session API: request media playback only during user-triggered narration.
// Safari/iOS decides the final route. This cannot change the device's volume.
export function beginPlaybackSession(browser: Navigator): () => void {
  try {
    const session = (browser as Navigator & { audioSession?: { type: string } }).audioSession;
    if (!session) return () => {};
    const previous = session.type;
    session.type = 'playback';
    let released = false;
    return () => {
      if (released) return;
      released = true;
      try {
        if (session.type === 'playback') session.type = previous;
      } catch {
        // Unsupported/denied session changes must never interrupt normal speech.
      }
    };
  } catch {
    return () => {};
  }
}
