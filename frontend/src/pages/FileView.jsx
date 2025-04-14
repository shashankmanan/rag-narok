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
    // Dependencies for the effect
    useEffect(() => {
        const fetchOrParseContent = async () => {
            if (!owner || !fileId) {
                console.log("Waiting for owner or fileId to fetch/parse content...");
                return;
            }
    
            setIsLoading(true);
            setError('');
            setParsedContent(null);
    
            try {
                // --- Step 1: Try to GET existing content ---
                // Assume you create a getParsedContent(owner, fileId) utility function
                console.log(`Attempting to fetch content for file ID: ${fileId}, owner: ${owner}`);
                const existingContent = await parseFileById(owner, fileId);
                console.log("Fetched existing content:", existingContent);
    
                setParsedContent({
                    raw_text: existingContent.raw_text || "",
                    chunks: existingContent.chunks || [],
                    // Extract stats if returned by the new endpoint
                    stats: existingContent.stats || {
                         char_count: existingContent.raw_text?.length || 0, // Basic stats if not stored
                         chunk_count: existingContent.chunks?.length || 0
                    }
                });
                setIsLoading(false);
    
            } catch (fetchError) {
                 console.warn("Failed to fetch existing content:", fetchError);
                // --- Step 2: If fetching fails (e.g., 404 Not Found), THEN try parsing ---
                // Check if the error indicates 'Not Found' (customize based on your API util)
                if (fetchError?.status === 404) {
                     console.log(`Content not found for file ${fileId}, attempting to trigger parse...`);
                     try {
                         // Call the original parse endpoint
                         const parseResult = await parseFileById(owner, fileId); // Your existing function
                         console.log("Parse API Result:", parseResult);
    
                         if (parseResult && parseResult.message && parseResult.message.includes("stored successfully")) {
                              setParsedContent({
                                  raw_text: parseResult.raw_text || "",
                                  chunks: parseResult.chunks || [],
                                  stats: parseResult.stats || {}
                              });
                         } else if (parseResult && parseResult.message && parseResult.message.includes("already been parsed")) {
                             // This case might mean a race condition or backend inconsistency
                             // Maybe try fetching again, or show an appropriate message.
                             setError("File was already parsed, but fetching failed initially. Please try refreshing.");
                         } else {
                             setError(parseResult?.detail || parseResult?.message || `Failed to parse file ${fileId}.`);
                         }
    
                     } catch (parseError) {
                         console.error("Error calling parseFileById:", parseError);
                         setError(parseError.data?.detail || parseError.message || `An error occurred while trying to parse file ${fileId}.`);
                     } finally {
                         setIsLoading(false); // Stop loading after parse attempt
                     }
                } else {
                     // Handle other errors from the fetch attempt
                     setError(fetchError.data?.detail || fetchError.message || `An error occurred while fetching content for file ${fileId}.`);
                     setIsLoading(false); // Stop loading on other fetch errors
                }
            }
            // Note: No finally { setIsLoading(false) } here, as it's handled within the catch/try blocks
        };
    
        fetchOrParseContent();
    
    }, [fileId, owner]); 


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