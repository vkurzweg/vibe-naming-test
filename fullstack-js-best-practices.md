---
trigger: always_on
---

#### General JavaScript Standards

- Enforce consistent ES6+ syntax (e.g., `const`/`let`, arrow functions, async/await)
- Suggest destructuring for props and object access
- Flag unused variables and unreachable code
- Use named exports for clarity

---

#### React (Frontend)

- Use function components and hooks instead of class components
- Suggest `useCallback` and `useMemo` where re-renders are costly
- Encourage use of `PropTypes` or TypeScript interfaces
- Promote modular structure (`/components`, `/screens`, `/hooks`)
- Detect missing ARIA labels and accessibility roles
- Validate state handling using Redux best practices (e.g., normalized state, selectors)
- Recommend `styled-components` for scoped styling
- Use the Context API for state management when needed
- Use proper prop validation with PropTypes
- Use React.memo for performance optimization when necessary
- Use fragments to avoid unnecessary DOM elements
- Use proper list rendering with keys
- Prefer composition over inheritance
---

#### Express (Backend)

- Generate REST route scaffolds using kebab-case conventions
- Validate route parameters and request bodies using `express-validator` or `Joi`
- Enforce `async/await` usage and centralized error handling
- Maintain separation of concerns (routes, controllers, services, models)
- Suggest Swagger/OpenAPI comments for documenting routes

- Use proper middleware order: body parsers, custom middleware, routes, error handlers
- Organize routes using Express Router for modular code structure
- Use async/await with proper error handling and try/catch blocks
- Create a centralized error handler middleware as the last middleware
- Use environment variables for configuration with a config module
- Implement request validation using libraries like express-validator
- Use middleware for authentication and authorization
- Use appropriate HTTP status codes in responses
---

#### MongoDB (Database)

- Use Mongoose schemas with validation and timestamps
- Apply `.lean()` to read-only queries for better performance
- Recommend indexing on commonly queried fields
- Warn if `find()` is unbounded or lacks pagination

---

#### Security and Deployment

- Enforce use of `.env` for storing credentials and secrets
- Validate secure headers and proper CORS setup in Express
- Recommend rate limiting middleware for public APIs
- Warn if database connections are unencrypted
- Suggest Docker best practices (multi-stage builds, `.dockerignore`)
