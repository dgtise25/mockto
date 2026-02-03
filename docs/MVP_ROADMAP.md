# MVP Roadmap - HTML to React Converter

## Executive Summary

This roadmap defines the Minimum Viable Product (MVP) for the HTML to React Converter application. The MVP focuses on core functionality that delivers immediate value while establishing a foundation for future enhancements.

**MVP Timeline**: 3-4 weeks
**Target**: Working converter with essential features

---

## MVP Philosophy

**Core Principle**: Ship a working product quickly, then iterate based on feedback.

**MVP Mantra**:
- Simple, not simplistic
- Functional, not feature-complete
- Tested, not perfect
- Documented, not exhaustive

---

## MVP Features (Must Have)

### 1. HTML Input - File Upload Only
**What**: Drag-and-drop file upload for HTML files

**Why MVP**: Simpler than textarea, covers primary use case

**Implementation**:
- File input with drag-drop
- File validation (HTML only)
- Basic error handling
- File size limit (1MB)

**Out of Scope**:
- Textarea input (Phase 2)
- Multiple file upload
- URL input

**Success Criteria**:
- User can upload .html file
- Validates file type and size
- Shows error for invalid files
- Displays file name

---

### 2. HTML Parser
**What**: Parse HTML into traversable structure

**Why MVP**: Core functionality, required for all conversions

**Implementation**:
- Use browser DOMParser API
- Build simple AST
- Extract basic attributes
- Handle common HTML5 elements

**Out of Scope**:
- Complex validation
- Malformed HTML recovery
- Performance optimization
- Detailed metadata

**Success Criteria**:
- Parse valid HTML correctly
- Extract tag names and attributes
- Build tree structure
- Handle nested elements

---

### 3. Basic Component Splitting
**What**: Split HTML by semantic sections only

**Why MVP**: Provides value without complex logic

**Implementation**:
- Detect semantic HTML5 tags: `<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`
- Create one component per semantic section
- Everything else becomes root component

**Out of Scope**:
- Pattern detection (repeating elements)
- Complex subtree splitting
- Configurable rules
- Smart naming beyond tag names

**Success Criteria**:
- Split semantic sections correctly
- Generate valid component names
- Maintain HTML structure
- No duplicate component names

---

### 4. JSX Generation (JSX Only)
**What**: Generate JSX code from parsed HTML

**Why MVP**: Focus on one format, simplest implementation

**Implementation**:
- Convert HTML elements to JSX
- Transform `class` to `className`
- Transform `for` to `htmlFor`
- Keep inline styles as-is
- Basic code formatting

**Out of Scope**:
- TSX generation (Phase 2)
- TypeScript interfaces
- Advanced formatting
- Prettier integration
- Props extraction

**Success Criteria**:
- Generate valid, compilable JSX
- Correct attribute transformation
- Proper component structure
- Readable code formatting

---

### 5. CSS Extraction (Vanilla CSS Only)
**What**: Extract CSS to separate files

**Why MVP**: Simplest CSS handling, no conversion logic

**Implementation**:
- Extract inline styles
- Extract `<style>` tags
- Keep CSS as-is (no transformation)
- Generate separate CSS files per component

**Out of Scope**:
- Tailwind conversion (Phase 2)
- CSS Modules (Phase 2)
- CSS optimization
- SCSS/SASS support

**Success Criteria**:
- Extract all styles
- Generate valid CSS files
- Maintain style specificity
- Link CSS to components correctly

---

### 6. ZIP Download
**What**: Download converted files as ZIP

**Why MVP**: Universal browser support, no permissions needed

**Implementation**:
- Use JSZip library
- Create folder structure
- Bundle all files
- Trigger browser download

**Out of Scope**:
- Folder save (File System API) - Phase 2
- Custom output location
- Incremental download

**Success Criteria**:
- Generate valid ZIP file
- Correct folder structure
- All files included
- Works in all browsers

---

### 7. Basic UI
**What**: Simple, functional interface

**Why MVP**: Get feedback on UX, iterate later

**Implementation**:
- File upload area
- Convert button
- Loading state
- Download button
- Basic error messages

**Out of Scope**:
- Code preview (Phase 2)
- Settings panel (Phase 2)
- Dark mode
- Responsive design (desktop only)
- Accessibility beyond basics

**Success Criteria**:
- All core actions work
- Clear user feedback
- No confusing states
- Handles errors gracefully

---

### 8. Error Handling
**What**: Handle common error scenarios

**Why MVP**: Prevent crashes, guide users

**Implementation**:
- Invalid HTML detection
- File upload errors
- Conversion errors
- Download errors
- User-friendly error messages

**Out of Scope**:
- Detailed error recovery
- Error logging/tracking
- Advanced validation

**Success Criteria**:
- No unhandled exceptions
- Clear error messages
- Recoverable errors
- No data loss

---

## MVP Technical Scope

### Technologies (Minimal Set)
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "jszip": "^3.10.1",
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.2.0",
    "vitest": "^1.4.0",
    "@testing-library/react": "^14.2.1"
  }
}
```

**Note**: shadcn/ui and Tailwind optional for MVP, can use plain CSS

### Core Modules Only
1. HTML Parser (simple version)
2. Component Splitter (semantic only)
3. JSX Generator (basic version)
4. CSS Extractor (vanilla only)
5. ZIP Creator
6. File Upload Component
7. Basic App UI

---

## MVP User Flow

```
1. User opens application
   ↓
2. User drags HTML file to upload area
   OR clicks to browse and select file
   ↓
3. File uploaded, shows file name and size
   ↓
4. User clicks "Convert to React" button
   ↓
5. Application shows loading state
   ↓
6. Conversion completes (or shows error)
   ↓
7. "Download ZIP" button appears
   ↓
8. User clicks download button
   ↓
9. Browser downloads "converted-project.zip"
   ↓
10. User extracts ZIP and uses components
```

**Total Flow Time**: <1 minute

---

## MVP File Output Structure

```
converted-project.zip
├── components/
│   ├── Header.jsx        (if <header> found)
│   ├── Navigation.jsx    (if <nav> found)
│   ├── Main.jsx          (if <main> found)
│   ├── Footer.jsx        (if <footer> found)
│   └── App.jsx           (root component)
├── styles/
│   ├── Header.css
│   ├── Navigation.css
│   ├── Main.css
│   ├── Footer.css
│   └── App.css
└── README.txt            (usage instructions)
```

**Simplifications**:
- No TypeScript types
- No index.ts barrel exports
- No assets folder
- No package.json
- Basic README only

---

## MVP Development Phases

### Phase 1: Setup (Week 1, Days 1-2)
**Goal**: Working development environment

**Tasks**:
- [x] Initialize Vite project
- [x] Install minimal dependencies
- [x] Configure TypeScript
- [x] Set up Vitest
- [x] Create basic folder structure
- [x] Basic UI layout

**Deliverable**: Running dev server with placeholder UI

---

### Phase 2: Parser (Week 1, Days 3-5)
**Goal**: HTML parsing works

**Tasks**:
- [ ] Define AST types
- [ ] Implement htmlParser.ts (basic version)
- [ ] Test with simple HTML samples
- [ ] Test with semantic HTML
- [ ] Handle parsing errors

**Deliverable**: Parser that converts HTML to AST

---

### Phase 3: Splitter (Week 2, Days 1-2)
**Goal**: Semantic section detection works

**Tasks**:
- [ ] Implement semantic tag detection
- [ ] Create component naming logic
- [ ] Build component tree structure
- [ ] Test with various HTML structures

**Deliverable**: Splitter that creates components from semantic sections

---

### Phase 4: JSX Generator (Week 2, Days 3-5)
**Goal**: Generate valid JSX code

**Tasks**:
- [ ] Implement HTML to JSX transformation
- [ ] Handle attribute conversion
- [ ] Add basic code formatting
- [ ] Generate imports/exports
- [ ] Test output compiles

**Deliverable**: Generator that produces valid JSX files

---

### Phase 5: CSS Extraction (Week 3, Days 1-2)
**Goal**: Extract CSS to files

**Tasks**:
- [ ] Extract inline styles
- [ ] Extract style tags
- [ ] Generate CSS files
- [ ] Link CSS to components

**Deliverable**: CSS extractor that generates style files

---

### Phase 6: Output & Download (Week 3, Days 3-4)
**Goal**: User can download ZIP

**Tasks**:
- [ ] Implement file generation
- [ ] Create ZIP with JSZip
- [ ] Add folder structure
- [ ] Trigger browser download
- [ ] Generate README

**Deliverable**: Working ZIP download

---

### Phase 7: UI Polish (Week 3, Day 5 - Week 4, Day 2)
**Goal**: Smooth user experience

**Tasks**:
- [ ] Improve upload UI
- [ ] Add loading states
- [ ] Better error messages
- [ ] Visual feedback
- [ ] Styling improvements

**Deliverable**: Polished, user-friendly interface

---

### Phase 8: Testing & Bug Fixes (Week 4, Days 3-5)
**Goal**: Stable, tested application

**Tasks**:
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Manual testing
- [ ] Fix identified bugs
- [ ] Cross-browser testing

**Deliverable**: Tested MVP ready for deployment

---

## MVP Success Criteria

### Functional Requirements
- [x] User can upload HTML file
- [x] Application parses HTML correctly
- [x] Semantic sections become components
- [x] Valid JSX code generated
- [x] CSS extracted to files
- [x] ZIP download works
- [x] Errors handled gracefully

### Quality Requirements
- [x] Test coverage >70% (relaxed for MVP)
- [x] Works in Chrome, Firefox, Safari
- [x] No critical bugs
- [x] TypeScript strict mode
- [x] Passes linting

### User Experience
- [x] Complete flow in <1 minute
- [x] Clear instructions
- [x] Helpful error messages
- [x] Generated code is usable

---

## Out of Scope for MVP

**Explicitly NOT included**:

1. **Textarea Input** - Only file upload
2. **TSX Generation** - Only JSX
3. **Tailwind Conversion** - Only vanilla CSS
4. **CSS Modules** - Only vanilla CSS
5. **Asset Extraction** - No image handling
6. **Code Preview** - Direct download only
7. **Settings Panel** - No user preferences
8. **localStorage** - No persistence
9. **Folder Save** - ZIP only
10. **Pattern Detection** - Semantic sections only
11. **Dark Mode** - Light mode only
12. **Mobile Support** - Desktop only
13. **Accessibility** - Basic only
14. **Advanced Error Recovery** - Basic handling only
15. **Performance Optimization** - Basic only

**These become Phase 2 features**

---

## Post-MVP Feedback Questions

After MVP launch, gather feedback on:

1. **Most Wanted Features**
   - TSX support?
   - Tailwind conversion?
   - Code preview?
   - Settings persistence?

2. **Pain Points**
   - What's confusing?
   - What doesn't work as expected?
   - What's missing?

3. **Use Cases**
   - How are people using it?
   - What HTML are they converting?
   - What frameworks do they target?

4. **Quality Issues**
   - What bugs are encountered?
   - What HTML fails to convert?
   - What CSS is lost?

---

## MVP to Phase 2 Transition

### Phase 2 Priority Features (Based on Feedback)

**High Priority**:
1. TSX output format
2. Code preview
3. Tailwind CSS conversion
4. Textarea input

**Medium Priority**:
5. Settings persistence
6. Asset extraction
7. CSS Modules support
8. Pattern detection for components

**Low Priority**:
9. Folder save (File System API)
10. Dark mode
11. Mobile support
12. Advanced splitting rules

---

## MVP Launch Checklist

### Pre-Launch
- [ ] All MVP features working
- [ ] Tests passing (>70% coverage)
- [ ] No critical bugs
- [ ] Cross-browser tested
- [ ] Performance acceptable
- [ ] Documentation complete
- [ ] README with clear instructions
- [ ] Example HTML files provided

### Launch
- [ ] Deploy to hosting (Vercel/Netlify)
- [ ] Set up error tracking (optional)
- [ ] Set up analytics (optional)
- [ ] Create demo video
- [ ] Announce on social media
- [ ] Post on relevant forums

### Post-Launch
- [ ] Monitor for errors
- [ ] Collect user feedback
- [ ] Track usage metrics
- [ ] Plan Phase 2 features
- [ ] Fix urgent bugs
- [ ] Update documentation

---

## Success Metrics for MVP

### Usage Metrics
- **Target**: 100 conversions in first month
- **Measure**: Downloads triggered

### Quality Metrics
- **Error Rate**: <10% of conversions fail
- **Conversion Time**: <5 seconds average

### User Satisfaction
- **Target**: >70% of users complete conversion
- **Measure**: Upload → Download completion rate

---

## MVP Timeline Summary

| Week | Focus | Deliverable |
|------|-------|-------------|
| 1 | Setup + Parser | Working parser with tests |
| 2 | Splitter + JSX Generator | Generate valid JSX |
| 3 | CSS + Output + UI | Download working ZIP |
| 4 | Testing + Polish | Deployed MVP |

**Total**: 4 weeks
**Effort**: 100-120 hours
**Team Size**: 1-2 developers

---

## Risk Mitigation for MVP

### Technical Risks
**Risk**: Parser doesn't handle all HTML
**Mitigation**: Start with common HTML patterns, expand later

**Risk**: JSX output not valid
**Mitigation**: Comprehensive testing with real HTML samples

**Risk**: CSS extraction misses styles
**Mitigation**: Extract all inline + style tags, warn about external sheets

### Timeline Risks
**Risk**: Development takes longer
**Mitigation**: Cut features if needed, focus on core flow

**Risk**: Too many bugs to fix
**Mitigation**: Limit HTML complexity, document limitations

---

## MVP Documentation Requirements

**Minimum Documentation**:
1. README.md - Project overview and quick start
2. USAGE.md - How to use the application
3. LIMITATIONS.md - What doesn't work yet
4. CONTRIBUTING.md - How to contribute

**Generated Output Documentation**:
- README.txt in ZIP explaining how to use components
- Comments in generated code (minimal)

---

## Decision Log

### Why File Upload Only for MVP?
**Decision**: Support file upload only, not textarea
**Reason**: Simpler implementation, most users have HTML files
**Trade-off**: Less flexible, but faster to ship

### Why JSX Only (No TSX) for MVP?
**Decision**: Generate JSX only, not TypeScript
**Reason**: Simpler generator, no type inference needed
**Trade-off**: Less valuable for TS projects, but easier to implement

### Why Vanilla CSS Only for MVP?
**Decision**: Extract CSS as-is, no Tailwind conversion
**Reason**: No conversion logic needed, always accurate
**Trade-off**: Less modern, but guaranteed to work

### Why Semantic Splitting Only?
**Decision**: Only split by semantic HTML5 tags
**Reason**: Simple, deterministic logic
**Trade-off**: Misses patterns, but predictable behavior

### Why ZIP Only (No Folder Save)?
**Decision**: Download ZIP only, no File System API
**Reason**: Universal browser support
**Trade-off**: Extra step to extract, but works everywhere

---

## Conclusion

This MVP focuses on delivering core value quickly:
- **Fast**: 3-4 weeks to launch
- **Functional**: Complete conversion workflow
- **Flexible**: Easy to extend in Phase 2
- **Focused**: No feature bloat

**Goal**: Ship working product, gather feedback, iterate rapidly.

After MVP success, expand to full feature set based on user needs.

---

**Document Version**: 1.0
**Last Updated**: 2026-02-03
**Status**: Ready for Development
