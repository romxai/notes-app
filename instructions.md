# MERN Stack Study Assistant App - Project Requirement Document (PRD)

## 1. Project Overview

### 1.1 Introduction

The Study Assistant App is designed to help users efficiently process, organize, and understand study materials through an interactive chat interface. Users can upload documents (PDFs, DOCX, TXT, images) that the AI agent processes to generate well-formatted notes, flowcharts, and pictographs. The system leverages the Gemini API (free tier) for AI responses, uses Tesseract.js for OCR, and integrates web scraping via free tiers of Tavily or BraveSearch for sourcing additional information. The app is built on the MERN stack using TypeScript and is fully deployable on Vercel with auto-deployment from GitHub.

### 1.2 Objectives

- **Efficient Content Processing:** Enable users to upload and process study materials via an intuitive chat interface.
- **AI-Generated Study Materials:** Allow generation of notes, flowcharts, and pictographs at various detail levels.
- **Web Integration:** Incorporate web search results with citations using free tiers of Tavily/BraveSearch.
- **User Management:** Provide account-based access with persistent storage of study materials.
- **Scalable Processing:** Use real-time processing for small tasks and asynchronous (queue-based) processing for large documents.
- **Developer Efficiency:** Ensure streamlined development with a monolithic architecture and modern tooling.

---

## 2. Development Roadmap

### Phase 1: Core Feature Development

1. **User Authentication & Account Management**

   - Implement JWT-based authentication.//
   - Create user registration and login endpoints.//
   - Develop a simple UI for account management.--

2. **Chat Interface & Document Upload**

   - Build a minimalistic chat UI using React (TypeScript) styled with Tailwind CSS and ShadCN UI.//
   - Allow file uploads directly in the chat (using Cloudinary for storage).--
   - Integrate React Context API for state management and Axios for API calls.//

3. **Basic AI Integration**
   - Connect the chat interface with the Gemini API for real-time responses.//
   - Process text-based queries and small document uploads synchronously.--

### Phase 2: Advanced Content Processing

4. **Asynchronous Document Processing**

   - Implement background processing for large documents using Redis (with BullMQ).
   - Queue tasks for OCR processing (using Tesseract.js) and AI note generation.
   - Provide status feedback (via polling) for asynchronous jobs.

5. **AI-Generated Notes & Visual Aids**
   - Enable generation of notes with adjustable detail levels (beginner, detailed, exam-focused).
   - Integrate flowchart and pictograph generation on user request.
   - Allow notes to be editable after generation (as a future enhancement).

### Phase 3: Web Search & Additional Integrations

6. **Web Scraping & Source Integration**

   - Integrate free tiers of Tavily or BraveSearch for web scraping.
   - Prioritize recent sources and enable follow-up queries based on search results.
   - Display and cite sources without strict formatting (APA/MLA not required initially).

7. **Downloadable Study Materials**
   - Provide options to download generated notes and visual aids as PDFs or other formats.
   - Ensure user-friendly export functionalities.

### Phase 4: Optimization and Deployment

8. **Performance and Monitoring**

   - Optimize API response times with proper caching and error handling.
   - Set up logging (using Winston/Morgan) and monitoring (using Sentry) for production issues.

9. **CI/CD and Auto Deployment**

   - Configure GitHub Actions for auto-deployment to Vercel.
   - Ensure environment variables and secrets are securely managed.

10. **Documentation and Testing**
    - Write detailed documentation for both developers and end-users.
    - Set up unit and integration tests using Jest and React Testing Library.

---

## 3. Core Functionalities

### 3.1 User & Content Handling

- **Document Upload:**
  - Upload documents (PDF, DOCX, TXT, images) within the chat interface.
  - Use Cloudinary for cloud-based storage.
  - Enforce rate limits and file size/character-page limits.
- **Account-Based System:**
  - Persistent storage for user notes and study materials.
  - Option for users to delete their stored notes.
- **Organization:**
  - _(Future Feature)_ Allow users to organize notes into categories or folders.

### 3.2 AI Processing & Integration

- **AI Chat and Note Generation:**
  - Direct API calls to the Gemini API for processing user prompts.
  - Generate study notes at multiple detail levels.
- **OCR Processing:**
  - Use Tesseract.js for extracting text from images.
- **Async Processing:**
  - Handle larger document processing asynchronously using Redis and BullMQ.
  - Provide status updates via polling rather than WebSockets.

### 3.3 Flowcharts & Visual Aids

- **User-Requested Visuals:**
  - Generate flowcharts and pictographs upon explicit user request.
  - Support multiple flowchart styles (hierarchical, cyclical, etc.).
- **Editing Capabilities:**
  - Initial release: Visuals are generated as-is.
  - Future Enhancements: Introduce customization and editing features.

### 3.4 Web Search & Source Integration

- **Web Scraping:**
  - Utilize the free tier of Tavily or BraveSearch for fetching related information.
- **Source Handling:**
  - Prioritize recent sources and allow follow-up queries.
  - Display citations alongside search results without enforcing strict formats.

---

## 4. Additional Information

### 4.1 Project Setup Guidelines

- **Component Placement:**
  - All components in `/components`, named in `kebab-case`.
- **Pages Structure:**
  - All pages in `/app` directory, using Next.js 14 app router.
- **Data Fetching:**
  - Perform data fetching in server components, pass data down as props.
- **Client Components:**
  - Use `'use client'` for components with state or hooks.

### 4.2 Server-Side API Calls

- **External API Interactions:**
  - Handled server-side in dedicated API routes under `/app/api`.
- **Client-Side Data Fetching:**
  - Fetch data through these API routes.

### 4.3 Environment Variables

- **Sensitive Information:**
  - Store in `.env.local`, ensure it's in `.gitignore`.
- **Production Setup:**
  - Set environment variables in deployment platform (e.g., Vercel).

### 4.4 Error Handling and Logging

- **Server-Side Errors:**
  - Log errors for debugging.
- **Client-Side Messaging:**
  - Display user-friendly error messages.

### 4.5 Type Safety

- **TypeScript Usage:**
  - Use interfaces and types, avoid `any`.

### 4.6 API Client Initialization

- **Server-Side Initialization:**
  - Initialize API clients in server-side code.

### 4.7 Data Fetching in Components

- **Server Components:**
  - For initial data fetching.
- **Client Components:**
  - Use `useEffect` if necessary.

### 4.8 Next.js Configuration

- **Environment Variables Exposure:**
  - Use `next.config.mjs` and `publicRuntimeConfig` carefully.

### 4.9 CORS and API Routes

- **CORS Handling:**
  - Use Next.js API routes to manage CORS issues.

### 4.10 Component Structure

- **Separation of Concerns:**
  - Separate client and server components appropriately.

### 4.11 Security

- **API Key Protection:**
  - Never expose sensitive data to the client side.

### 4.12 CI/CD Pipeline and Deployment

- **GitHub Actions:**

  - Automate testing and deployment via Vercel.
  - Run tests and linting on pull requests before merging to the main branch.

- **Vercel Auto-Deploy:**

  - Ensure the latest version is always live without manual intervention.

- **Environment Variables:**
  - Managed securely to prevent leaks.

---

## 5. Dependencies

- **Next.js**
- **Firebase**
  ```bash
  npm install firebase
  ```
- **Tailwind CSS**
  ```bash
  npm install tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```
- **Shadcn/UI**
  - Follow the [Shadcn/UI GitHub page](https://github.com/shadcn/ui).
- **Lucide Icons**
  ```bash
  npm install lucide-react
  ```
- **OpenAI API Client**
  ```bash
  npm install openai
  ```
- **BullMQ & Redis for Queue Processing**
  ```bash
  npm install bullmq ioredis
  ```

---

## 6. Development Guidelines

- **Code Quality:**
  - Use Prettier and ESLint.
- **Version Control:**
  - Use Git, add `.gitignore`.
- **Testing:**
  - Use Jest and React Testing Library.
- **Deployment:**
  - Deploy on Vercel, configure environment variables.

---

## 7. Proposed File Structure

```
study-assistant-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.ts
│   │   │   └── signup.ts
│   │   ├── upload.ts
│   │   ├── ai/generateNotes.ts
│   │   ├── ocr.ts
│   │   └── websearch.ts
├── components/
│   ├── ChatBox.tsx
│   ├── FileUpload.tsx
│   ├── NoteDisplay.tsx
│   ├── FlowchartViewer.tsx
│   └── LoadingSpinner.tsx
├── context/
│   └── AppContext.tsx
├── lib/
│   ├── apiClient.ts
│   ├── cloudinary.ts
│   ├── redisQueue.ts
│   └── tesseractHelper.ts
├── models/
│   ├── User.ts
│   └── Note.ts
├── .env.local
├── next.config.js
├── package.json
└── README.md
```

This document fully details all aspects of the project from development to deployment.
