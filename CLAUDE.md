# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Synapse Studio is an advanced AI-driven video editing platform built with Next.js 15, React 18, and TypeScript. It combines cutting-edge AI technology with browser-native video processing to provide a powerful video creation and editing experience.

## Tech Stack

- **Next.js 15.2.3** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety (strict mode enabled)
- **Tailwind CSS 4.0** - Styling with Oxide engine
- **Zustand 5** - State management
- **TanStack React Query 5** - Server state and data fetching
- **Remotion 4** - Browser-based video composition
- **fal.ai** - AI model access and processing
- **Supabase** - File storage
- **UploadThing** - Alternative file upload solution
- **IndexedDB** - Client-side data persistence
- **Biome** - Code formatting and linting

## Common Commands

```bash
# Development
npm run dev        # Start development server (http://localhost:3000)

# Build & Production
npm run build      # Create production build
npm start          # Start production server

# Code Quality
npm run lint       # Run Next.js linting
npm run format     # Format code with Biome

# Analysis
npm run analyze    # Build with bundle analyzer (ANALYZE=true)

# Utilities
npm run update-tailwind  # Update Tailwind classes
```

## Project Structure

```
synapse-studio/
├── src/
│   ├── app/              # Next.js 15 App Router pages and API routes
│   ├── components/       # React components (organized by feature)
│   │   ├── ui/          # shadcn/ui components
│   │   ├── video/       # Video editing components
│   │   ├── flux-pro/    # Flux Pro AI tools
│   │   └── landing-*    # Landing page components
│   ├── data/            # Data layer (schema, store, queries, mutations)
│   ├── lib/             # Utilities and service integrations
│   └── hooks/           # Custom React hooks
├── docs/                # Project documentation
├── public/              # Static assets
└── scripts/             # Build and utility scripts
```

## Key Development Guidelines

### 1. Code Style and Formatting
- Use Biome for code formatting (2 spaces, double quotes)
- TypeScript strict mode is enabled - ensure proper typing
- Path alias: `@/*` maps to `./src/*`
- Imports are automatically organized by Biome
- Pre-commit hook runs formatting automatically

### 2. Component Development
- Prefer functional components with hooks
- Use shadcn/ui components from `src/components/ui`
- Follow existing component patterns and naming conventions
- Components should be modular and reusable
- Place feature-specific components in appropriate subdirectories

### 3. State Management
- Use Zustand for global state (see `src/data/store.ts`)
- Use React Query for server state and data fetching
- Prefer local component state when appropriate
- Follow established patterns for state updates

### 4. AI Model Integration
- All AI models are configured in `src/lib/fal.ts`
- Add new models to `AVAILABLE_ENDPOINTS` array
- Handle special parameters in `src/components/right-panel.tsx`
- See `docs/adding-new-models.md` for detailed guide

### 5. File Handling
- Use Supabase or UploadThing for file uploads
- Files are stored remotely, not locally
- Handle file URLs appropriately in components
- Ensure proper error handling for uploads

### 6. Next.js 15 Considerations
- Async cookies API: `await cookies()` in server components
- Dynamic page props require proper interface definition
- TypeScript build errors are currently disabled (known issue)
- Use App Router patterns, not Pages Router

### 7. Tailwind CSS v4
- Configuration is now CSS-based in `src/app/globals.css`
- Use `@theme` directive for custom theme values
- Dark mode via `@custom-variant dark`
- Plugins loaded via `@plugin` directive

### 8. API Development
- API routes in `src/app/api/`
- Use Next.js Route Handlers pattern
- Ensure proper error handling and response formats
- Consider rate limiting for AI endpoints

### 9. Performance Optimization
- Use Next.js Image component for images
- Implement proper loading states with Suspense
- Optimize bundle size with dynamic imports
- Use the bundle analyzer to identify issues

### 10. Environment Variables
- Required variables documented in `.env.example`
- Never commit sensitive values
- Use proper typing for environment variables

## Common Development Tasks

### Adding a New AI Model
1. Add model to `AVAILABLE_ENDPOINTS` in `src/lib/fal.ts`
2. Handle special parameters in `src/components/right-panel.tsx`
3. Update `GenerateData` type if needed
4. Add UI controls for model-specific parameters
5. Test thoroughly before deployment

### Updating Dependencies
1. Review breaking changes in release notes
2. Update package.json
3. Run `npm install`
4. Test all major features
5. Update relevant documentation

### Performance Optimization
1. Run `npm run analyze` to check bundle size
2. Identify large dependencies
3. Implement code splitting where appropriate
4. Use React.lazy() for route-based splitting
5. Optimize images and assets

## Documentation Standards

When updating documentation:
- Keep it concise and actionable
- Include code examples where helpful
- Update relevant docs when making changes
- Focus on "why" not just "what"
- Document any workarounds or known issues

## Testing Approach

Currently no automated testing framework is configured. When testing:
- Test in both development and production builds
- Verify functionality in different browsers
- Test with various file types and sizes
- Ensure AI model integrations work correctly
- Check responsive design on mobile devices

## Git Workflow

- Main branch: `main`
- Feature branches: `feature/description`
- Commit messages should be clear and descriptive
- Code is automatically formatted on commit
- Create PRs for significant changes

## Important Notes

- Next.js 15 has TypeScript issues in production builds - `ignoreBuildErrors` is enabled
- The project uses Biome instead of ESLint/Prettier
- No test framework is currently configured
- Dark mode is implemented via CSS custom variant
- All file storage is remote (Supabase/UploadThing)

## Resources

- [Project README](./README.md)
- [Next.js 15 Upgrade Notes](./docs/nextjs-15-upgrade.md)
- [Tailwind v4 Upgrade Notes](./docs/tailwind-v4-upgrade.md)
- [Adding New Models Guide](./docs/adding-new-models.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)