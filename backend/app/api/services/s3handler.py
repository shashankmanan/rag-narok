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
            file.file.close()

