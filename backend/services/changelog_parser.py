import requests

def get_changelog_summary(image_name: str, new_version: str):
    """
    This is a stub. Real implementation would look up the GitHub repo for the image
    and fetch the release notes for the tag using the GitHub API.
    """
    # A mock return for now
    return f"Update {new_version} for {image_name} brings performance improvements, bug fixes, and security patches. Ensure you backup configuration before updating."
