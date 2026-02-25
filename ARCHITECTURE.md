# Zustrack Project Architecture

## Directory Structure
```text
/app               # Next.js 16 App Router (Pages, layouts, loading, error files)
/components        # Reusable UI components
  /ui              # Base components (buttons, inputs)
  /map             # Map-specific components (markers, controls)
/lib               # Utilities, configurations (e.g., map config)
/actions           # Server Actions for database mutations
/hooks             # Custom React hooks
/types             # Global TypeScript definitions