import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link as RouterLink } from 'react-router-dom'; // Import hooks and Link
import { Box, Typography, Paper, CircularProgress, Alert, Button, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { parseFileById } from '../utils/fileUtils'; // Assuming this function exists/will be created

const FileView = () => {
    const { fileId } = useParams(); // Get fileId from URL
    const location = useLocation(); // Get state passed during navigation
    const filenameFromState = location.state?.filename; // Get optional filename

    const [parsedContent, setParsedContent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [owner, setOwner] = useState('');
    const [fileDetails, setFileDetails] = useState({ // Store basic details
         id: fileId,
         name: filenameFromState || `File ID: ${fileId}` // Use state or default
    });

    // Effect to get owner from local storage
    useEffect(() => {
        const userData_temp = JSON.parse(localStorage.getItem('ragnarok_user'));
        if (userData_temp && userData_temp.username) {
            setOwner(userData_temp.username);
        } else {
            setError("User information not found. Please log in again.");
            console.error("No user data found in localStorage for parsing.");
        }
    }, []);

    // Effect to trigger parsing when owner and fileId are available
    useEffect(() => {
        const triggerParse = async () => {
            if (!owner || !fileId) {
                 console.log("Waiting for owner or fileId to trigger parse...");
                 return; // Don't proceed if owner or fileId is missing
            }

            console.log(`Attempting to parse file ID: ${fileId} for owner: ${owner}`);
            setIsLoading(true);
            setError('');
            setParsedContent(null); // Clear previous content

            try {
                const result = await parseFileById(owner, fileId);
                console.log("Parse API Result:", result);

                // --- Handle Backend Response ---
                // Success Case:
                if (result && result.message && result.message.includes("stored successfully")) {
                    setParsedContent({
                         raw_text: result.raw_text || "",
                         chunks: result.chunks || [],
                         stats: result.stats || {}
                    });
                    // Update filename if backend provides it and it wasn't passed in state
                    if (!filenameFromState && result.filename) {
                         setFileDetails(prev => ({ ...prev, name: result.filename }));
                    }
                // Already Parsed Case (adjust based on exact backend message):
                } else if (result && result.message && result.message.includes("already been parsed")) {
                     // Option 1: Show message
                     // setError(`Note: This file (ID: ${fileId}) has already been parsed previously.`);
                     // Option 2: Try to fetch existing parsed data (needs another API endpoint)
                     // setError("File already parsed. Fetching existing data not yet implemented.");
                     // Option 3 (if parse endpoint returns existing data on 'already parsed'):
                     if (result.parsed_content) { // Assuming backend sends existing data
                          setParsedContent(result.parsed_content);
                          console.log("Displaying previously parsed content.");
                     } else {
                          setError(`File already parsed, but no existing content returned.`);
                     }
                // Error Case:
                } else {
                    setError(result?.detail || result?.message || `Failed to parse file ${fileId}. Unknown reason.`);
                }
            } catch (err) {
                console.error("Error calling parseFileById:", err);
                setError(err.message || `An unexpected error occurred while trying to parse file ${fileId}.`);
            } finally {
                setIsLoading(false);
            }
        };

        triggerParse();

    }, [fileId, owner, filenameFromState]); // Dependencies for the effect

    return (
        <Box sx={{ p: 3 }}>
            <Button component={RouterLink} to="/dashboard" variant="outlined" sx={{ mb: 2 }}>
                &larr; Back to Dashboard
            </Button>

            <Typography variant="h4" gutterBottom>
                File View: {fileDetails.name}
            </Typography>

            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Parsing file content, please wait...</Typography>
                </Box>
            )}

            {error && (
                <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            )}

            {!isLoading && parsedContent && (
                <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
                    <Typography variant="h6">Parsed Content</Typography>

                     {parsedContent.stats && (
                         <Box sx={{ my: 2, p: 1, border: '1px solid lightgray', borderRadius: 1 }}>
                             <Typography variant="subtitle1">Stats:</Typography>
                             <Typography variant="body2">Characters: {parsedContent.stats.char_count ?? 'N/A'}</Typography>
                             <Typography variant="body2">Chunks: {parsedContent.stats.chunk_count ?? 'N/A'}</Typography>
                             <Typography variant="body2">Avg. Chunk Size: {parsedContent.stats.avg_chunk_size?.toFixed(2) ?? 'N/A'}</Typography>
                         </Box>
                     )}

                    <Accordion sx={{ my: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>Raw Text</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '400px', overflowY: 'auto', p: 1, border: '1px solid #eee', background: '#f9f9f9' }}>
                                {parsedContent.raw_text || "No raw text available."}
                            </Box>
                        </AccordionDetails>
                    </Accordion>

                    <Accordion defaultExpanded>
                         <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                             <Typography>Text Chunks ({parsedContent.chunks?.length || 0})</Typography>
                         </AccordionSummary>
                         <AccordionDetails>
                             {parsedContent.chunks && parsedContent.chunks.length > 0 ? (
                                 <Box sx={{ maxHeight: '500px', overflowY: 'auto' }}>
                                     {parsedContent.chunks.map((chunk, index) => (
                                         <Paper key={index} variant="outlined" sx={{ p: 2, mb: 1, background: index % 2 ? '#f0f0f0' : '#fff' }}>
                                              <Typography variant="caption">Chunk {index + 1}</Typography>
                                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                  {/* Check if chunk is an object {text: '...', index: ...} or just a string */}
                                                  {typeof chunk === 'string' ? chunk : chunk.text}
                                              </Typography>
                                         </Paper>
                                     ))}
                                 </Box>
                             ) : (
                                 <Typography>No chunks available.</Typography>
                             )}
                         </AccordionDetails>
                    </Accordion>

                    {/* Optionally display vectors if needed - might be too large */}

                </Paper>
            )}
        </Box>
    );
};

export default FileView;