- RFC 2119 keywords for obligations.
- Commit = imperative subject; body only for a fact the diff cannot show.
- Comments only where code needs clarification — never narration; Short sentences.

## Tests

- Tests MUST exercise real code through public interfaces and observable behaviour.
- Tests MUST NOT mock the unit under test or reach into private methods.
- Each test MUST be able to fail for a real defect: not restating the implementation, not re-checking what the type system guarantees.
