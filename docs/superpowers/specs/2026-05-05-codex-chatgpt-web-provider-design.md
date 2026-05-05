# Vision Text Bridge Codex + ChatGPT Web Provider Design

## Overview

This design adapts the existing MVP so it can run without OpenAI API access for the user's personal workflow.

The system will split AI responsibilities across two local-only integrations:

1. `CodexCliProvider` for image analysis and prompt-to-template extraction
2. `ChatGptWebImageProvider` for browser-automated image generation through the user's existing ChatGPT Plus web session

This is intentionally a single-user, local-machine design. It is not intended for deployment to a shared server or production environment.

## Goals

- Preserve the current product flow as much as possible
- Replace OpenAI API template extraction with local Codex CLI execution
- Replace API-based image generation with browser automation against ChatGPT Web
- Keep the existing provider abstraction and service-layer boundaries stable
- Continue saving generated assets and history into the Obsidian Vault

## Non-Goals

- Server deployment support
- Multi-user support
- Reliable unattended operation across machines
- Official API compatibility with ChatGPT Plus web entitlements
- Advanced browser anti-detection or captcha bypass
- Concurrent multi-job generation orchestration

## Constraints

- The feature only needs to work for one user on one local machine
- Fragility is acceptable if the workflow remains recoverable
- The user accepts Playwright automation and browser profile reuse
- The system may depend on an already logged-in ChatGPT Plus browser session
- ChatGPT Web DOM changes are expected and considered a maintenance cost

## Current Architecture

The current backend defines a single `AiProvider` contract with three operations:

- `analyzeImageToTemplate`
- `extractPromptToTemplate`
- `generateImageFromTemplate`

The app router APIs and services already depend on this abstraction, which should be preserved.

The current OpenAI implementation uses:

- `responses.create(...)` for image analysis and prompt extraction
- `images.generate(...)` for image generation

The current mock implementation provides local fallbacks for development and tests.

## Proposed Architecture

The system should preserve the provider-oriented design but split responsibilities into two concrete providers backed by different local mechanisms.

### Provider Layout

- `CodexCliProvider`
  - implements `analyzeImageToTemplate`
  - implements `extractPromptToTemplate`
  - does not perform image generation

- `ChatGptWebImageProvider`
  - implements `generateImageFromTemplate`
  - does not perform template extraction

- `CompositeAiProvider`
  - composes both providers behind the existing `AiProvider` interface
  - delegates extraction methods to `CodexCliProvider`
  - delegates generation to `ChatGptWebImageProvider`

This keeps the rest of the application unchanged while allowing the backend to route each capability to the correct integration.

### Why a Composite Provider

The current business layer assumes one provider exposes all three operations. A composite provider avoids broad changes in route handlers and service code while still separating the implementation concerns cleanly.

## Component Design

### CodexCliProvider

Responsibilities:

- Transform input into a Codex-friendly prompt
- Execute `codex exec` non-interactively
- Pass image input for image-template extraction
- Parse the returned JSON
- Validate against `providerTemplateDraftSchema`

Implementation notes:

- Prompt instructions must explicitly require JSON-only output
- Image analysis should write the uploaded image to a temporary file and pass it with `codex exec --image`
- The provider should treat stdout as untrusted and always parse through Zod validation
- Temporary files must be cleaned up after execution

### ChatGptWebImageProvider

Responsibilities:

- Start or reuse a Playwright persistent browser context
- Reuse a configured browser profile directory
- Open the ChatGPT web interface
- Submit the final prompt
- Detect when generation has completed
- Retrieve at least the first generated image
- Convert the image into the app's `GeneratedImage` shape

Implementation notes:

- The provider should prefer a persistent context so the user's existing login can be reused
- The automation logic should be encapsulated in helper functions instead of mixing selector code into business logic
- The provider should treat selector resolution and generation waiting as explicit failure points with readable errors

### Provider Selection

`getAiProvider()` should support a new mode oriented around the user's local workflow.

Recommended mode names:

- `mock`
- `openai`
- `codex-chatgpt-web`

When `codex-chatgpt-web` is selected:

- template extraction uses `CodexCliProvider`
- image generation uses `ChatGptWebImageProvider`

## Request Flows

### Flow A: Image to Template

1. `POST /api/templates/from-image` receives base64 image data
2. API validates payload
3. `CompositeAiProvider.analyzeImageToTemplate()` delegates to `CodexCliProvider`
4. Provider writes a temporary image file
5. Provider invokes `codex exec --image <tmpfile>`
6. Codex returns JSON text
7. Backend validates JSON against schema
8. Existing normalization logic returns the template draft

### Flow B: Prompt to Template

1. `POST /api/templates/from-prompt` receives raw prompt text
2. API validates payload
3. `CompositeAiProvider.extractPromptToTemplate()` delegates to `CodexCliProvider`
4. Provider invokes `codex exec` with a JSON-only extraction instruction
5. Backend validates JSON against schema
6. Existing normalization logic returns the template draft

### Flow C: Template to Generated Image

1. `POST /api/generations` resolves template and slot values
2. Existing service renders `finalPrompt`
3. `CompositeAiProvider.generateImageFromTemplate()` delegates to `ChatGptWebImageProvider`
4. Provider launches Playwright with the configured persistent profile
5. Provider opens the configured ChatGPT page
6. Provider fills the prompt and submits generation
7. Provider waits for a generated image to appear or timeout
8. Provider downloads or reads the first generated image
9. Provider returns `{ images: [...] }`
10. Existing generation persistence writes image assets and Markdown records into the Vault

## Configuration

The design should introduce local-only configuration for the new workflow.

Required:

- `AI_PROVIDER_MODE=codex-chatgpt-web`
- `CHATGPT_WEB_PROFILE_DIR`

Recommended:

- `CHATGPT_WEB_START_URL`
- `CHATGPT_WEB_TIMEOUT_MS`
- `PLAYWRIGHT_BROWSER_CHANNEL`
- `CODEX_TEMPLATE_MODEL`

Configuration behavior:

- If `CHATGPT_WEB_PROFILE_DIR` is missing when the mode requires web generation, image generation should fail fast with a configuration error
- If the profile path is invalid or not accessible, startup should not crash globally, but the generation request should fail with a clear actionable message

## Browser Automation Strategy

The first implementation should optimize for clarity over resilience.

Recommended behavior:

- Use Playwright persistent context with one configured profile directory
- Open a dedicated page for generation instead of reusing arbitrary existing tabs
- Keep selectors centralized in one module so page updates are easier to fix
- Prefer stable semantic cues when available, but accept fallbacks to DOM structure when necessary

The implementation should only support:

- one generation job at a time
- one browser profile
- first-image capture
- text-prompt generation only

The implementation should not initially support:

- parallel generation sessions
- profile switching
- reference-image upload into ChatGPT Web
- automatic recovery from account challenges
- remote execution

## Error Handling

### CodexCliProvider Errors

Failures to handle explicitly:

- `codex` executable missing
- process timeout
- non-zero exit status
- non-JSON output
- schema validation failure
- temporary file write failure

Expected behavior:

- return a readable error to the API layer
- preserve the original user input for retry
- do not silently fall back to mock mode

### ChatGptWebImageProvider Errors

Failures to handle explicitly:

- missing profile path
- inaccessible profile path
- browser launch failure
- login session missing or expired
- selector resolution failure
- generation timeout
- image retrieval failure

Expected behavior:

- distinguish configuration errors from automation errors
- tell the user when manual browser re-login is required
- expose timeout and selector failures clearly so maintenance is straightforward

## Persistence Impact

The existing Obsidian persistence model should remain unchanged.

The generated image provider must still return:

- `fileName`
- `base64`
- `mimeType`

This preserves compatibility with:

- generation record saving
- asset writing under `Assets/generated/<topic>/`
- existing Markdown generation history structure

## UI Impact

The frontend should remain mostly unchanged, but a few additions are useful:

- settings page should show the active provider mode as `codex-chatgpt-web` when enabled
- generation page should show a clearer progress message during browser-automated image generation
- API error messages should be surfaced in a way that distinguishes:
  - Codex extraction failures
  - ChatGPT login/session failures
  - timeout or selector failures

No major navigation or workflow redesign is required.

## Testing Strategy

The design should emphasize targeted verification rather than brittle full automation tests.

### Unit / Integration Scope

- command construction for `CodexCliProvider`
- JSON parsing and schema validation
- provider selection and composite routing
- image-generation result normalization

### Manual Verification Scope

- launch with a valid browser profile
- submit a prompt through ChatGPT Web
- detect generated output
- retrieve one image
- persist the image and generation record into the Vault

The first implementation should not depend on stable E2E tests against ChatGPT Web because the external UI is outside the repo's control.

## Risks

Primary risks:

- ChatGPT Web DOM changes
- browser login expiration
- rate limits or account challenges
- image retrieval shape changes
- profile compatibility issues across local environments

These risks are acceptable for this design because the workflow is explicitly:

- local-only
- single-user
- manually recoverable
- not intended for unattended production use

## Implementation Sequence

1. Add a composite provider path in `lib/providers`
2. Implement `CodexCliProvider`
3. Switch extraction routes to the composite mode
4. Implement `ChatGptWebImageProvider` skeleton with Playwright
5. Complete the image capture flow for first-image retrieval
6. Add configuration handling and settings visibility
7. Update documentation for local setup and failure recovery

## Success Criteria

The implementation is successful when the user can do all of the following on their local machine:

1. Upload an image and receive a structured reusable template
2. Paste a prompt and receive a structured reusable template
3. Save a template and start generation from the existing UI
4. Have the backend automatically drive a logged-in ChatGPT Web session to generate an image
5. See the returned image in the app and have the result persisted into the Obsidian Vault

## Decision

Proceed with a local-only composite provider design using:

- Codex CLI for template extraction
- Playwright + ChatGPT Web for image generation

This is the narrowest implementation that satisfies the user's requirement to avoid OpenAI API image billing while preserving an almost unchanged product workflow.
