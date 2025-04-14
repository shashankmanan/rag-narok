import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  IconButton,
  TablePagination,
  TextField
} from '@mui/material';
import { CloudUpload, Description, GetApp, Delete } from '@mui/icons-material';
import { upload_file,getAllFilesByOwner } from '../utils/fileUtils';

const Dashboard = () => {
  console.log("dash")
  const [files, setFiles] = useState([]);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const populateData = async () => {
      console.log("sending call")
        try {
            const userData_temp = JSON.parse(localStorage.getItem('ragnarok_user'));
            if (!userData_temp || !userData_temp.username) {
                console.error("No user data found in localStorage");
                return;
            }
            
            const username_files_api = userData_temp.username;
            const files_api_call = await getAllFilesByOwner(username_files_api);
            print(files_api_call)
            setFiles(files_api_call);
        } catch (error) {
            console.error("Error fetching files:", error);
        }
    };

    populateData();
}, []); 

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    
  };

  const handleUpload = async () => {
    if (selectedFile) {
      try {
        // Get username from local storage
        const userData = JSON.parse(localStorage.getItem('ragnarok_user'));
        const username = userData.username;
        console.log(username)
        // Call upload_file function with the actual file and metadata
        const uploadResult = await upload_file(selectedFile, username);
        // Only update local state if upload was successful
        if (uploadResult.success) {
          setFiles([newFile, ...files]);
          setSelectedFile(null);
        } else {
          console.error('Upload failed:', uploadResult.error);
          // Optionally show error to user
        }
      } catch (error) {
        console.error('Error during upload:', error);
        // Optionally show error to user
      }
    }
  };

  const handleDownload = (fileId) => {
    console.log(`Downloading file ${fileId}`);
  };

  const handleDelete = (fileId) => {
    setFiles(files.filter(file => file.id !== fileId));
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getFileIcon = (type) => {
    switch (type) {
      case 'application/pdf':
        return <Description color="error" />;
      case 'application/doc':
      case 'application/docx':
        return <Description color="primary" />;
      case 'application/ppt':
      case 'applciation/pptx':
        return <Description color="secondary" />;
      default:
        return <Description />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Upload Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Upload File
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUpload />}
            sx={{ backgroundColor: '#3FB8AF', '&:hover': { backgroundColor: '#3FB8AF', opacity: 0.9 } }}
          >
            Select File
            <input
              type="file"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          <TextField
            variant="outlined"
            size="small"
            value={selectedFile ? selectedFile.name : ''}
            placeholder="No file selected"
            InputProps={{
              readOnly: true,
            }}
            sx={{ width: 300 }}
          />
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile}
            sx={{ backgroundColor: '#0D1B2A', '&:hover': { backgroundColor: '#0D1B2A', opacity: 0.9 } }}
          >
            Upload
          </Button>
        </Box>
      </Paper>

      {/* Files Table */}
      <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
        Dashboard
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#0D1B2A' }}>
              <TableCell sx={{ color: '#EAEAEA' }}>Filename</TableCell>
              <TableCell sx={{ color: '#EAEAEA' }}>Content Type</TableCell>
              <TableCell sx={{ color: '#EAEAEA' }}>Modified At</TableCell>
              <TableCell sx={{ color: '#EAEAEA' }}>Size</TableCell>
              <TableCell sx={{ color: '#EAEAEA' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getFileIcon(file.file_type)}
                      {file.filename}
                    </Box>
                  </TableCell>
                  <TableCell>{file.file_type.toUpperCase()}</TableCell>
                  <TableCell>{file.created_at}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleDownload(file.id)}>
                      <GetApp color="primary" />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(file.id)}>
                      <Delete color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={files.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Box>
  );
};

export default Dashboard;