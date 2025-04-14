
export const submitQuery = async (owner, fileId, query, top_k = 5) => {
    if (!owner || !fileId || !query) {
        throw new Error("Owner, File ID, and Query are required.");
    }
    const API_BASE_URL = "http://localhost:5050/"
    const url = `${API_BASE_URL}query/${encodeURIComponent(owner)}/${encodeURIComponent(fileId)}`;
    console.log(`Submitting query to: ${url}`);

    const requestBody = {
        query: query,
        top_k: top_k
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) { /* ignore */ }
            console.error(`API Query Error ${response.status}:`, errorData || response.statusText);
            throw { status: response.status, data: errorData || { detail: response.statusText } };
        }

        const data = await response.json();
        return data; 
    } catch (error) {
        console.error('Network or processing error in submitQuery:', error);
        throw error.data ? error : new Error(error.message || 'Failed to submit query due to network error.');
    }
};