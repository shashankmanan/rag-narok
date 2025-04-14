"""
S3 Storage Handler Module.

This module provides functionality for interacting with AWS S3 for document storage.
It handles uploading files to S3, downloading files from S3, and error handling
for these operations. It uses boto3 for AWS SDK functionality.
"""
from fastapi import UploadFile,HTTPException
from decouple import config
import boto3
from datetime import datetime

# handles s3 content


class S3Handler:
    """
    Handler for AWS S3 operations including file uploads and downloads.
    
    This class provides an interface for interacting with S3 storage,
    handling configuration, credentials, and error management.
    """

    def __init__(self):
        """
        Initialize the S3Handler with AWS credentials and bucket configuration.
        
        Reads configuration from environment variables using python-decouple.
        Sets up the boto3 S3 client with appropriate region and credentials.
        """
        self.s3 = boto3.client(
            's3' ,
            aws_access_key_id=config('AWS_ACCESS_KEY'),
            aws_secret_access_key=config('AWS_SECRET_ACCESS_KEY'),
            region_name=config('AWS_REGION', default='ap-south-1')
        )
        self.bucket = config('S3_BUCKET_NAME')
        
    # upload_file_to_s3 => input: file , user_id output: s3_key
    def upload_file_to_s3(self,file : UploadFile , user_id):
        """
        Upload a file to S3 storage with user-specific path.
        
        Args:
            file: FastAPI UploadFile object containing file data and metadata
            user_id: User identifier for organizing files in user-specific directories
            
        Returns:
            S3 key (path) where the file was stored
            
        Raises:
            HTTPException: If the upload fails due to S3 errors
        """
        try:
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            s3_key = f"user_{user_id}/{timestamp}_{file.filename}"
            
            # Upload file
            self.s3.upload_fileobj(
                file.file,
                self.bucket,
                s3_key,
                ExtraArgs={
                    'ContentType': file.content_type,
                    'ACL': 'private' 
                }
            )
            return s3_key
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"S3 Upload Error: {str(e)}"
            )
        finally:
             if hasattr(file, 'file') and not file.file.closed:
                file.file.close()

    
    # download_file => input: s3_key output:file content
    def download_file_from_s3(self, s3_key: str) -> bytes:
        """
        Download a file from S3 and return its content.
        
        Args:
            s3_key: S3 key (path) of the file to download
            
        Returns:
            Binary content of the file as bytes
            
        Raises:
            HTTPException: If file not found (404) or other S3 errors (500)
        """
        try:
            response = self.s3.get_object(Bucket=self.bucket, Key=s3_key)
            # Read the content from the streaming body
            file_content = response['Body'].read()
            return file_content
        except self.s3.exceptions.NoSuchKey:
            raise HTTPException(
                status_code=404,
                detail=f"File not found in S3 with key: {s3_key}"
            )
        except Exception as e:
            # Catch other potential Boto3/S3 errors
            raise HTTPException(
                status_code=500,
                detail=f"S3 Download Error: {str(e)}"
            )


   

