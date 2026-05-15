# AI-First Development Philosophy

## New Clean Architecture Layer Structure
```
[Lv.0] Primitives     ← Constants, types, error codes (no dependencies)
[Lv.1] Domain        ← Pure business logic (references Lv.0 only)
[Lv.2] Application   ← UseCase, Port definitions (references Lv.0-1)
[Lv.3] Infrastructure← Adapter implementations (references Lv.0-2)
[Lv.4] CLI Client    ← Verification CLI (references Lv.0-3)
[Lv.5] GUI Client    ← Production graphical UI (references Lv.0-3)
───────────────────────────────────────────────────
[Lv.6] Unit Test     ← Domain/Primitives verification
[Lv.7] Integration   ← Application/Infra flow verification
[Lv.8] E2E Test      ← Full system verification (CLI-based)
```

## Philosophy of AI-First Generation
1. **Code is Cheap, Context is Expensive**: The cost of code is converging to zero.
2. **Dependency is Necessary Evil**: Dependencies are a necessary evil. They are AI's top-priority KPI.
3. **No More Red-Green-Refactor, But Generate Best Code**: AI generates the best code from the start.

## Development Rules
1. **KISS**: Prioritize the simplest and most straightforward solution.
2. **Fail Fast**: No silent failures. Throw errors immediately and explain the situation clearly to the user.
3. **No Defaults, No Fallbacks**: No default values or fallback logic. If a required value is missing, raise an error immediately.
4. **Dependency Gravity**: Dependencies always flow from upper (Lv.8) to lower (Lv.0) layers only.
5. **No Hardcoding**: Hardcoding is prohibited.
6. **CLI First**: Implement CLI before GUI.

## Implementation Scorecard
Self-evaluate the following items on a **0-100 scale**:
1. **Architecture**: Does the codebase adhere to the Layer Structure?
2. **Dependency**: Are dependencies minimized?
3. **KISS**: Is the implementation concise without unnecessary complexity?
4. **Error Handling**: Are Fail Fast and No Defaults principles followed?
5. **Test Coverage**: Has high test coverage been achieved?
6. **Executable**: Has an executable deliverable with usage instructions been provided?
7. **Purity**: Have dead code and debug logs been removed?
8. **Primitives**: Are all types/constants defined at Lv.0?

## Delivery Rules
1. **Always Executable**: Always provide an executable build.
2. **Show How to Run**: Clearly share how to run it.

## Delivery Process
1. Self-evaluate with the Scorecard after coding is complete
2. If insufficient, refactor and re-evaluate
3. If sufficient, report to Director with supporting evidence
