import axios from "axios";

export const upload_file = async (file, owner) => {
    const baseUrl = `http://localhost:5050/file/upload/${owner}`;
    
    try {
        
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(baseUrl, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        console.log(response)
        // Successful upload
        return {
            success: true,
            message: response.data.message || "File uploaded successfully",
            fileId: response.data.file.id,
            fileName: response.data.file.name
        };
    } catch (error) {
        // Handle different error scenarios
        if (error.response) {
            // Server responded with error status (4xx, 5xx)
            return {
                success: false,
                error: error.response.data.error || "File upload failed",
                errorCode: error.response.data.errorCode,
                status: error.response.status
            };
        } else if (error.request) {
            // Request was made but no response received
            return {
                success: false,
                error: "No response from server",
                errorCode: "NETWORK_ERROR"
            };
        } else {
            // Other errors
            return {
                success: false,
                error: error.message || "Unknown upload error"
            };
        }
    }
};


export const getAllFilesByOwner = async (owner) => {
    const baseUrl = `http://localhost:5050/file/get-all/${owner}`
    try {
        
        const response = await axios.get(baseUrl)
        console.log(response)
        return response.data.files
        }
        catch (error) {
            return {
                success: false,
                error: error.response.data.error || "File upload failed",
                errorCode: error.response.data.errorCode,
                status: error.response.status
        }
    }
    
}

// In ../utils/fileUtils.js

// Assuming you have a base URL configured, e.g., const API_BASE_URL = 'http://localhost:8000';


// ... existing upload_file, getAllFilesByOwner functions ...

export const parseFileById = async (owner, fileId) => {
    if (!owner || !fileId) {
        throw new Error("Owner and File ID are required for parsing.");
    }
    const API_BASE_URL = `http://localhost:5050`
    const url = `${API_BASE_URL}/file/parse/${encodeURIComponent(owner)}/${encodeURIComponent(fileId)}`;
    console.log(`Calling Parse API: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'GET', // Changed from POST, assuming GET based on backend route definition
            headers: {
                'Accept': 'application/json',
                // Add Authorization headers if required by your backend
                // 'Authorization': `Bearer ${your_auth_token}`
            },
        });

        // Check if response is OK (status in 200-299 range)
        if (!response.ok) {
            // Try to parse error json from backend, otherwise use status text
            let errorData;
            try {
                 errorData = await response.json();
            } catch (e) {
                 // Ignore if response body isn't valid JSON
            }
            console.error(`API Error ${response.status}:`, errorData || response.statusText);
            // Return the error data structure from backend if available
            throw { status: response.status, data: errorData || { detail: response.statusText } };
        }

        // If response is OK, parse the JSON body
        const data = await response.json();
        return data; // Return the parsed data (e.g., { message: "...", parsed_content_id: ..., ... })

    } catch (error) {
        console.error('Network or parsing error in parseFileById:', error);
        // Re-throw either the structured API error or a generic error
        throw error.data ? error : new Error(error.message || 'Failed to fetch parsed content due to network error.');
    }
};

// --- Add deleteFile, downloadFile utilities as needed ---