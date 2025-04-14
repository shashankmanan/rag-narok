import React, { useEffect, useState } from 'react';
import { useParams, useLocation, Link as RouterLink } from 'react-router-dom';
import {
    Box, Typography, Paper, CircularProgress, Alert, Button, Accordion,
    AccordionSummary, AccordionDetails, List, ListItem, TextField, IconButton, Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SendIcon from '@mui/icons-material/Send';
// Import ALL necessary API utility functions
import { parseFileById } from '../utils/fileUtils'; // Make sure all three are imported
import { submitQuery } from '../utils/queryUtils';

const FileView = () => {
    const { fileId } = useParams();
    const location = useLocation();
    const filenameFromState = location.state?.filename;

    // State for initial content loading/parsing
    const [parsedContent, setParsedContent] = useState(null); // Holds { raw_text, chunks, stats }
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(''); // Error for initial loading/parsing

    // State for user and file details
    const [owner, setOwner] = useState('');
    const [fileDetails, setFileDetails] = useState({
         id: fileId,
         name: filenameFromState || `File ID: ${fileId}`
    });

    // --- Chat State ---
    const [chatHistory, setChatHistory] = useState([]); // { type: 'user'|'ai', text: string, sources?: SourceChunk[] }
    const [isChatLoading, setIsChatLoading] = useState(false); // Separate loading for chat responses
    const [chatError, setChatError] = useState(''); // Error specific to chat
    const [inputValue, setInputValue] = useState('');
    // --- End Chat State ---

    // Effect to get owner from local storage
    useEffect(() => {
        const userData_temp = JSON.parse(localStorage.getItem('ragnarok_user'));
        if (userData_temp && userData_temp.username) {
            setOwner(userData_temp.username);
        } else {
            // Set error for the main content loading part if user is not found
            setError("User information not found. Please log in again.");
            console.error("No user data found in localStorage.");
        }
    }, []);

    // Effect to fetch or parse initial content when owner and fileId are available
    useEffect(() => {
        const fetchOrParseContent = async () => {
            if (!owner || !fileId) {
                 console.log("Waiting for owner or fileId to fetch/parse content...");
                 return; // Don't proceed if owner or fileId is missing
            }

            setIsLoading(true);
            setError(''); // Clear previous errors for initial load
            setParsedContent(null); // Clear previous content

            try {
                 // --- Step 1: Try to GET existing content ---
                 console.log(`Attempting to fetch content for file ID: ${fileId}, owner: ${owner}`);
                 const existingContent = await parseFileById(owner, fileId);
                 console.log("Fetched existing content:", existingContent);
                 setParsedContent({
                     raw_text: existingContent.raw_text || "",
                     chunks: existingContent.chunks || [],
                     stats: existingContent.stats || { // Reconstruct basic stats if not returned
                          char_count: existingContent.raw_text?.length || 0,
                          chunk_count: existingContent.chunks?.length || 0
                     }
                 });
                 // No need to call setIsLoading(false) here, finally block handles it

            } catch (fetchError) {
                 console.warn("Failed to fetch existing content:", fetchError);
                 // --- Step 2: If fetching fails (specifically 404 Not Found), THEN try parsing ---
                 if (fetchError?.status === 404) {
                      console.log(`Content not found for file ${fileId}, attempting to trigger parse...`);
                      try {
                           // *** CORRECTED: Call parseFileById only on 404 ***
                           const parseResult = await parseFileById(owner, fileId);
                           console.log("Parse API Result:", parseResult);

                           // Check if parsing was successful and resulted in stored content
                           if (parseResult && parseResult.message && parseResult.message.includes("stored successfully")) {
                                setParsedContent({
                                    raw_text: parseResult.raw_text || "", // Use data returned by parse endpoint if available
                                    chunks: parseResult.chunks || [],
                                    stats: parseResult.stats || {}
                                });
                                // If parse endpoint doesn't return content, maybe trigger a refetch?
                                // Or rely on the user refreshing later. For now, set from parseResult.
                           } else if (parseResult && parseResult.message && parseResult.message.includes("already been parsed")) {
                                // Handle case where backend says already parsed, but fetch failed.
                                // This might indicate an inconsistency. Maybe try fetching again?
                                setError("File already parsed, but initial fetch failed. Try refreshing.");
                           } else {
                                // Handle other non-successful parse responses
                                setError(parseResult?.detail || parseResult?.message || `Failed to parse file ${fileId}.`);
                           }

                      } catch (parseError) {
                           // Handle errors during the parse attempt itself
                           console.error("Error calling parseFileById:", parseError);
                           setError(parseError.data?.detail || parseError.message || `An error occurred while trying to parse file ${fileId}.`);
                      }
                 } else {
                      // Handle other errors from the initial fetch attempt (e.g., 500 server error)
                      setError(fetchError.data?.detail || fetchError.message || `An error occurred while fetching content for file ${fileId}.`);
                 }
            } finally {
                // This runs regardless of success or failure of the try/catch blocks above
                setIsLoading(false);
            }
        };

        fetchOrParseContent();

    }, [fileId, owner]); // Dependencies for the effect


    // --- Chat Handlers ---
    const handleInputChange = (event) => {
        setInputValue(event.target.value);
    };

    const handleSendQuery = async () => {
        const userQuery = inputValue.trim();
        if (!userQuery || isChatLoading || !owner || !fileId) {
            return;
        }
        setChatHistory(prev => [...prev, { type: 'user', text: userQuery }]);
        setInputValue('');
        setIsChatLoading(true);
        setChatError('');
        try {
            const result = await submitQuery(owner, fileId, userQuery);
            setChatHistory(prev => [
                ...prev,
                { type: 'ai', text: result.answer, sources: result.source_chunks || [] }
            ]);
        } catch (err) {
            console.error("Error submitting query:", err);
            const errorMsg = err.data?.detail || err.message || "Failed to get answer from AI.";
            setChatError(errorMsg);
            // Optionally add error to chat history
            // setChatHistory(prev => [...prev, { type: 'ai', text: `Error: ${errorMsg}` }]);
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSendQuery();
        }
    };
    // --- End Chat Handlers ---


    // --- JSX Rendering ---
    return (
        <Box sx={{ p: 3 }}>
            {/* Back Button and Title */}
            <Button component={RouterLink} to="/dashboard" variant="outlined" sx={{ mb: 2 }}>
                &larr; Back to Dashboard
            </Button>
            <Typography variant="h4" gutterBottom>
                File View: {fileDetails.name}
            </Typography>

            {/* Initial Content Loading / Error Display */}
            {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 5, border: '1px dashed grey', borderRadius: 1, mb: 3 }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading or Parsing Document Content...</Typography>
                </Box>
            )}
            {error && !isLoading && ( // Show error only if not loading
                <Alert severity="error" sx={{ mt: 2, mb: 3 }}>Initial Load/Parse Error: {error}</Alert>
            )}

            {/* Parsed Content Display Area (Only if not loading and content exists) */}
            {!isLoading && parsedContent && (
                <Paper elevation={1} sx={{ p: 2, mt: 2, mb: 3, background: '#f9f9f9' }}>
                    <Typography variant="h6" gutterBottom>Document Content Summary</Typography>
                     {parsedContent.stats && (
                         <Box sx={{ mb: 2, p: 1, border: '1px solid lightgray', borderRadius: 1 }}>
                             <Typography variant="subtitle2">Stats:</Typography>
                             <Typography variant="body2" component="span" sx={{ mr: 2 }}>Chars: {parsedContent.stats.char_count ?? 'N/A'}</Typography>
                             <Typography variant="body2" component="span" sx={{ mr: 2 }}>Chunks: {parsedContent.stats.chunk_count ?? 'N/A'}</Typography>
                             <Typography variant="body2" component="span">Avg. Chunk: {parsedContent.stats.avg_chunk_size?.toFixed(0) ?? 'N/A'}</Typography>
                         </Box>
                     )}
                    <Accordion sx={{ mb: 1 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography>Raw Text</Typography></AccordionSummary>
                        <AccordionDetails>
                            <Box component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '300px', overflowY: 'auto', p: 1, border: '1px solid #eee', background: '#fff' }}>
                                {parsedContent.raw_text || "No raw text available."}
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                    <Accordion>
                         <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography>Text Chunks ({parsedContent.chunks?.length || 0})</Typography></AccordionSummary>
                         <AccordionDetails sx={{maxHeight: '300px', overflowY: 'auto'}}>
                             {parsedContent.chunks && parsedContent.chunks.length > 0 ? (
                                 parsedContent.chunks.map((chunk, index) => (
                                     <Paper key={index} variant="outlined" sx={{ p: 1, mb: 1, background: index % 2 ? '#f0f0f0' : '#fff' }}>
                                         <Typography variant="caption">Chunk {index + 1}</Typography>
                                         <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                             {typeof chunk === 'string' ? chunk : chunk.text}
                                         </Typography>
                                     </Paper>
                                 ))
                             ) : <Typography>No chunks available.</Typography>}
                         </AccordionDetails>
                    </Accordion>
                </Paper>
            )}

            {/* Divider before Chat */}
            {(!isLoading || parsedContent) && <Divider sx={{ my: 3 }} />}

            {/* Chat Interface (Show always unless initial load is happening and failed badly) */}
            {(!isLoading || parsedContent) && ( // Conditionally render chat if initial load is done or content is present
                 <Box>
                      <Typography variant="h5" gutterBottom>Chat with Document</Typography>
                      <Paper elevation={3} sx={{ display: 'flex', flexDirection: 'column', height: '60vh', border: '1px solid', borderColor: 'divider' }}>
                           {/* Message Display Area */}
                           <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                                <List>
                                     {chatHistory.map((msg, index) => (
                                          <ListItem key={index} sx={{ display: 'flex', flexDirection: 'column', alignItems: msg.type === 'user' ? 'flex-end' : 'flex-start', mb: 1 }}>
                                               <Paper elevation={1} sx={{
                                                   p: 1.5,
                                                   borderRadius: msg.type === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0',
                                                   bgcolor: msg.type === 'user' ? 'primary.main' : 'grey.200',
                                                   color: msg.type === 'user' ? 'primary.contrastText' : 'text.primary',
                                                   maxWidth: '80%',
                                                   wordWrap: 'break-word',
                                               }}>
                                                   <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{msg.text}</Typography>
                                                   {msg.type === 'ai' && msg.sources && msg.sources.length > 0 && (
                                                        <Accordion sx={{ mt: 1.5, bgcolor: msg.type === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)', color: 'inherit' }} dense>
                                                             <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: msg.type === 'user' ? 'primary.contrastText' : 'action.active', fontSize:'1rem' }} />} sx={{ minHeight: '28px', '& .MuiAccordionSummary-content': { my: 0 } }}>
                                                                  <Typography variant="caption">Sources ({msg.sources.length})</Typography>
                                                             </AccordionSummary>
                                                             <AccordionDetails sx={{ p: 1, maxHeight: 150, overflowY: 'auto', bgcolor: 'background.paper', color: 'text.primary', borderRadius: '0 0 4px 4px' }}>
                                                                  {msg.sources.map((source, sIndex) => (
                                                                       <Box key={sIndex} sx={{ mb: 1, borderBottom: '1px dashed lightgrey', pb: 1, '&:last-child': { borderBottom: 0, mb: 0, pb: 0 } }}>
                                                                            <Typography variant="caption" display="block">Chunk {source.chunk_index}</Typography>
                                                                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{source.text}</Typography>
                                                                       </Box>
                                                                  ))}
                                                             </AccordionDetails>
                                                        </Accordion>
                                                   )}
                                               </Paper>
                                          </ListItem>
                                     ))}
                                      {isChatLoading && (
                                           <ListItem sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                                                <CircularProgress size={20} sx={{ mr: 1 }} />
                                                <Typography variant="body2" color="text.secondary">Thinking...</Typography>
                                           </ListItem>
                                      )}
                                      {chatError && (
                                           <ListItem sx={{ display: 'flex', justifyContent: 'center' }}>
                                                <Alert severity="error" sx={{ width: '100%', mt: 1 }}>Chat Error: {chatError}</Alert>
                                           </ListItem>
                                      )}
                                </List>
                           </Box>

                           {/* Input Area */}
                           <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1, background: (theme) => theme.palette.background.default }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    placeholder="Ask something about the document..."
                                    value={inputValue}
                                    onChange={handleInputChange}
                                    onKeyPress={handleKeyPress}
                                    disabled={isChatLoading}
                                    multiline
                                    maxRows={4}
                                />
                                <IconButton color="primary" onClick={handleSendQuery} disabled={isChatLoading || !inputValue.trim()} sx={{ alignSelf: 'flex-end', mb: '4px' /* Align with textfield bottom */ }}>
                                    <SendIcon />
                                </IconButton>
                           </Box>
                      </Paper>
                 </Box>
            )} {/* End conditional rendering for chat */}
        </Box>
    );
};

export default FileView;