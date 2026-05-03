# Vision Text Bridge MVP Design

## Overview

This project is a single-user MVP for turning image inputs and existing prompts into reusable prompt templates, then using those templates to generate new images through slot replacement.

The system has three primary capabilities:

1. Convert an uploaded image into a reusable prompt template
2. Convert an existing descriptive prompt into a reusable prompt template
3. Fill slots in a saved template and generate an image, then display and archive the result

This MVP is for personal use only. It does not include login, multi-user support, permissions, or account management.

## Product Goals

- Make prompt reuse practical instead of forcing repeated manual prompt rewriting
- Preserve reusable style structure while allowing subject replacement through slots
- Provide visible generation progress so the UI does not feel stalled
- Persist templates and generation history into Obsidian for long-term reuse

## Non-Goals

- User accounts or authentication
- Multi-tenant storage
- Batch generation workflows
- Advanced image editing UX
- Multiple provider implementations in MVP
- Template version graph or collaboration features

## UX Structure

The MVP uses a hybrid information architecture:

- A homepage with three primary entry points
- Independent workspaces for each capability
- Shared global pages for templates, generation history, and settings
- Shortcut transitions between workspaces where they help the flow

### Homepage Entries

- `图片生成模板`
- `描述词生成模板`
- `模板生成图片`

### Global Pages

- `模板库`
- `生成记录`
- `设置`

### Navigation Model

Each workspace is independently accessible from the homepage or global navigation. The system does not force a rigid wizard. Instead, it offers shortcuts such as:

- `保存并去生成`
- `使用这个模板`
- `继续生成`

This preserves flexibility while keeping the common path short.

## System Architecture

The recommended implementation is a web application plus a lightweight service layer.

### Frontend

A Chinese-first single-page web application provides:

- Homepage entry selection
- Workspace UIs
- Template browsing and selection
- Generation results display
- Progress and transition states

### Service Layer

The frontend calls local application services instead of embedding provider and persistence logic directly in pages.

Primary services:

- Template extraction service
- Image generation service
- Obsidian persistence service

### Provider Abstraction

The system defines a provider interface and implements OpenAI as the default provider for MVP.

Required provider operations:

- `analyzeImageToTemplate`
- `extractPromptToTemplate`
- `generateImageFromTemplate`

This keeps business logic stable if a second provider is added later.

### Persistence Layer

The MVP persists business data directly into an Obsidian Vault through filesystem operations:

- Templates are saved into a global template library
- Generation records are saved into topic-based folders
- Generated images are saved as local files and referenced from records

No database is required for the MVP.

## Core Data Model

The system uses a dual-track template model:

- Structured internal representation for logic and persistence
- Editable text template as the primary UI representation

### Template

Suggested fields:

- `id`
- `title`
- `sourceType` with values `image` or `prompt`
- `templateText`
- `slots`
- `styleTags`
- `negativePrompt`
- `notes`
- `createdAt`
- `updatedAt`
- `obsidianPath`

Each slot contains:

- `key`
- `label`
- `description`
- `exampleValue`
- `required`
- `defaultValue`

### Generation Record

Each generation stores an immutable snapshot:

- `id`
- `templateId`
- `templateSnapshot`
- `slotValues`
- `finalPrompt`
- `provider`
- `model`
- `status`
- `outputImages`
- `createdAt`
- `topic`
- `obsidianPath`

The template snapshot is mandatory so history remains stable even if the source template changes later.

## Obsidian Storage Design

The default Vault layout should be:

- `Templates/`
- `Generations/<topic>/`
- `Assets/generated/<topic>/`
- `Settings/vision-text-bridge.md`

### Template File Format

Each template is saved as Markdown with frontmatter.

Frontmatter stores structured fields such as:

- identifiers
- source type
- slots
- style tags
- negative prompt
- timestamps

Markdown body stores:

- template text
- usage notes
- example outputs
- source notes

### Generation Record Format

Each generation record is also saved as Markdown with frontmatter.

Frontmatter stores:

- template reference
- template snapshot
- slot values
- output image paths
- timestamps
- provider and model

Markdown body stores:

- final prompt
- generation notes
- image preview links
- contextual notes for that run

This structure remains human-readable in Obsidian and machine-readable in the application.

## Workspace Design

All visible UI copy should be Chinese-first. English should only appear where technical identifiers are necessary.

### Workspace A: 图片生成模板

Purpose:
Convert an uploaded image into a reusable prompt template.

Layout:

- Left: image upload and preview
- Center: analysis result, extracted template, slot highlighting, manual editing
- Right: style tags, negative prompt, save status, Obsidian path

Primary flow:

1. User uploads an image
2. Frontend validates file type and size
3. System shows preview and analysis-in-progress state
4. Provider analyzes the image and returns:
   - scene description
   - reusable template text
   - extracted slots
   - style tags
   - optional negative prompt
5. User edits the template if needed
6. User saves to template library or jumps to generation

Error handling:

- Invalid or oversized image is blocked immediately
- Vision analysis failure preserves the uploaded image and allows retry
- Weak extraction quality is recoverable through manual slot editing

### Workspace B: 描述词生成模板

Purpose:
Convert an existing prompt into a reusable prompt template.

Layout:

- Left: raw prompt input
- Center: parsed structure, editable template text, highlighted slots
- Right: style tags, negative prompt, save status, Obsidian path

Primary flow:

1. User pastes a descriptive prompt
2. Service extracts:
   - reusable structure
   - subject slot candidates
   - scene or camera variables
   - negative prompt
3. UI presents editable template text and structured fields
4. User adjusts the result if needed
5. User saves the template or jumps to generation

Error handling:

- Very short or weak prompts should trigger a low-confidence warning
- Malformed provider output should go through server-side normalization
- Save failures must preserve user edits for retry

### Workspace C: 模板生成图片

Purpose:
Select a saved template, fill slots, preview the final prompt, and generate an image.

Layout:

- Left: template list, recent templates, topic filters
- Center: slot form, final prompt preview, generate action, progress animation
- Right: current result, history strip, Obsidian archive state

Result presentation:

- Current generation is shown as the main image
- A history strip shows recent outputs for the current context

Primary flow:

1. User selects a template
2. User fills slot values
3. System renders the final prompt preview in real time
4. User starts generation
5. UI shows visible progress states
6. Result image is displayed
7. Generation record and output asset are saved into Obsidian

Error handling:

- Missing required slots block generation and highlight the missing fields
- Generation failures preserve slot values and final prompt for retry
- Obsidian write failures do not discard the image result shown in the UI

## Progress and Transition States

The UI must clearly show that work is ongoing during long-running operations.

Required behaviors:

- Action buttons enter loading state
- The center panel shows stage-based progress text
- Result area shows skeleton or pulse placeholders
- Longer operations show the current phase instead of blank waiting

Suggested stage labels for generation:

1. `正在分析模板`
2. `正在拼接提示词`
3. `正在请求生成`
4. `正在等待出图`
5. `正在归档到 Obsidian`

The same principle applies to template extraction workflows.

## State Preservation Rules

The system should avoid losing user work after failures.

Rules:

- Preserve uploaded image after image-analysis failure
- Preserve prompt text after extraction failure
- Preserve edited template draft during save failure
- Preserve slot values and final prompt during generation failure
- Preserve displayed image result even if archive write fails

## Technical Stack Recommendation

Recommended stack:

- `Next.js`
- `TypeScript`
- `Tailwind CSS`
- `shadcn/ui` for a minimal component subset
- `Zod` for schema validation
- OpenAI official SDK for the initial provider implementation

### Application Structure

Suggested module boundaries:

- `app/` for routes and API handlers
- `lib/services/` for business logic
- `lib/providers/` for provider abstraction and OpenAI implementation
- `lib/obsidian/` for Vault read and write logic
- `lib/schema/` for template and generation schemas

### State Strategy

- Keep global state minimal
- Prefer URL parameters and server-loaded data for navigation state
- Use local component state for transient UI operations only

## Testing Strategy

The MVP should cover three levels of testing.

### Unit Tests

Test:

- schema validation
- slot extraction transforms
- prompt-template formatting
- frontmatter serialization and parsing
- provider output normalization

### Integration Tests

Test the primary service chains with mocked providers:

- image to template
- prompt to template
- template plus slots to generation record

### Basic End-to-End Test

At least one happy path should be covered:

1. Create a template
2. Fill slots
3. Generate an image
4. Show the result in UI
5. Persist the record into Obsidian

## OpenAI and Vision Scope

For MVP:

- Provider abstraction is required
- Only OpenAI is implemented initially
- For local development and automated tests, a mock provider fallback is allowed when `OPENAI_API_KEY` is absent
- Vision analysis uses the OpenAI image-capable model path
- Image generation focuses on text-to-image
- Image-to-image is not implemented yet, but interface space should be reserved

## Future Expansion Hooks

The MVP should leave room for later additions without changing the core business model:

- additional providers
- image-to-image generation
- richer template metadata
- project-specific template collections
- template recommendations

These are not in scope for the initial implementation.

## Delivery Summary

The approved MVP is:

- single-user
- Chinese-first UI
- hybrid homepage plus workspaces architecture
- OpenAI-backed via provider abstraction
- Obsidian-backed for template and generation persistence
- text-to-image focused, with image-to-image reserved for later
- built around reusable prompt templates with editable slots
