# Enhanced Folder Structure

backend/
src/
|
|-- controllers/
|   |-- attendance.controller.ts           # Original attendance controller
|   |-- enhancedAttendance.controller.ts  # NEW: Enhanced attendance with server-side timing
|   |-- enhancedAuth.controller.ts        # NEW: Email verification & password reset
|   `-- auth.controller.ts               # Original auth controller
|
|-- services/
|   |-- attendance.service.ts             # Original attendance service
|   |-- enhancedAttendance.service.ts      # NEW: Server-side attendance logic
|   |-- auth.service.ts                   # Original auth service
|   |-- enhancedAuth.service.ts           # NEW: Email verification & password management
|   |-- email.service.ts                  # NEW: Email sending functionality
|   |-- cron.service.ts                   # Existing: Background jobs
|   `-- ...
|
|-- models/
|   |-- models.ts                         # Original models
|   |-- enhancedModels.ts                 # NEW: Enhanced schemas with email verification
|   `-- ...
|
|-- repositories/
|   |-- repositories.ts                    # Existing repositories
|   `-- ...
|
|-- routes/
|   |-- attendance.routes.ts              # Original attendance routes
|   |-- enhancedAttendance.routes.ts     # NEW: Enhanced attendance endpoints
|   |-- enhancedAuth.routes.ts            # NEW: Email verification & password reset routes
|   `-- ...
|
|-- middleware/
|   |-- auth.middleware.ts                # Existing: JWT middleware
|   |-- rateLimit.middleware.ts           # Existing: Rate limiting
|   `-- validation.middleware.ts          # NEW: Request validation (Joi/Zod)
|
|-- types/
|   |-- index.ts                          # Existing: Type definitions
|   `-- ...
|
|-- utils/
|   |-- validation.ts                     # NEW: Validation schemas
|   |-- helpers.ts                        # NEW: Helper functions
|   `-- ...
|
|-- config/
|   |-- database.ts                       # NEW: Database configuration
|   |-- email.ts                          # NEW: Email configuration
|   `-- ...
|
`-- index.ts                             # Main application entry point

# Key Files Created:
1. enhancedModels.ts - MongoDB schemas with email verification
2. email.service.ts - Email sending functionality
3. enhancedAuth.service.ts - Complete auth with email verification
4. enhancedAttendance.service.ts - Server-side attendance logic
5. enhancedAuth.controller.ts - Auth endpoints
6. enhancedAttendance.controller.ts - Attendance endpoints
7. enhancedAuth.routes.ts - Auth routes
8. enhancedAttendance.routes.ts - Attendance routes
9. validation.middleware.ts - Request validation
10. .env.enhanced - Environment variables template
