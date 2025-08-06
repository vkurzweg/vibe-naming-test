# ContextHQ: An Enterprise Platform for Agent-First Knowledge Infrastructure 🚀

## Overview

ContextHQ is a intelligent enterprise platform designed to transform how organizations manage and leverage their institutional knowledge. Moving beyond static documents and siloed information, ContextHQ introduces an **agent-first knowledge infrastructure** that provides dynamic, AI-powered guidance and ensures consistent application of company guidelines across various business domains.

At its core, ContextHQ addresses the challenges of outdated information, manual compliance checks, and fragmented processes by centralizing knowledge and enabling agents to complex, domain-specific rules to specific contexts in real time. The application is designed for highly intuitive interaction and overall effectiveness for both end-users and domain leaders, fostering seamless and intelligent interactions.

---

## Key Features

* **Dynamic Knowledge Base:** Centralizes all enterprise guidelines, policies, and conventions in a flexible MongoDB database, allowing subject matter experts (admins) to update content instantly without code deployments.

* **Role-Based Access Control (RBAC):** Securely manages user roles (e.g., `submitter`, `admin`) using Passport.js and JWT, ensuring that only authorized personnel can access and modify sensitive guideline configurations.

* **Dynamic Form Rendering:** Utilizes a reusable `DynamicForm` component that renders forms based on JSON schemas fetched from the backend, enabling rapid creation and deployment of new domain-specific request forms.

* **Agent-First AI Guidance:** Leverages the Gemini API to power intelligent agents that interpret user input and apply dynamic, context-aware guidelines to generate relevant and compliant outputs (e.g., brand-aligned name suggestions).

* **Continuous Feedback Loops:** Facilitates a cycle where guideline updates by admins immediately influence agent behavior, paving the way for future real-time pattern recognition and knowledge refinement.

* **Intuitive User Experience:** Built with Material-UI for a consistent, modern interface, and features like `react-hot-toast` for clear user feedback (loading, success, error notifications).

---

## Technology Stack

ContextHQ is built on a robust MERN (MongoDB, Express.js, React, Node.js) stack, leveraging a comprehensive set of modern libraries:

* **Frontend (React.js):**

    * **UI Framework:** `@mui/material`, `@mui/icons-material`, `@mui/lab` (Material-UI)

    * **State Management:** `@reduxjs/toolkit`, `zustand`

    * **Form Management:** `react-hook-form`, `@hookform/resolvers`, `yup`, `zod`

    * **API Client:** `axios`

    * **Data Fetching/Caching:** `@tanstack/react-query`

    * **Routing:** `react-router-dom`

    * **Notifications:** `react-hot-toast`

* **Backend (Node.js & Express.js):**

    * **Web Framework:** `express`

    * **Database:** `mongoose` (for MongoDB interaction)

    * **Authentication:** `passport`, `express-session`, `jsonwebtoken`

    * **CORS:** `cors`

    * **Logging:** `morgan`, `winston` (implied by `logger` utility)

    * **Environment Variables:** `dotenv`

    * **Real-time Communication:** `socket.io`

* **Database:** `MongoDB`

* **AI Integration:** `Gemini API` (via `generativelanguage.googleapis.com`)

---

## Architecture

ContextHQ employs a modular and scalable architecture designed for enterprise-grade performance and extensibility:

* **Decoupled Frontend & Backend:** The React frontend consumes data and services from the Node.js/Express.js backend via a RESTful API.

* **Centralized Guidelines:** All domain-specific guidelines (`prompt_template`, `principles`, `naming_dos`, `naming_donts`, etc.) are stored as a single document in MongoDB, managed by a dedicated Mongoose model.

* **Dynamic Prompt Generation:** The backend is responsible for fetching the latest guidelines, dynamically constructing the full AI prompt using placeholders (e.g., `{{principles}}`), and then invoking the Gemini API.

* **Role-Based Access Control:** Authentication (Passport.js, JWT) and authorization middleware protect sensitive backend routes (e.g., guideline updates) and control frontend UI visibility based on user roles (`user`, `admin`).

* **Reusable Components:** The `DynamicForm` component allows for rapid onboarding of new business domains by simply providing a JSON schema from the backend.

* **Modular Routes:** Backend routes are organized by domain (`auth`, `name-requests`, `users`, `form-configurations`), allowing for easy addition of new domain-specific logic (e.g., `it-support`).

---

## Getting Started

To get ContextHQ up and running locally, follow these steps:

1.  **Clone the Repository:**

    ```bash
    git clone vibe-app-test
    cd namingops
    ```

2.  **Backend Setup:**

    ```bash
    cd server
    npm install
    ```

    * **Environment Variables:** Create a `.env` file in the `server` directory with the following (replace placeholders):

        ```
        PORT=5000
        MONGO_URI=your_mongodb_connection_string
        SESSION_SECRET=a_strong_random_secret_key
        GEMINI_API_KEY=your_gemini_api_key
        NODE_ENV=development
        CLIENT_URL=http://localhost:3000
        ```

    * **Run Backend:**

        ```bash
        npm start
        ```

        The server will start on `http://localhost:5000`.

3.  **Frontend Setup:**

    ```bash
    cd ../client
    npm install
    ```

    * **Environment Variables:** Ensure your `client/.env` (or `react-dotenv` configuration) points to your backend API:

        ```
        REACT_APP_API_URL=http://localhost:5000/api/v1
        ```

    * **Run Frontend:**

        ```bash
        npm start
        ```

        The React app will start on `http://localhost:3000`.

---

## Usage

* **User Interface:** Access the application via `http://localhost:3000`. Users can describe an offering and receive AI-generated name suggestions based on the latest company guidelines.

* **Admin Interface:** (To be implemented) Admins will have a dedicated section (e.g., `/admin/guidelines`) where they can log in and modify the `prompt_template`, `principles`, `naming_dos`, and `naming_donts` directly through a user-friendly form. These changes will instantly update the AI's behavior for all users.

---

## Scalability & Future Vision

ContextHQ is designed with enterprise scalability in mind. Its modular architecture allows for seamless expansion to new domains beyond naming, such as IT support, HR requests, or project management. Each new domain can leverage the same core platform, dynamic form rendering, and AI agent capabilities by simply configuring new guidelines and API endpoints.

This platform lays the groundwork for a truly **agent-first enterprise**, where intelligent systems proactively assist employees, enforce compliance, and continuously learn from evolving data, transforming static knowledge into dynamic, data-driven reasoning.

---

## Contributing

We welcome contributions! Please see our `CONTRIBUTING.md` for guidelines.

---

## License

This project is licensed under the MIT License.
