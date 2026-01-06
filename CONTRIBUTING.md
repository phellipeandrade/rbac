# Contributing to @rbac/rbac

Thanks for your interest in contributing! This document outlines how to get started.

## Getting Started

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```
4. Run tests to make sure everything works:
   ```bash
   npm test
   ```

## Development Workflow

### Building

```bash
npm run build    # Compile TypeScript and bundle with Vite
npm run dev      # Watch mode for development
```

### Testing

```bash
npm test              # Run tests with coverage
npm run test:watch    # Run tests in watch mode
```

### Benchmarks

```bash
npm run bench    # Run performance benchmarks
```

## Project Structure

```
├── src/           # TypeScript source files
├── lib/           # Compiled output (generated)
├── test/          # Test files
├── examples/      # Usage examples (Node, web, React)
├── benchmarks/    # Performance benchmarks
└── docs/          # Documentation
```

## Making Changes

1. Create a branch for your feature or fix:
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make your changes and ensure:
   - All tests pass (`npm test`)
   - Code follows existing style (check `.eslintrc`)
   - TypeScript compiles without errors (`npm run build`)

3. Add tests for new functionality

4. Update documentation if needed (README.md, docs/, examples/)

## Pull Request Guidelines

- Keep PRs focused on a single change
- Write clear commit messages
- Include tests for new features or bug fixes
- Update the CHANGELOG.md if applicable
- Make sure CI passes before requesting review

## Code Style

- Written in TypeScript
- Follow existing patterns in the codebase
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

## Reporting Issues

When reporting bugs, please include:
- Node.js version
- Steps to reproduce
- Expected vs actual behavior
- Minimal code example if possible

## Questions?

Open an issue or start a discussion on GitHub.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
