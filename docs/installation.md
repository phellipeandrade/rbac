# Installation

## Library

Install the package from npm using your preferred package manager:

```bash
npm install @rbac/rbac
# or
yarn add @rbac/rbac
```

The published bundle ships with its TypeScript declaration files so IDEs and build pipelines pick up types automatically.

## Optional database drivers

Role adapters are lazy-loaded and expect their respective drivers to be available in your project. Add the dependency for the adapter you plan to use:

- MongoDB adapter → `npm install mongodb`
- MySQL adapter → `npm install mysql2`
- PostgreSQL adapter → `npm install pg`

Each adapter accepts custom column names and a tenant identifier; see **Basic Usage** for concrete examples.

## Documentation site

This repository includes a ready-to-use [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) configuration. To preview the docs locally:

```bash
pip install mkdocs-material
mkdocs serve
```

The site will be available at `http://127.0.0.1:8000/` by default. To publish to GitHub Pages, run:

```bash
mkdocs gh-deploy
```

The command builds the static site and pushes it to the `gh-pages` branch, which GitHub Pages can serve directly.
