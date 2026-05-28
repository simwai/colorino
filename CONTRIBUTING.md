# Contributing to Colorino

We welcome contributions from everyone! Here are some guidelines to help you get started.

## How to Contribute

1. Fork the repository.
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/colorino.git`
3. Create a new branch: `git checkout -b my-feature-branch`
4. Make your changes and add tests if applicable.
5. Ensure all tests pass: `npm run test:all`
6. Format your code: `npm run format`
7. Commit your changes using [Conventional Commits](https://www.conventionalcommits.org/): `feat: add new feature`
8. Push your branch: `git push origin my-feature-branch`
9. Open a Pull Request!

## Development

Colorino uses `unbuild` for building and `vitest` for testing.

- `npm run build`: Build the library
- `npm run test:all`: Run all tests (Node and Browser)
- `npm run docs:dev`: Run documentation in development mode

## Release Process

We use Semantic Release to automate our versioning and changelog. Please ensure your commit messages follow the Conventional Commits specification.
