# Clog Codebase Rules

## Project Overview
Clog (Cave Log) is a React + TypeScript inventory management system for tracking items, locations, and inventory quantities.

## Deployment

- **space-needle**: The production home server, running pupyrus. CI/CD runs on GitHub-hosted runners, not on space-needle.
- **pupyrus**: The WordPress Docker container running on space-needle
- Publishing a GitHub release builds the plugin and attaches an installable zip to the release (`.github/workflows/deploy.yml`). Pupyrus is not touched automatically — its WordPress admin (`server/includes/updates.php`, backed by `yahnis-elsts/plugin-update-checker`) polls GitHub releases and shows an "Update available" prompt on the Plugins page; deploying is a manual "Update Now" click there.

## Code Organization

### Directory Structure
- `src/pages/` - Page-level components for routing
- `src/components/` - Reusable UI and feature components
  - `ui/` - Base UI components (Button, Input, Card, etc.)
  - `items/` - Item management components (ItemForm, ItemList, ItemDetails)
  - `locations/` - Location management components
  - `inventory/` - Inventory management components
  - `layout/` - Layout wrapper components
  - `barcode/` - barcode scanner dialog and hooks
- `src/context/` - React Context for global state (DataContext)
- `src/types/` - TypeScript type definitions
- `src/lib/` - Utility functions

The repository also contains a `server/` directory hosting a WordPress plugin and themes; Docker Compose (`docker-compose.yml`) is used to wire together a local WordPress instance, database, Redis, and the React development server.
## Naming Conventions

### Components
- **UI Components**: PascalCase filenames (e.g., `Button.tsx`, `Card.tsx`, `Input.tsx`)
  - Exported as named exports matching the filename
  - Live in `src/components/ui/`
- **Feature Components**: PascalCase filenames, should match the feature scope
  - Example: `ItemForm.tsx`, `LocationDetails.tsx`
- **Files**: Always PascalCase for components, camelCase for utilities

### Types
- Type files: `src/types/index.ts` contains all shared types
- Type suffixes: Use descriptive names (e.g., `Item`, `Location`, `Inventory`, not `ItemType`)

## Component Patterns

### Card Components
All cards must follow the structured composition pattern:
```tsx
<Card
  header={
    <CardHeader title={<CardTitle>Title Text</CardTitle>}>
      {/* Optional children like CardDescription or action buttons */}
    </CardHeader>
  }
  content={
    <CardContent>
      {/* Main content goes here */}
    </CardContent>
  }
  footer={/* Optional footer content */}
/>
```

Rules:
- Card accepts three props: `header`, `content`, and `footer`
- CardHeader requires a `title` prop containing a CardTitle component
- CardHeader can accept children for additional elements (CardDescription, CloseButton, etc.)
- Use CardContent to wrap the main content
- CardFooter is optional

### Form Components
- Form state managed with `useState` hooks
- Submit handlers prevent default and navigate on success
- Use Label components paired with Input/Select for form fields
- Forms wrapped in a Card with CardHeader containing the form title

### List Components
- Use the Table component from `src/components/ui/Table.tsx`
- Include search/filter functionality with Input
- Use Link components for navigation to detail pages
- Include action buttons (Edit, Delete) inline in table rows

## Import Conventions

### Absolute Imports
Always use the `@/` alias for imports:
```tsx
// ✅ Correct
import Button from '@/components/ui/Button';
import { useData } from '@/context/DataContext';
import { cn } from '@/lib/utils';

// ❌ Avoid
import { Button } from '../../../components/ui/Button';
```

### Import Organization
1. React and external libraries first
2. UI components
3. Feature components
4. Context/hooks
5. Types (using `type` keyword)
6. Utilities

Example:
```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ItemForm } from '@/components/items/ItemForm';
import { useData } from '@/context/DataContext';
import type { Item } from '@/types';
```

## Type Safety

- All React components should have explicit prop interfaces
- Props interface extends appropriate React types or define custom properties
- Use `type` keyword for type definitions
- Never use `any` type
- Use `React.ReactNode` for children/content props

## Global State Management

All data operations flow through `DataContext`:
- Items management
- Locations management
- Inventory management
- CRUD operations (add, update, delete, get)

Components should use `const { items, addItem, updateItem, deleteItem, ... } = useData();`

## Git Workflow

- Create feature branches for significant changes (e.g., `feature/ui-refactor`, `ui-capitalization`)
- Write descriptive commit messages with format: `type: description`
  - Examples: `refactor: restructure Card component`, `feat: add search to items list`
- Commit messages should explain the "why" not just the "what"

## React Best Practices

- Use functional components with hooks
- Use `React.forwardRef` for UI components that need ref access
- Use `displayName` for all forwardRef components
- Use type-safe event handlers: `React.FormEvent`, `React.ChangeEvent<HTMLInputElement>`
- Use `useNavigate()` hook from react-router-dom instead of Link when programmatic navigation needed
- Always handle loading and error states
- Use useOutletContext for passing data to modal/nested routes

## Styling

- Use Tailwind CSS utility classes
- Use `cn()` utility from `@/lib/utils` for conditional class merging
- Maintain consistent spacing with Tailwind (gap-2, p-6, mt-4, etc.)
- Color classes: use semantic names like `text-muted-foreground`, `bg-card`

## Future Improvements

- [ ] Add form validation error handling
- [ ] Add loading states to async operations
- [ ] Add confirmation dialogs for destructive actions
- [ ] Performance optimization with React.memo for list items
- [ ] Add accessibility attributes (aria-*, role)
- [ ] Add tests for critical user paths

## Common Patterns

### Handling onClose in Modals
When components are shown in modals via routes, they receive an `onClose` callback through `useOutletContext`:
```tsx
const { onClose } = useOutletContext<{ onClose?: () => void }>();
if (onClose) {
  onClose(); // Close the modal after successful action
}
```

### Navigation After Action
Always navigate to appropriate page after successful CRUD operations:
- After create: navigate to detail page `/items/{id}`
- After update: navigate to detail page `/items/{id}`
- After delete: navigate to list page `/items`
- On cancel: navigate back with `navigate(-1)` or to specific page

### Date Handling
Use JavaScript `Date` objects throughout the app:
- Store as ISO strings in seed data
- Parse to Date on context initialization
- Format with `.toLocaleDateString()` for display
