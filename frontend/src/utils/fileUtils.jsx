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
            fileId: response.data.fileId,
            fileUrl: response.data.fileUrl,
            metadata: {
                originalName: ownerInfo.filename,
                size: ownerInfo.fileSize,
                owner: ownerInfo.owner
            }
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