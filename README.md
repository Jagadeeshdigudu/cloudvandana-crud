# CloudVandana CRUD

A full-stack CRUD application that integrates with Salesforce to manage Salesforce records through a user-friendly web interface.

## Project Overview

CloudVandana CRUD allows users to authenticate with Salesforce and perform CRUD (Create, Read, Update, Delete) operations on Salesforce data through a React-based frontend and Node.js backend.

The application communicates with Salesforce using Salesforce APIs and displays the records dynamically in the UI.

## Features

- Salesforce authentication
- Salesforce data integration
- Dynamic Salesforce object selection
- Create new records
- Read and display Salesforce records
- Update existing records
- Delete records
- Dynamic fields based on the selected Salesforce object
- Pagination / loading of additional records
- Success and error messages
- Responsive and user-friendly UI
- Data is stored directly in Salesforce

## Technologies Used

### Frontend

- React.js
- JavaScript
- HTML
- CSS
- Vite

### Backend

- Node.js
- Express.js
- Axios
- Salesforce REST API
- OAuth authentication

### Database / Platform

- Salesforce

## Project Structure

```text
cloudvandana-crud/
│
├── backend/
│   ├── index.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md