"""
Storage utilities for uploading generated code to S3, GCS, Azure Blob Storage, GitHub, and creating downloads.
"""

import logging
import os
import shutil
import tarfile
import tempfile
import zipfile
from pathlib import Path
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

# Environment variable to control which cloud storage providers are enabled
# Comma-separated list: "s3", "gcs", "azure" (e.g., "s3,gcs" or "s3" or "all")
ENABLED_PROVIDERS = os.getenv("CLOUD_STORAGE_PROVIDERS", "s3").lower().split(",")
ENABLED_PROVIDERS = [p.strip() for p in ENABLED_PROVIDERS]
if "all" in ENABLED_PROVIDERS:
    ENABLED_PROVIDERS = ["s3", "gcs", "azure"]

# S3 is always available (boto3 is a core dependency)
ENABLE_S3 = "s3" in ENABLED_PROVIDERS
if ENABLE_S3:
    try:
        import boto3

        HAS_S3 = True
    except ImportError:
        HAS_S3 = False
        logger.warning("S3 provider enabled but boto3 not installed")
else:
    HAS_S3 = False
    boto3 = None

# GCS is optional
ENABLE_GCS = "gcs" in ENABLED_PROVIDERS or "gcp" in ENABLED_PROVIDERS
if ENABLE_GCS:
    try:
        from google.cloud import storage as gcs_storage

        HAS_GCS = True
    except ImportError:
        HAS_GCS = False
        gcs_storage = None
        logger.warning(
            "GCS provider enabled but google-cloud-storage not installed. Install with: pip install google-cloud-storage")
else:
    HAS_GCS = False
    gcs_storage = None

# Azure Blob Storage is optional
ENABLE_AZURE = "azure" in ENABLED_PROVIDERS or "azure_blob" in ENABLED_PROVIDERS
if ENABLE_AZURE:
    try:
        from azure.storage.blob import BlobServiceClient

        HAS_AZURE = True
    except ImportError:
        HAS_AZURE = False
        BlobServiceClient = None
        logger.warning(
            "Azure provider enabled but azure-storage-blob not installed. Install with: pip install azure-storage-blob")
else:
    HAS_AZURE = False
    BlobServiceClient = None

# Log enabled providers
logger.info(f"Cloud storage providers enabled: S3={HAS_S3}, GCS={HAS_GCS}, Azure={HAS_AZURE}")


def _create_archive(
        source_path: str,
        archive_format: str = "zip",
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Create an archive from a source directory.
    
    Args:
        source_path: Path to directory to archive
        archive_format: Archive format ('zip' or 'tar.gz')
    
    Returns:
        Tuple of (success, temp_archive_path, error_message)
    """
    try:
        source = Path(source_path)
        if not source.exists() or not source.is_dir():
            return False, None, f"Source path does not exist or is not a directory: {source_path}"

        # Create temporary archive
        with tempfile.NamedTemporaryFile(suffix=f".{archive_format}", delete=False) as temp_file:
            temp_archive = temp_file.name

        # Create archive
        if archive_format == "zip":
            with zipfile.ZipFile(temp_archive, "w", zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(source):
                    # Skip hidden files and directories
                    dirs[:] = [d for d in dirs if not d.startswith(".")]
                    for file in files:
                        if not file.startswith("."):
                            file_path = Path(root) / file
                            arcname = file_path.relative_to(source)
                            zipf.write(file_path, arcname)
        elif archive_format == "tar.gz":
            with tarfile.open(temp_archive, "w:gz") as tar:
                tar.add(source, arcname=source.name,
                        filter=lambda tarinfo: None if tarinfo.name.startswith(".") else tarinfo)
        else:
            return False, None, f"Unsupported archive format: {archive_format}"

        return True, temp_archive, None

    except Exception as e:
        error_msg = f"Failed to create archive: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return False, None, error_msg


async def upload_to_s3(
        source_path: str,
        s3_bucket: str,
        s3_key: str,
        aws_region: str = "us-east-1",
        archive_format: str = "zip",
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Upload generated code directory to S3 as an archive.

    Args:
        source_path: Path to directory to upload
        s3_bucket: S3 bucket name
        s3_key: S3 object key (without extension, will be added)
        aws_region: AWS region
        archive_format: Archive format ('zip' or 'tar.gz')

    Returns:
        Tuple of (success, s3_url, error_message)
    """
    if not HAS_S3:
        return False, None, "S3 provider is not enabled or boto3 is not installed. Set CLOUD_STORAGE_PROVIDERS=s3 and install boto3."

    try:
        source = Path(source_path)
        if not source.exists() or not source.is_dir():
            return False, None, f"Source path does not exist or is not a directory: {source_path}"

        # Create archive
        archive_success, temp_archive, archive_error = _create_archive(source_path, archive_format)
        if not archive_success:
            return False, None, archive_error

        try:
            # Upload to S3
            s3_client = boto3.client("s3", region_name=aws_region)
            s3_key_with_ext = f"{s3_key}.{archive_format}"
            s3_client.upload_file(temp_archive, s3_bucket, s3_key_with_ext)

            s3_url = f"s3://{s3_bucket}/{s3_key_with_ext}"
            logger.info(f"Uploaded code to S3: {s3_url}")

            return True, s3_url, None

        finally:
            # Clean up temp archive
            if os.path.exists(temp_archive):
                os.unlink(temp_archive)

    except Exception as e:
        error_msg = f"Failed to upload to S3: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return False, None, error_msg


async def upload_to_gcs(
        source_path: str,
        gcs_bucket: str,
        gcs_key: str,
        gcp_project_id: Optional[str] = None,
        archive_format: str = "zip",
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Upload generated code directory to Google Cloud Storage (GCS) as an archive.

    Args:
        source_path: Path to directory to upload
        gcs_bucket: GCS bucket name
        gcs_key: GCS object key (without extension, will be added)
        gcp_project_id: GCP project ID (optional, uses default credentials if not provided)
        archive_format: Archive format ('zip' or 'tar.gz')

    Returns:
        Tuple of (success, gcs_url, error_message)
    """
    if not ENABLE_GCS:
        return False, None, "GCS provider is not enabled. Set CLOUD_STORAGE_PROVIDERS=gcs to enable it."

    if not HAS_GCS:
        return False, None, "GCS provider is enabled but google-cloud-storage library is not installed. Install with: pip install google-cloud-storage"

    try:
        # Create archive
        archive_success, temp_archive, archive_error = _create_archive(source_path, archive_format)
        if not archive_success:
            return False, None, archive_error

        try:
            # Initialize GCS client
            if gcp_project_id:
                gcs_client = gcs_storage.Client(project=gcp_project_id)
            else:
                gcs_client = gcs_storage.Client()

            # Upload to GCS
            bucket = gcs_client.bucket(gcs_bucket)
            gcs_key_with_ext = f"{gcs_key}.{archive_format}"
            blob = bucket.blob(gcs_key_with_ext)

            with open(temp_archive, "rb") as archive_file:
                blob.upload_from_file(archive_file)

            gcs_url = f"gs://{gcs_bucket}/{gcs_key_with_ext}"
            logger.info(f"Uploaded code to GCS: {gcs_url}")

            return True, gcs_url, None

        finally:
            # Clean up temp archive
            if os.path.exists(temp_archive):
                os.unlink(temp_archive)

    except Exception as e:
        error_msg = f"Failed to upload to GCS: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return False, None, error_msg


async def upload_to_azure_blob(
        source_path: str,
        container_name: str,
        blob_name: str,
        connection_string: Optional[str] = None,
        account_name: Optional[str] = None,
        account_key: Optional[str] = None,
        archive_format: str = "zip",
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Upload generated code directory to Azure Blob Storage as an archive.

    Args:
        source_path: Path to directory to upload
        container_name: Azure Blob Storage container name
        blob_name: Azure Blob Storage blob name (without extension, will be added)
        connection_string: Azure Storage connection string (optional)
        account_name: Azure Storage account name (optional, if connection_string not provided)
        account_key: Azure Storage account key (optional, if connection_string not provided)
        archive_format: Archive format ('zip' or 'tar.gz')

    Returns:
        Tuple of (success, azure_url, error_message)
    """
    if not ENABLE_AZURE:
        return False, None, "Azure provider is not enabled. Set CLOUD_STORAGE_PROVIDERS=azure to enable it."

    if not HAS_AZURE:
        return False, None, "Azure provider is enabled but azure-storage-blob library is not installed. Install with: pip install azure-storage-blob"

    try:
        # Create archive
        archive_success, temp_archive, archive_error = _create_archive(source_path, archive_format)
        if not archive_success:
            return False, None, archive_error

        try:
            # Initialize Azure Blob Service Client
            if connection_string:
                blob_service_client = BlobServiceClient.from_connection_string(connection_string)
            elif account_name and account_key:
                account_url = f"https://{account_name}.blob.core.windows.net"
                blob_service_client = BlobServiceClient(account_url=account_url, credential=account_key)
            else:
                # Try to get from environment variables
                connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
                if connection_string:
                    blob_service_client = BlobServiceClient.from_connection_string(connection_string)
                else:
                    return False, None, "Azure Storage credentials not provided. Provide connection_string or (account_name, account_key)"

            # Ensure container exists (create if not present)
            container_client = blob_service_client.get_container_client(container_name)
            try:
                if not container_client.exists():
                    logger.info(f"Container '{container_name}' does not exist. Creating it...")
                    container_client.create_container()
                    logger.info(f"Container '{container_name}' created successfully")
            except Exception as container_error:
                logger.warning(f"Error checking/creating container: {container_error}")
                # Continue anyway - the upload might still work if container exists

            # Upload to Azure Blob Storage
            blob_name_with_ext = f"{blob_name}.{archive_format}"
            blob_client = blob_service_client.get_blob_client(container=container_name, blob=blob_name_with_ext)

            with open(temp_archive, "rb") as archive_file:
                blob_client.upload_blob(archive_file, overwrite=True)

            azure_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{container_name}/{blob_name_with_ext}"
            logger.info(f"Uploaded code to Azure Blob Storage: {azure_url}")

            return True, azure_url, None

        finally:
            # Clean up temp archive
            if os.path.exists(temp_archive):
                os.unlink(temp_archive)

    except Exception as e:
        error_msg = f"Failed to upload to Azure Blob Storage: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return False, None, error_msg


async def upload_to_cloud_storage(
        source_path: str,
        provider: str,
        bucket: str,
        key: str,
        archive_format: str = "zip",
        **kwargs,
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Unified function to upload generated code to cloud storage (S3, GCS, or Azure Blob Storage).

    Args:
        source_path: Path to directory to upload
        provider: Cloud storage provider ('s3', 'gcs', or 'azure')
        bucket: Bucket/container name
        key: Object/blob key (without extension, will be added)
        archive_format: Archive format ('zip' or 'tar.gz')
        **kwargs: Additional provider-specific arguments:
            - For S3: aws_region (default: 'us-east-1')
            - For GCS: gcp_project_id (optional)
            - For Azure: connection_string, account_name, account_key

    Returns:
        Tuple of (success, storage_url, error_message)
    """
    provider_lower = provider.lower().strip()

    if provider_lower == "s3":
        if not ENABLE_S3:
            return False, None, "S3 provider is not enabled. Set CLOUD_STORAGE_PROVIDERS=s3 to enable it."
        aws_region = kwargs.get("aws_region", os.getenv("AWS_REGION", "us-east-1"))
        return await upload_to_s3(
            source_path=source_path,
            s3_bucket=bucket,
            s3_key=key,
            aws_region=aws_region,
            archive_format=archive_format,
        )
    elif provider_lower in ["gcs", "gcp"]:
        if not ENABLE_GCS:
            return False, None, "GCS provider is not enabled. Set CLOUD_STORAGE_PROVIDERS=gcs to enable it."
        gcp_project_id = kwargs.get("gcp_project_id") or os.getenv("GCP_PROJECT_ID")
        return await upload_to_gcs(
            source_path=source_path,
            gcs_bucket=bucket,
            gcs_key=key,
            gcp_project_id=gcp_project_id,
            archive_format=archive_format,
        )
    elif provider_lower in ["azure", "azure_blob"]:
        if not ENABLE_AZURE:
            return False, None, "Azure provider is not enabled. Set CLOUD_STORAGE_PROVIDERS=azure to enable it."
        connection_string = kwargs.get("connection_string") or os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        account_name = kwargs.get("account_name") or os.getenv("AZURE_STORAGE_ACCOUNT_NAME")
        account_key = kwargs.get("account_key") or os.getenv("AZURE_STORAGE_ACCOUNT_KEY")
        return await upload_to_azure_blob(
            source_path=source_path,
            container_name=bucket,
            blob_name=key,
            connection_string=connection_string,
            account_name=account_name,
            account_key=account_key,
            archive_format=archive_format,
        )
    else:
        return False, None, f"Unsupported cloud storage provider: {provider}. Supported providers: 's3', 'gcs', 'azure'"


async def push_to_github(
        source_path: str,
        repo_url: str,
        branch: str = "main",
        commit_message: str = "Generated code from Claude Code scaffolding",
        github_token: Optional[str] = None,
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Push generated code to GitHub repository.

    Args:
        source_path: Path to directory to push
        repo_url: GitHub repository URL (https://github.com/user/repo.git)
        branch: Branch name to push to
        commit_message: Commit message
        github_token: GitHub personal access token

    Returns:
        Tuple of (success, repo_url, error_message)
    """
    try:
        import subprocess

        source = Path(source_path)
        if not source.exists() or not source.is_dir():
            return False, None, f"Source path does not exist or is not a directory: {source_path}"

        # Get or set GitHub token
        token = github_token or os.getenv("GITHUB_TOKEN")
        if not token:
            return False, None, "GitHub token not provided. Set GITHUB_TOKEN environment variable."

        # Create temporary directory for git operations
        with tempfile.TemporaryDirectory() as temp_dir:
            repo_dir = Path(temp_dir) / "repo"

            # Clone repository with token authentication
            if repo_url.startswith("https://"):
                # Remove any existing credentials from URL
                clean_url = repo_url.replace("https://", "")
                if "@" in clean_url:
                    clean_url = clean_url.split("@", 1)[1]
                # Format: https://TOKEN@github.com/user/repo.git
                # For GitHub, use 'x-access-token' or just the token directly
                repo_url_with_token = f"https://x-access-token:{token}@{clean_url}"
                logger.info(f"Using token authentication for: https://x-access-token:***@{clean_url}")
            else:
                repo_url_with_token = repo_url
                logger.warning(f"Non-HTTPS URL provided: {repo_url}")

            # Set environment to disable credential helper
            git_env = os.environ.copy()
            git_env["GIT_TERMINAL_PROMPT"] = "0"  # Disable interactive prompts
            git_env["GIT_ASKPASS"] = "echo"  # Disable password prompts

            # Clone repository (mask token in logs)
            clone_cmd = ["git", "-c", "credential.helper=", "clone", "--depth", "1", "--branch", branch,
                         repo_url_with_token, str(repo_dir)]
            logger.info(f"Cloning repository (branch: {branch})")
            clone_result = subprocess.run(
                clone_cmd,
                capture_output=True,
                text=True,
                timeout=300,
                env=git_env,
            )

            if clone_result.returncode != 0:
                logger.warning(f"Failed to clone branch {branch}, trying default branch")
                # Try cloning without branch (might not exist yet)
                clone_result = subprocess.run(
                    ["git", "-c", "credential.helper=", "clone", "--depth", "1", repo_url_with_token, str(repo_dir)],
                    capture_output=True,
                    text=True,
                    timeout=300,
                    env=git_env,
                )
                if clone_result.returncode != 0:
                    logger.error(f"Clone failed: {clone_result.stderr}")
                    return False, None, f"Failed to clone repository: {clone_result.stderr}"
                logger.info(f"Creating new branch: {branch}")
                # Create and checkout new branch
                subprocess.run(["git", "-C", str(repo_dir), "checkout", "-b", branch], check=True, env=git_env)
            else:
                logger.info(f"Checking out existing branch: {branch}")
                # Branch exists, just checkout
                subprocess.run(["git", "-C", str(repo_dir), "checkout", branch], check=True, env=git_env)

            # Copy generated files to repository
            for item in source.iterdir():
                if item.name.startswith("."):
                    continue
                dest = repo_dir / item.name
                if item.is_dir():
                    if dest.exists():
                        shutil.rmtree(dest)
                    shutil.copytree(item, dest)
                else:
                    if dest.exists():
                        dest.unlink()
                    shutil.copy2(item, dest)

            # Commit and push
            subprocess.run(["git", "-C", str(repo_dir), "config", "user.name", "Claude Code"], check=True, env=git_env)
            subprocess.run(["git", "-C", str(repo_dir), "config", "user.email", "claude-code@ace-agents.ai"],
                           check=True, env=git_env)
            # Disable credential helper for this repo
            subprocess.run(["git", "-C", str(repo_dir), "config", "credential.helper", ""], check=True, env=git_env)

            subprocess.run(["git", "-C", str(repo_dir), "add", "."], check=True, env=git_env)

            commit_result = subprocess.run(
                ["git", "-C", str(repo_dir), "commit", "-m", commit_message],
                capture_output=True,
                text=True,
                env=git_env,
            )

            if commit_result.returncode != 0 and "nothing to commit" not in commit_result.stdout:
                return False, None, f"Failed to commit: {commit_result.stderr}"

            # Push to GitHub with token in URL
            push_result = subprocess.run(
                ["git", "-c", "credential.helper=", "-C", str(repo_dir), "push", "origin", branch],
                capture_output=True,
                text=True,
                timeout=300,
                env=git_env,
            )

            if push_result.returncode != 0:
                # Try to create branch if it doesn't exist
                create_branch_result = subprocess.run(
                    ["git", "-c", "credential.helper=", "-C", str(repo_dir), "push", "-u", "origin", branch],
                    capture_output=True,
                    text=True,
                    timeout=300,
                    env=git_env,
                )
                if create_branch_result.returncode != 0:
                    return False, None, f"Failed to push to GitHub: {push_result.stderr}\n{create_branch_result.stderr}"

            logger.info(f"Pushed code to GitHub: {repo_url} (branch: {branch})")
            return True, repo_url, None

    except subprocess.TimeoutExpired:
        return False, None, "GitHub push operation timed out"
    except Exception as e:
        error_msg = f"Failed to push to GitHub: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return False, None, error_msg


async def create_download_archive(
        source_path: str,
        output_path: Optional[str] = None,
        archive_format: str = "zip",
) -> Tuple[bool, Optional[str], Optional[str]]:
    """
    Create a downloadable archive of generated code.

    Args:
        source_path: Path to directory to archive
        output_path: Output path for archive (if None, creates in temp directory)
        archive_format: Archive format ('zip' or 'tar.gz')

    Returns:
        Tuple of (success, archive_path, error_message)
    """
    try:
        source = Path(source_path)
        if not source.exists() or not source.is_dir():
            return False, None, f"Source path does not exist or is not a directory: {source_path}"

        # Determine output path
        if output_path:
            archive_path = Path(output_path)
        else:
            # Create in temp directory
            temp_dir = Path(tempfile.gettempdir())
            archive_name = f"{source.name}_{archive_format}"
            archive_path = temp_dir / archive_name

        # Create archive
        if archive_format == "zip":
            with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as zipf:
                for root, dirs, files in os.walk(source):
                    # Skip hidden files and directories
                    dirs[:] = [d for d in dirs if not d.startswith(".")]
                    for file in files:
                        if not file.startswith("."):
                            file_path = Path(root) / file
                            arcname = file_path.relative_to(source)
                            zipf.write(file_path, arcname)
        elif archive_format == "tar.gz":
            with tarfile.open(archive_path, "w:gz") as tar:
                tar.add(source, arcname=source.name,
                        filter=lambda tarinfo: None if tarinfo.name.startswith(".") else tarinfo)
        else:
            return False, None, f"Unsupported archive format: {archive_format}"

        logger.info(f"Created archive: {archive_path}")
        return True, str(archive_path), None

    except Exception as e:
        error_msg = f"Failed to create archive: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return False, None, error_msg
