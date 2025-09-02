# Task Completion Checklist

When completing a coding task, ensure:

1. **Code Quality**
   - Run `pnpm lint` to check for linting errors
   - Fix any ESLint issues

2. **Dependencies**
   - Ensure all dependencies are properly installed with `pnpm install`
   - Verify pnpm-lock.yaml is updated if new packages are added

3. **TypeScript**
   - No TypeScript errors
   - Proper type definitions for new code

4. **Testing**
   - Manual testing in development server (`pnpm dev`)
   - Verify build succeeds (`pnpm build`)
