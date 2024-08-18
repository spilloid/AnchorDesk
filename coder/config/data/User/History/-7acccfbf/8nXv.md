# Dashboard Application

This project is a **React-based dashboard** that integrates with a **MySQL** database to display and manage ticket data. The application uses **Material-UI (MUI)** for styling and layout, ensuring a responsive and modern user interface. The dashboard interacts with a backend **MySQL** database to retrieve, display, and manage data about tickets, technicians, and companies.

## Key Features

- **React + Material-UI Integration**: The app provides a clean and professional dashboard interface using MUI components like `AppBar`, `Drawer`, `Card`, and more.
- **MySQL Database Interaction**: The app connects to a MySQL database using **mysql2** for retrieving ticket data, technicians, and related entities.
- **Component-based Architecture**: The app is built using React’s component structure, making it modular and scalable.
- **State Management**: Utilizes React’s state and effect hooks to manage data fetching and UI state (e.g., toggling the navigation drawer).
- **Asynchronous Data Fetching**: Data is fetched asynchronously from the MySQL database and displayed in the dashboard interface.

## Project Structure

The project is organized into a clean directory structure that separates concerns, keeping the components modular and the code maintainable:

```plaintext
/src
  /components
    - DashboardAppBar.tsx        # Manages the top navigation bar (AppBar)
    - DashboardDrawer.tsx        # Manages the side navigation drawer
  /database
    - Database.ts                # Database connection class (MySQL)
  /factories
    - TicketFactory.ts           # Factory for creating and managing tickets
  - App.tsx                      # Main application file
  - index.tsx                    # React entry point
