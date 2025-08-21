# TRYBE (Trust Your Vybe) - AI-Powered Digital Banking Solution

## Overview
TRYBE is an innovative AI-powered digital banking solution designed to address the persistent issues of "floating cash" and transaction reliability in banking applications. This project aims to enhance user experience by providing proactive, intelligent agents that monitor, predict, and resolve transactional anomalies in real-time.

## Key Features
- **Discrepancy Detector**: Monitors transaction ledgers for anomalies and detects discrepancies in real-time.
- **Risk Predictor**: Forecasts potential transaction delays and assesses risks associated with transactions.
- **Auto-Reconciler**: Automates retries and reversals of transactions to ensure timely resolution of issues.
- **User Notifier**: Sends timely notifications to users regarding their transaction statuses with culturally-aware messaging.
- **Ops Assistant**: Manages unresolved transaction cases and escalates issues when necessary.
- **Trust Manager**: Orchestrates the interactions between different agents to ensure smooth operation and decision-making.

## Components
- **Chatbot**: Provides an interface for user interactions, allowing users to communicate and receive updates.
- **Transaction List**: Displays a list of transactions with their current statuses.
- **Transaction Status**: Shows the current status of individual transactions.
- **Notification Banner**: Displays notifications to users about important updates.
- **Feedback Prompt**: Collects user feedback after transactions to improve service quality.
- **Admin Dashboard**: Provides an overview of unresolved issues and flagged transactions.

## Pages
- **Home**: The landing page of the application.
- **Transactions**: Displays detailed information about transactions.
- **Admin**: Provides administrative functionalities for managing transactions and issues.
- **Not Found**: Displays a 404 error message for unmatched routes.

## Setup Instructions
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd trybe-frontend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm start
   ```
5. Open your browser and go to `http://localhost:3000` to view the application.

## Usage Guidelines
- Users can initiate transactions and monitor their statuses through the application.
- The chatbot interface allows users to ask questions and receive real-time updates.
- Admins can access the Admin Dashboard to manage unresolved transaction cases.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.