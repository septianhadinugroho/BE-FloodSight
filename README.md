Certainly, here's a `README.md` file for the `be-floodsight` project, based on the provided code and file structure:

```markdown
# FloodSight Backend

FloodSight Backend is a Hapi.js-based API that serves as the backend for the FloodSight application. It handles user authentication, flood prediction requests by integrating with a machine learning model, and fetching real-time weather data for the JABODETABEK (Jakarta, Bogor, Depok, Tangerang, Bekasi) area from the BMKG API.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
  - [User Authentication](#user-authentication)
  - [Flood Prediction](#flood-prediction)
  - [Weather Data](#weather-data)
- [Data Models](#data-models)
  - [User Model](#user-model)
  - [Prediction Model](#prediction-model)
- [Middleware](#middleware)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

* **User Authentication**: Register, login, and manage user profiles with JWT-based authentication.
* **Flood Prediction**:
    * Send requests to an external Machine Learning (ML) model for flood prediction based on year, month, latitude, and longitude.
    * Store prediction results, including metadata like `kabupaten` (regency) and `kecamatan` (district), in MongoDB.
    * Retrieve historical flood predictions for a logged-in user.
* **Weather Data Integration**: Fetch current weather data for JABODETABEK areas from the BMKG API.
* **CORS Enabled**: Configured to allow cross-origin requests, suitable for a separate frontend application.
* **Error Handling**: Comprehensive error handling for API requests and external service calls.
* **Data Formatting**: Formats `kecamatan` (district) names for consistency.

## Technologies Used

* **Node.js**: JavaScript runtime.
* **Hapi.js**: A rich framework for building applications and services.
* **MongoDB Atlas**: Cloud-hosted NoSQL database.
* **Mongoose**: MongoDB object data modeling (ODM) for Node.js.
* **Axios**: Promise-based HTTP client for the browser and Node.js, used for external API calls (BMKG and ML model).
* **Axios-Retry**: Optional middleware for Axios to automatically retry failed requests.
* **Bcrypt**: Library to help hash passwords.
* **jsonwebtoken (JWT)**: Used for secure user authentication.
* **Dotenv**: Loads environment variables from a `.env` file.
* **Nodemon**: Utility that monitors for changes in your source and automatically restarts your server (for development).

## Project Structure

```
.
├── .gitignore
├── index.js
├── package.json
├── package-lock.json
├── vercel.json
├── data/
│   └── jabodetabekAreas.js
├── middlewares/
│   └── auth.js
├── models/
│   ├── prediction.model.js
│   └── user.model.js
└── routes/
    ├── prediction.routes.js
    └── user.routes.js
```

* `index.js`: The main entry point of the application, responsible for setting up the Hapi server, connecting to MongoDB, and defining core routes.
* `data/jabodetabekAreas.js`: Contains a list of JABODETABEK areas with their names, codes, and `adm4` identifiers for the BMKG API.
* `middlewares/auth.js`: Contains the `verifyToken` middleware for authenticating requests using JWT.
* `models/`: Defines Mongoose schemas and models for `User` and `Prediction` data.
* `routes/`: Contains separate route definitions for `user.routes.js` (authentication and user management) and `prediction.routes.js` (flood prediction and historical data).
* `vercel.json`: Configuration for Vercel deployment.
* `.gitignore`: Specifies intentionally untracked files to ignore.
* `package.json`: Defines project metadata and dependencies.
* `package-lock.json`: Records the exact dependency tree.

## Getting Started

### Prerequisites

Before running the application, ensure you have:

* Node.js installed (version 16.20.1 or higher is recommended due to Mongoose requirements).
* MongoDB Atlas account and a database cluster set up.
* A Machine Learning (ML) model API endpoint for flood prediction.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone [https://github.com/septianhadinugroho/be-floodsight.git](https://github.com/septianhadinugroho/be-floodsight.git)
    cd be-floodsight
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

### Environment Variables

Create a `.env` file in the root directory of the project and add the following environment variables:

```dotenv
PORT=3000
MONGO_URI="your_mongodb_connection_string"
JWT_SECRET="your_jwt_secret_key"
ML_API_URL="your_machine_learning_model_api_url"
```

* `PORT`: The port number on which the server will run (e.g., `3000`).
* `MONGO_URI`: Your MongoDB Atlas connection string.
* `JWT_SECRET`: A strong, random string used for signing JWTs.
* `ML_API_URL`: The URL of your external Machine Learning model API for flood predictions.

### Running the Application

**Development Mode (with Nodemon):**

```bash
npm start
```

This will start the server using `nodemon`, which automatically restarts the application when file changes are detected.

**Production Mode:**

```bash
node index.js
```

## API Endpoints

The API is served on `http://localhost:PORT` (or your configured host and port).

### User Authentication

* **`POST /register`**
    * Registers a new user.
    * **Request Body**:
        ```json
        {
          "name": "John Doe",
          "email": "john.doe@example.com",
          "city": "Jakarta",
          "longitude": 106.8271,
          "latitude": -6.1751,
          "password": "securepassword123"
        }
        ```
    * **Response**: Returns the registered user object (without password) and a JWT token.

* **`POST /login`**
    * Authenticates a user.
    * **Request Body**:
        ```json
        {
          "email": "john.doe@example.com",
          "password": "securepassword123"
        }
        ```
    * **Response**: Returns a success message, the user object (without password), and a JWT token.

* **`GET /users`**
    * Retrieves all users (requires authentication).
    * **Headers**: `Authorization: Bearer <token>`
    * **Response**: An array of user objects (without passwords).

* **`GET /users/{id}`**
    * Retrieves a specific user by ID (requires authentication and matching `userId`).
    * **Headers**: `Authorization: Bearer <token>`
    * **Response**: The user object (without password).

* **`PUT /users/{id}`**
    * Updates a user's information (requires authentication and matching `userId`).
    * **Headers**: `Authorization: Bearer <token>`
    * **Request Body**: (Partial updates allowed)
        ```json
        {
          "name": "Johnathan Doe",
          "city": "Bogor",
          "password": "newsecurepassword"
        }
        ```
    * **Response**: The updated user object (without password).

* **`DELETE /users/{id}`**
    * Deletes a user (requires authentication and matching `userId`).
    * **Headers**: `Authorization: Bearer <token>`
    * **Response**: A success message.

### Flood Prediction

* **`POST /api/predict`**
    * Requests a flood prediction from the ML model and saves the result.
    * **Headers**: `Authorization: Bearer <token>`
    * **Request Body**:
        ```json
        {
          "tahun": 2025,
          "bulan": "Juni",
          "latitude": -6.2088,
          "longitude": 106.8456
        }
        ```
    * **Response**: Returns the `prediksi_label` (boolean indicating flood prediction) and metadata from the ML model, including formatted `kabupaten` and `kecamatan`.
    * **Validation**: Coordinates must be within the Jabodetabek area (latitude between -6.8 and -5.9, longitude between 106.3 and 107.2).

* **`GET /api/predictions`**
    * Retrieves all historical flood predictions for the authenticated user.
    * **Headers**: `Authorization: Bearer <token>`
    * **Response**: An array of prediction objects, with formatted `kecamatan` names.

### Weather Data

* **`GET /api/weather`**
    * Fetches current weather data for all JABODETABEK areas from the BMKG API. This endpoint handles rate limiting by introducing delays between requests.
    * **Response**: An object containing weather data for each JABODETABEK area, or a list of failed areas with an error message.

## Data Models

### User Model

Represents a user in the system.

* `name`: `String`, required, trimmed.
* `email`: `String`, required, unique, lowercase.
* `city`: `String`, optional.
* `longitude`: `Number`, optional.
* `latitude`: `Number`, optional.
* `password`: `String`, required (stored as hashed).
* `timestamps`: Automatically adds `createdAt` and `updatedAt` fields.

### Prediction Model

Stores flood prediction results.

* `userId`: `ObjectId` (references `User`), required.
* `tahun`: `Number`, required (year of prediction).
* `bulan`: `String`, required (month of prediction, e.g., "Januari", "Februari").
* `latitude`: `Number`, required.
* `longitude`: `Number`, required.
* `prediksi_label`: `Boolean`, required (true if flood predicted, false otherwise).
* `kabupaten`: `String`, required (regency name).
* `kecamatan`: `String`, required (district name).
* `tanggal`: `Date`, defaults to `Date.now` (timestamp of the prediction).

## Middleware

* **`verifyToken`**: This middleware ensures that a valid JWT is present in the `Authorization` header of the request. If the token is missing or invalid, it returns a 401 Unauthorized response. If valid, it decodes the token and attaches the `userId` to `request.auth`.

## Deployment

The project includes a `vercel.json` file, indicating that it can be deployed to Vercel.

To deploy to Vercel:

1.  **Install Vercel CLI**: `npm install -g vercel`
2.  **Login to Vercel**: `vercel login`
3.  **Deploy**: `vercel`

Ensure your environment variables are configured in Vercel's project settings.

## Contributing

Feel free to open issues or submit pull requests.

## License

This project is licensed under the ISC License.
```
