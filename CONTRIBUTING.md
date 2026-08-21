# Contributing

Contributions that improve pricing accuracy, quota details, source coverage, accessibility, and the comparison experience are welcome.

## Correcting data

1. Open a source-correction issue or pull request.
2. Link to an official vendor page that directly supports every changed price or quota.
3. Update only the relevant YAML record and its `verifiedAt` date.
4. Keep regional variants and historical plans separate.
5. Do not infer undisclosed numbers or convert proprietary credit systems into one another.
6. Run `npm test` and `npm run lint` before submitting.

Promotions must include an end date when the vendor publishes one. “Unlimited” claims must include the vendor's fair-use qualification. Third-party benchmark results must not be copied into the repository unless their license clearly permits redistribution.

## Development

```bash
npm ci
npm run dev
```

Production verification:

```bash
npm test
npm run lint
npm run build
```

By submitting a contribution, you agree that code contributions are provided under Apache-2.0 and data/editorial contributions under CC BY 4.0, as applicable.
