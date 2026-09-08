/**
 * Consumes the Flask SSE generator for streaming chat responses.
 * Avoids WebSockets as requested.
 * 
 * @param {string} prompt The user's message
 * @param {function} onChunk Callback fired when a new token is received
 * @param {function} onComplete Callback fired when the stream finishes
 * @param {function} onError Callback fired when an error occurs
 */
export const streamChatResponse = async (prompt, onChunk, onComplete, onError) => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
  
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${API_BASE_URL}/api/chat/stream?query=${encodeURIComponent(prompt)}`, {
        method: 'GET',
        headers,
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let fullText = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (onComplete) onComplete(fullText);
          break;
        }
        
        // Decode the stream chunk
        const chunk = decoder.decode(value, { stream: true });
        
        // SSE messages typically look like: data: {"token": "hello"}\n\n
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr) {
                if (dataStr === '[DONE]') {
                    continue; // Skip the done signal so it doesn't render
                }
                try {
                    const parsed = JSON.parse(dataStr);
                    // Check for token or chunk key explicitly
                    if (parsed.token !== undefined) {
                        fullText += parsed.token;
                        if (onChunk) onChunk(parsed.token);
                    } else if (parsed.chunk !== undefined) {
                        fullText += parsed.chunk;
                        if (onChunk) onChunk(parsed.chunk);
                    } else if (parsed.response !== undefined) {
                        fullText += parsed.response;
                        if (onChunk) onChunk(parsed.response);
                    }
                } catch(e) {
                    // Sometimes the backend might send plain text instead of JSON over SSE
                    fullText += dataStr;
                    if (onChunk) onChunk(dataStr);
                }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error streaming chat:", error);
      if (onError) onError(error);
    }
  };
