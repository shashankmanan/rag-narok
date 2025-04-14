import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Button, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, TablePagination, TextField
} from '@mui/material';
import { CloudUpload, Description, GetApp, Delete } from '@mui/icons-material';
// Import navigation hook
import { useNavigate } from 'react-router-dom'; // <-- Import useNavigate
import { upload_file, getAllFilesByOwner } from '../utils/fileUtils'; // Assuming deleteFile and download utilities exist/will be added
import { Link as RouterLink } from 'react-router-dom';

const Dashboard = () => {
    console.log("Dashboard component mounted");
    const [files, setFiles] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [selectedFile, setSelectedFile] = useState(null);
    const [username, setUsername] = useState(''); // Store username in state

    const navigate = useNavigate(); // <-- Initialize useNavigate

    // Function to fetch files (extracted for re-use)
    const populateData = async (currentUser) => {
      if (!currentUser) {
           console.error("No username provided for fetching data");
           return;
      }
      console.log(`Workspaceing files for: ${currentUser}`);
      try {
          const files_api_call = await getAllFilesByOwner(currentUser);

          // --- CORRECTED CHECK ---
          // Check if the response ITSELF is an array
          if (Array.isArray(files_api_call)) {
               console.log('API Response (Array):', files_api_call);
               setFiles(files_api_call); // Set state directly with the received array
          } else {
               // Handle cases where the response is NOT an array
               console.error("Expected an array for files list but received:", files_api_call);
               setFiles([]); // Set to empty array on unexpected data type
          }
          // --- END CORRECTED CHECK ---

      } catch (error) {
          console.error("Error fetching files:", error);
          setFiles([]); // Clear files on error
      }
  };


    useEffect(() => {
        console.log("Dashboard useEffect running");
        const userData_temp = JSON.parse(localStorage.getItem('ragnarok_user'));
        if (!userData_temp || !userData_temp.username) {
            console.error("No user data found in localStorage on mount");
            return;
        }
        const currentUser = userData_temp.username;
        console.log(currentUser)
        setUsername(currentUser); // Store username
        populateData(currentUser); // Fetch initial data

    }, [navigate]); // Added navigate to dependency array as per ESLint recommendation, though not strictly necessary if navigation isn't dependent on its change

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleUpload = async () => {
        if (selectedFile && username) { // Ensure username is available
            try {
                console.log(`Uploading file for user: ${username}`);
                const uploadResult = await upload_file(selectedFile, username);
                console.log(uploadResult)
                // Check for successful upload AND returned file data
                if (uploadResult.success) {
                    // console.log('Upload successful, navigating to file view:', uploadResult.file.id);
                    setSelectedFile(null); // Clear selection
                    
                    // --- Navigate to the new FileView page ---
                    navigate(`/view/${uploadResult.fileId}`, {
                         state: { filename: uploadResult.fileName } // Optional: pass filename via state
                    });
                    // --- End Navigation ---

                    // Note: We removed the local setFiles update here because we navigate away.
                    // If staying on the page, you might re-fetch: populateData(username);
                } else {
                    console.error('Upload failed or file data missing in response:', uploadResult);
                    alert(`Upload failed: ${uploadResult?.message || 'Unknown error'}`); // Show feedback
                }
            } catch (error) {
                console.error('Error during upload:', error);
                alert(`Upload error: ${error.message || 'Check console for details'}`); // Show feedback
            }
        } else {
             if (!selectedFile) console.error("No file selected for upload.");
             if (!username) console.error("Username not found for upload.");
        }
    };

    // --- handleDelete and other functions remain similar, ensure API calls are implemented ---
     const handleDelete = async (fileId) => {
        const confirmDelete = window.confirm(`Are you sure you want to delete file ID ${fileId}?`);
        if (confirmDelete && username) {
            try {
                 console.log(`Attempting to delete file ${fileId} for user ${username}`);
                 // Assume you have a deleteFile(fileId, owner) utility function
                 // const deleteResult = await deleteFile(fileId, username);
                 // if (deleteResult.success) {
                 //    console.log(`File ${fileId} deleted successfully.`);
                 //    setFiles(files.filter(file => file.id !== fileId)); // Update local state
                 // } else {
                 //    console.error("Failed to delete file on server:", deleteResult?.error);
                 //    alert(`Failed to delete file: ${deleteResult?.error || 'Unknown reason'}`);
                 // }
                 alert("Delete functionality needs backend API call implementation.");
                 // Placeholder until delete API is ready:
                  setFiles(files.filter(file => file.id !== fileId));
            } catch (error) {
                console.error("Error deleting file:", error);
                alert(`Error deleting file: ${error.message}`);
            }
        }
    };

     const handleDownload = (fileId) => {
        console.log(`Downloading file ${fileId} (needs implementation)`);
        alert("Download functionality needs implementation.");
        // Implementation would likely involve calling a backend endpoint
        // that returns a download link (e.g., pre-signed URL) or the file stream.
     };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    // --- getFileIcon remains the same (fix typo) ---
    const getFileIcon = (type) => {
       const contentType = type?.toLowerCase() || ''; // Handle potential null/undefined type
       switch (contentType) {
         case 'application/pdf':
           return <Description color="error" />;
         case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // .docx
         case 'application/msword': // .doc
           return <Description color="primary" />;
         case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': // .pptx
         case 'application/vnd.ms-powerpoint': // .ppt
           return <Description color="secondary" />; // <-- Fixed typo here
         default:
           return <Description />;
       }
    };

    // --- JSX Render remains mostly the same ---
    // Ensure the table rendering fixes from previous step are applied
    return (
        <Box sx={{ p: 3 }}>
            {/* Upload Section (No changes needed here) */}
             <Paper elevation={3} sx={{ p: 3, mb: 4, textAlign: 'center' }}>
                 {/* ... existing upload Button, TextField, Button ... */}
                 <Typography variant="h6" gutterBottom>Upload File</Typography>
                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                     <Button
                         variant="contained" component="label" startIcon={<CloudUpload />}
                         sx={{ backgroundColor: '#3FB8AF', '&:hover': { backgroundColor: '#3FB8AF', opacity: 0.9 } }}
                     >
                         Select File <input type="file" hidden onChange={handleFileChange} />
                     </Button>
                     <TextField
                         variant="outlined" size="small" value={selectedFile ? selectedFile.name : ''}
                         placeholder="No file selected" InputProps={{ readOnly: true }} sx={{ width: 300 }}
                     />
                     <Button
                         variant="contained" onClick={handleUpload} disabled={!selectedFile}
                         sx={{ backgroundColor: '#0D1B2A', '&:hover': { backgroundColor: '#0D1B2A', opacity: 0.9 } }}
                     > Upload </Button>
                 </Box>
             </Paper>

            {/* Files Table */}
            <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>Dashboard</Typography>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                         {/* ... Table Headers ... */}
                         <TableRow sx={{ backgroundColor: '#0D1B2A' }}>
                             <TableCell sx={{ color: '#EAEAEA' }}>Filename</TableCell>
                             <TableCell sx={{ color: '#EAEAEA' }}>Content Type</TableCell>
                             <TableCell sx={{ color: '#EAEAEA' }}>Uploaded At</TableCell>
                             {/* <TableCell sx={{ color: '#EAEAEA' }}>Size</TableCell> */}
                             <TableCell sx={{ color: '#EAEAEA' }}>Actions</TableCell>
                         </TableRow>
                    </TableHead>
                    <TableBody>
                        {Array.isArray(files) && files.length > 0 ? (
                             files
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((file) => (
                                <TableRow key={file.id}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getFileIcon(file.file_type)}
                                            {/* --- Wrap filename with RouterLink --- */}
                                            <RouterLink
                                                to={`/view/${file.id}`} // Dynamic route using file ID
                                                sx={{
                                                    textDecoration: 'none', // Remove underline
                                                    color: 'inherit',       // Inherit color from parent (TableCell)
                                                    '&:hover': {
                                                        textDecoration: 'underline', // Add underline on hover
                                                        // color: 'primary.main', // Optional: change color on hover
                                                    }
                                                }}
                                            >
                                                {file.filename}
                                            </RouterLink>
                                            {/* --- End RouterLink wrapper --- */}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{file.file_type ? file.file_type.toUpperCase() : 'N/A'}</TableCell>
                                    <TableCell>{file.created_at ? new Date(file.created_at).toLocaleString() : 'N/A'}</TableCell>
                                    {/* <TableCell>{file.size ? formatFileSize(file.size) : 'N/A'}</TableCell> */}
                                    <TableCell> {/* Actions Cell */}
                                        <IconButton onClick={() => handleDownload(file.id)} title="Download"> <GetApp color="primary" /> </IconButton>
                                        <IconButton onClick={() => handleDelete(file.id)} title="Delete"> <Delete color="error" /> </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                 <TableCell colSpan={4} align="center"> No files found or data is loading... </TableCell>
                            </TableRow>
                         )}
                    </TableBody>
                </Table>
            </TableContainer>
            {/* Pagination - Only render if files exist */}
            {Array.isArray(files) && files.length > 0 && (
                 <TablePagination
                     rowsPerPageOptions={[5, 10, 25]}
                     component="div"
                     count={files.length}
                     rowsPerPage={rowsPerPage}
                     page={page}
                     onPageChange={handleChangePage}
                     onRowsPerPageChange={handleChangeRowsPerPage}
                     // --- Add the sx prop for styling ---
                     sx={{
                         color: 'white', // Sets the default text color for items like "Rows per page" and "1-5 of 13"

                         // Target the dropdown select text and icon
                         '.MuiSelect-select': {
                             color: 'white',
                         },
                         '.MuiSelect-icon': { // The dropdown arrow
                             color: 'white',
                         },

                         // Target the IconButtons used for previous/next page arrows
                         '.MuiIconButton-root': {
                             color: 'white',
                         },

                         // Optional: Style the disabled state of the arrows if needed
                         '.MuiIconButton-root.Mui-disabled': {
                             color: 'rgba(255, 255, 255, 0.5)', // Example: semi-transparent white when disabled
                         },

                         // Ensure borders or other elements aren't negatively impacted
                         // You might need to inspect elements in your browser dev tools
                         // if specific parts don't look right.
                     }}
                     // --- End sx prop ---
                 />
            )}
        </Box>
    );
};

export default Dashboard;