# Frontend Tech Stack
### Framework
- **Next.js (App Router)**
- **TypeScript** 
### Styling
- **Tailwind CSS**
### State Management
- **Zustand** 
### API Communication
- **Axios**
- **MSW (Mock Service Worker)**
### Testing
- **Jest**
- **React Testing Library**
---

# Frontend Architecture (MVC Architecture)
### 1️⃣ Model Layer (Client-Side Data & State)
#### The Model represents application data and business logic on the frontend.

### Responsibilities
- **Manage application state**
- **Handle API communication**
- **Store user session & tokens**
- **Control global player state**
- **Cache and update fetched data**

### 2️⃣ View Layer (UI Components & Pages)
#### The View represents everything the user sees and interacts with.

### Responsibilities
- **Render UI components**
- **Display data from the Model**
- **Trigger user events (clicks, form submissions)**
- **Maintain responsive design**

### 3️⃣ Controller Layer (Logic & Interaction Handling)
#### In our frontend architecture, the Controller is implemented through:
- Custom Hooks
- Service Functions
- Event Handlers

### Responsibilities
- **Connect View to Model**
- **Handle user interactions**
- **Validate inputs**
- **Call APIs via Axios**
- **Update Zustand state**
--- 

# Front-End Code Style
- **Folders -> kabab-case**
- **Functions  & Variables -> camelCase**
- **React Component Files -> PascalCase**
- **Regular non-component files -> camelCase**
- **Hooks-> camelCase**
- **Utility / Helper Files -> camelCase**
- **Constants -> UPPER_CASE**
#### Code formatting is enforced using ESLint and Prettier.
