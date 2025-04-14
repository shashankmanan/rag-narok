from fastapi import UploadFile,HTTPException
from decouple import config
import boto3
from datetime import datetime

class S3Handler:

    def __init__(self):
        self.s3 = boto3.client(
            's3' ,
            aws_access_key_id=config('AWS_ACCESS_KEY'),
            aws_secret_access_key=config('AWS_SECRET_ACCESS_KEY'),
            region_name=config('AWS_REGION', default='ap-south-1')
        )
        self.bucket = config('S3_BUCKET_NAME')
        
        
    def upload_file_to_s3(self,file : UploadFile , user_id):
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

    def download_file_from_s3(self, s3_key: str) -> bytes:
        """Downloads a file from S3 and returns its content as bytes."""
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


   

