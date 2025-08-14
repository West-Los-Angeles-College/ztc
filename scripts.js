
// URL to your Google Sheet published as CSV
// Replace with your own after publishing your Google Sheet to the web.
const googleSheetCSV = "https://docs.google.com/spreadsheets/d/e/XXXXXX/pub?output=csv";

// Fallback local CSV (in case Google Sheets is unavailable)
const localCSV = "ztc_live.csv";

// Main function to load data
async function loadZTCData() {
    let csvData;
    try {
        // Try loading from Google Sheets first
        const response = await fetch(googleSheetCSV);
        if (!response.ok) throw new Error("Google Sheets fetch failed");
        csvData = await response.text();
        console.log("Loaded ZTC data from Google Sheets");
    } catch (err) {
        // Fallback to local CSV
        console.warn("Falling back to local CSV:", err);
        const response = await fetch(localCSV);
        csvData = await response.text();
    }

    // Parse and display the CSV
    const parsedData = Papa.parse(csvData, { header: true });
    displayCourses(parsedData.data);
}

// Function to display courses in a table
function displayCourses(data) {
    const tableBody = document.querySelector("#ztcTable tbody");
    tableBody.innerHTML = "";

    data.forEach(row => {
        if (!row.Course) return; // Skip empty rows
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.Course || ""}</td>
            <td>${row.Term || ""}</td>
            <td>${row.Section || ""}</td>
            <td>${row.Instructor || ""}</td>
            <td>${row.Units || ""}</td>
            <td>${row.Days || ""}</td>
            <td>${row.Time || ""}</td>
            <td>${row.Location || ""}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// Run when page loads
document.addEventListener("DOMContentLoaded", loadZTCData);
