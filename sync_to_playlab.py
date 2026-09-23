import os
import csv
import requests

def format_ztc_csv(file_path="ztc_live.csv"):
    """Reads the ZTC live catalog CSV and formats it into clean markdown text for the LLM."""
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found in the repository root.")
        return None

    markdown_output = "### LIVE WEST LA COLLEGE ZTC CATALOG UPDATE ###\n"
    markdown_output += "Below is the most up-to-date Zero Textbook Cost (ZTC) schedule data synced directly from the repository.\n\n"

    try:
        with open(file_path, mode="r", encoding="utf-8") as csv_file:
            # Using DictReader to cleanly capture headers: Course, Term, Section, Instructor, Units, Days, Time, Location, OER
            csv_reader = csv.DictReader(csv_file)
            
            # Create a Markdown table header
            markdown_output += "| Course | Term | Section | Instructor | Units | Days | Time | Location | OER |\n"
            markdown_output += "| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n"
            
            row_count = 0
            for row in csv_reader:
                # Sanitize pipeline layout characters
                row_clean = {k: (v.replace("|", "\\|").strip() if v else "") for k, v in row.items()}
                
                markdown_output += (
                    f"| {row_clean.get('Course')} | {row_clean.get('Term')} | {row_clean.get('Section')} | "
                    f"{row_clean.get('Instructor')} | {row_clean.get('Units')} | {row_clean.get('Days')} | "
                    f"{row_clean.get('Time')} | {row_clean.get('Location')} | {row_clean.get('OER')} |\n"
                )
                row_count += 1
                
        print(f"Successfully processed {row_count} ZTC course entries.")
        return markdown_output

    except Exception as e:
        print(f"Failed to process CSV file: {e}")
        return None

def push_to_playlab():
    # 1. Parse and format the live repository data
    formatted_data = format_ztc_csv()
    if not formatted_data:
        return

    # 2. Extract environment variables from GitHub Actions Secrets
    api_key = os.getenv("PLAYLAB_API_KEY")
    project_id = os.getenv("PLAYLAB_PROJECT_ID") # Found in your Playlab app URL

    if not api_key or not project_id:
        raise ValueError("Missing critical environment variables: PLAYLAB_API_KEY or PLAYLAB_PROJECT_ID")

    # 3. Configure Playlab Endpoint
    # Adjust this route according to whether your Org tier uses a direct project config injection 
    # or pushes to an internal assistant reference document.
    playlab_url = f"https://playlab.ai{project_id}/context" 
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "reference_text": formatted_data,
        "description": "Automated sync of West LA College live ZTC database columns"
    }

    print(f"Initiating pipeline push to Playlab Project: {project_id}...")
    try:
        response = requests.patch(playlab_url, json=payload, headers=headers)
        
        if response.status_code in [200, 201, 204]:
            print("🎉 Success! Your Playlab agent is now running on the live ztc_live.csv data.")
        else:
            print(f"❌ Failed to sync. Status code: {response.status_code}")
            print(f"Details: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"Network error trying to connect to Playlab: {e}")

if __name__ == "__main__":
    push_to_playlab()
