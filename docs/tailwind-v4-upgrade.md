# Tailwind CSS v4 Upgrade Plan

This document outlines our plan for upgrading from Tailwind CSS 3.4.1 to Tailwind CSS 4.0 in the Synapse Studio project.

## Current Setup Analysis

**Project Configuration:**
- Next.js: 14.2.23
- Tailwind CSS: 3.4.1
- PostCSS plugins: tailwindcss, autoprefixer
- Custom theme with HSL color system
- Integration with uploadthing via `withUt` wrapper
- Extensive use of Radix UI components

**Key Configuration Files:**
- `tailwind.config.ts`: Custom theme configuration with HSL variables
- `postcss.config.mjs`: Standard PostCSS setup
- `src/app/globals.css`: Global styles with Tailwind directives

## Upgrade Benefits

1. **Performance Improvements**
   - 10x faster builds with Rust-based Oxide engine
   - 35% smaller installation footprint
   - Microsecond-level incremental rebuilds (vs. milliseconds)

2. **Developer Experience**
   - Zero-configuration content detection
   - CSS-first configuration with `@theme` directives
   - Simplified setup process

3. **Modern CSS Features**
   - Native container queries
   - CSS cascade layers
   - 3D transformations
   - Wide gamut color support

## Upgrade Plan

### Phase 1: Preparation (Estimated: 1 day)

1. **Create a dedicated branch**
   ```bash
   git checkout -b tailwind-v4-upgrade
   ```

2. **Update dependencies**
   ```bash
   npm install tailwindcss@4 @tailwindcss/postcss postcss
   ```

3. **Run the official upgrade tool**
   ```bash
   npx @tailwindcss/upgrade
   ```

4. **Update PostCSS config**
   ```js
   // postcss.config.mjs
   export default {
     plugins: {
       '@tailwindcss/postcss': {},
       'autoprefixer': {}
     }
   }
   ```

5. **Backup current configuration**
   ```bash
   cp tailwind.config.ts tailwind.config.ts.backup
   cp postcss.config.mjs postcss.config.mjs.backup
   cp src/app/globals.css src/app/globals.css.backup
   ```

### Phase 2: Configuration Migration (Estimated: 1-2 days)

1. **Migrate theme configuration to CSS**

   Current approach (v3.4.1):
   ```ts
   // tailwind.config.ts
   const config: Config = withUt({
     theme: {
       extend: {
         colors: {
           background: {
             DEFAULT: "hsl(var(--background))",
             dark: "hsl(var(--background-dark))",
             // ...
           },
           // ...
         },
         // ...
       },
     },
     // ...
   });
   ```

   New approach (v4.0):
   ```css
   /* src/app/globals.css */
   @import "tailwindcss";

   @theme {
     /* Base colors */
     --color-background: hsl(var(--background));
     --color-background-dark: hsl(var(--background-dark));
     --color-background-light: hsl(var(--background-light));
     --color-foreground: hsl(var(--foreground));
     
     /* Component colors */
     --color-card: hsl(var(--card));
     --color-card-foreground: hsl(var(--card-foreground));
     --color-popover: hsl(var(--popover));
     --color-popover-foreground: hsl(var(--popover-foreground));
     
     /* Semantic colors */
     --color-primary: hsl(var(--primary));
     --color-primary-foreground: hsl(var(--primary-foreground));
     --color-secondary: hsl(var(--secondary));
     --color-secondary-foreground: hsl(var(--secondary-foreground));
     --color-muted: hsl(var(--muted));
     --color-muted-foreground: hsl(var(--muted-foreground));
     --color-accent: hsl(var(--accent));
     --color-accent-foreground: hsl(var(--accent-foreground));
     --color-destructive: hsl(var(--destructive));
     --color-destructive-foreground: hsl(var(--destructive-foreground));
     
     /* UI colors */
     --color-border: hsl(var(--border));
     --color-input: hsl(var(--input));
     --color-ring: hsl(var(--ring));
     
     /* Chart colors */
     --color-chart-1: hsl(var(--chart-1));
     --color-chart-2: hsl(var(--chart-2));
     --color-chart-3: hsl(var(--chart-3));
     --color-chart-4: hsl(var(--chart-4));
     --color-chart-5: hsl(var(--chart-5));
     
     /* Flora colors */
     --color-flora-card: rgba(0, 0, 0, 0.8);
     --color-flora-border: rgba(255, 255, 255, 0.05);
     --color-flora-hover: rgba(255, 255, 255, 0.1);
     --color-flora-accent: rgba(60, 60, 255, 0.15);
     --color-flora-accent-hover: rgba(60, 60, 255, 0.2);
     --color-flora-accent-text: rgb(120, 120, 255);
     
     /* Border radius */
     --radius-lg: var(--radius);
     --radius-md: calc(var(--radius) - 2px);
     --radius-sm: calc(var(--radius) - 4px);
   }
   ```

2. **Update animation definitions**
   ```css
   /* src/app/globals.css */
   @keyframes accordion-down {
     from { height: 0; }
     to { height: var(--radix-accordion-content-height); }
   }
   
   @keyframes accordion-up {
     from { height: var(--radix-accordion-content-height); }
     to { height: 0; }
   }
   
   @layer utilities {
     .animate-accordion-down {
       animation: accordion-down 0.2s ease-out;
     }
     
     .animate-accordion-up {
       animation: accordion-up 0.2s ease-out;
     }
   }
   ```

3. **Handle uploadthing integration**
   - Test if the `withUt` wrapper is compatible with v4
   - If not, implement alternative approach:
   ```css
   /* src/app/globals.css */
   @import "tailwindcss";
   @import "@uploadthing/react/styles.css";
   ```

### Phase 3: Component Testing (Estimated: 2-3 days)

1. **Test critical components**
   - Landing page components
   - UI components (buttons, inputs, dialogs)
   - Layout components
   - Flux Pro components

2. **Check for breaking changes**
   - Border utilities (default border color removed)
   - Ring utilities (default width changed from 3px to 1px)
   - Opacity utilities (syntax changed)

3. **Test responsive behavior**
   - Verify media query breakpoints work as expected
   - Test container queries if implemented

4. **Verify animations and transitions**
   - Check accordion animations
   - Verify hover/focus states

### Phase 4: Performance Validation (Estimated: 1 day)

1. **Benchmark build times**
   ```bash
   time npm run build
   ```

2. **Test development experience**
   ```bash
   npm run dev
   ```

3. **Validate in production environment**
   - Deploy to a staging environment
   - Test all critical user flows

### Phase 5: Documentation & Finalization (Estimated: 1 day)

1. **Update documentation**
   - Document any component changes
   - Update styling guidelines

2. **Create pull request**
   - Comprehensive PR description with changes made
   - Before/after performance metrics

3. **Team review**
   - Walkthrough of changes
   - Address feedback

## Rollback Plan

If critical issues are encountered:

1. **Revert to backup files**
   ```bash
   mv tailwind.config.ts.backup tailwind.config.ts
   mv postcss.config.mjs.backup postcss.config.mjs
   mv src/app/globals.css.backup src/app/globals.css
   ```

2. **Reinstall v3.4.1**
   ```bash
   npm install tailwindcss@3.4.1 postcss autoprefixer
   ```

3. **Verify application functionality**
   ```bash
   npm run dev
   ```

## Potential Issues & Solutions

| Issue | Solution |
|-------|----------|
| Incompatible plugins | Check for v4-compatible versions or alternatives |
| CSS variable conflicts | Use namespaced variables (e.g., `--tw-color-*`) |
| Build errors | Check PostCSS configuration and plugin order |
| Component styling regressions | Test each component individually, focusing on borders, shadows, and colors |
| uploadthing integration | Test with and without the `withUt` wrapper |

## Timeline

| Phase | Duration | Dates |
|-------|----------|-------|
| Preparation | 1 day | TBD |
| Configuration Migration | 1-2 days | TBD |
| Component Testing | 2-3 days | TBD |
| Performance Validation | 1 day | TBD |
| Documentation & Finalization | 1 day | TBD |
| **Total** | **6-8 days** | |

## Resources

- [Tailwind CSS v4.0 Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS v4.0 Upgrade Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind CSS v4.0 Blog Post](https://tailwindcss.com/blog/tailwindcss-v4)
- [Next.js with Tailwind CSS](https://nextjs.org/docs/app/building-your-application/styling/tailwind-css)
