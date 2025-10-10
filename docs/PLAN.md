# Git Visualizer Development Plan

## Project Vision

Build a **privacy-first, local-first** Git commit graph visualizer that prioritizes:
- **Correctness** of the commit DAG representation
- **Beginner-friendly UX** for Git learning and repository exploration
- **WCAG 2.2 AA accessibility** for inclusive design
- **Zero data exfiltration** by default, with opt-in overlays

## Development Phases

### Phase 1: Core Foundation ✅ (Current)
**Duration**: Weeks 1-2  
**Status**: Initial scaffolding complete

**Completed:**
- [x] Next.js 15 project scaffolding with App Router
- [x] TypeScript configuration with strict mode
- [x] Basic ELK.js layout integration
- [x] Initial SVG graph component
- [x] Development tooling (ESLint, Prettier, Vitest, Playwright)

**Remaining:**
- [ ] Basic UI layout and navigation structure
- [ ] Component library setup (Radix UI + Tailwind)
- [ ] Initial accessibility audit and fixes

### Phase 2: Local Repository Ingestion 🔄 (Next)
**Duration**: Weeks 3-4  
**Priority**: High

**Core Features:**
- [ ] File System Access API integration
  - [ ] Directory picker with clear permission prompts
  - [ ] "Connect to local repository" user flow
  - [ ] Permission management and disconnect functionality
- [ ] Git parsing with isomorphic-git
  - [ ] Commit history extraction
  - [ ] Branch and tag reference resolution
  - [ ] Author and timestamp processing
- [ ] DAG model construction
  - [ ] Parent-child relationship mapping
  - [ ] Merge commit handling
  - [ ] Branch topology detection
- [ ] Error handling and fallbacks
  - [ ] Invalid repository detection
  - [ ] Browser compatibility fallbacks
  - [ ] User-friendly error messages

**Acceptance Criteria:**
- User can select a local .git folder and see a basic commit graph
- Clear permission prompts with "disconnect & purge" option
- Graceful fallbacks for unsupported browsers
- No repository data persisted outside OPFS

### Phase 3: Enhanced Visualization 📅 (Weeks 5-7)
**Duration**: Weeks 5-7  
**Priority**: High

**Layout Improvements:**
- [ ] ELK.js configuration optimization
  - [ ] Lane assignment for parallel development
  - [ ] Merge commit visual representation
  - [ ] Branch color coding (color-independent)
  - [ ] Configurable layout algorithms
- [ ] Performance optimization
  - [ ] Web Worker-based layout computation
  - [ ] Position caching by commit SHA + layout params
  - [ ] Incremental updates for repository changes
- [ ] Interactive features
  - [ ] Zoom and pan with react-zoom-pan-pinch
  - [ ] Commit detail hover/focus states
  - [ ] Branch filtering and highlighting

**Accessibility Features:**
- [ ] Full keyboard navigation implementation
  - [ ] Tab order through graph nodes
  - [ ] Arrow key navigation within graph
  - [ ] Focus management for modal dialogs
- [ ] Screen reader enhancements
  - [ ] Semantic SVG structure with ARIA labels
  - [ ] Graph summary for screen readers
  - [ ] Status announcements for interactions
- [ ] Visual accessibility
  - [ ] Color-independent status encoding
  - [ ] High contrast mode support
  - [ ] Configurable text sizes
  - [ ] Reduced motion preferences

**Acceptance Criteria:**
- First layout ≤ 1500ms on medium graphs (~1000 commits)
- Pan/zoom ≤ 16ms/frame for 60 FPS
- Full keyboard accessibility with visible focus
- WCAG 2.2 AA compliance verified by automated testing

### Phase 4: Repository Clone Support 📅 (Weeks 8-9)
**Duration**: Weeks 8-9  
**Priority**: Medium

**Remote Repository Features:**
- [ ] isomorphic-git + LightningFS integration
  - [ ] Shallow clone implementation (depth + singleBranch)
  - [ ] CORS proxy configuration documentation
  - [ ] Progress indicators for clone operations
- [ ] OPFS storage management
  - [ ] Repository caching strategy
  - [ ] Storage quota monitoring
  - [ ] Cache eviction policies
- [ ] Privacy controls
  - [ ] "No-network mode" toggle
  - [ ] Clear data boundaries documentation
  - [ ] Repository URL validation

**User Experience:**
- [ ] Repository URL input with validation
- [ ] Clone progress and cancellation
- [ ] Storage management interface
- [ ] Network status indicators

**Acceptance Criteria:**
- Users can clone public repositories into browser storage
- Shallow clones use minimal bandwidth and storage
- Clear documentation about CORS proxy requirements
- No network requests in "no-network mode"

### Phase 5: Performance & Scalability 📅 (Weeks 10-11)
**Duration**: Weeks 10-11  
**Priority**: Medium

**Large Repository Support:**
- [ ] Rendering performance improvements
  - [ ] Element virtualization for large graphs
  - [ ] Canvas/WebGL fallback path for >10k elements
  - [ ] Progressive edge rendering
- [ ] Memory optimization
  - [ ] Efficient DAG data structures
  - [ ] Layout result pooling
  - [ ] Garbage collection optimization
- [ ] User experience for large repos
  - [ ] Loading states and progress indicators
  - [ ] Repository complexity warnings
  - [ ] Performance recommendations

**Performance Targets:**
- Support repositories with 10k+ commits
- Maintain 60 FPS interactions regardless of size
- Memory usage scales linearly with visible elements

### Phase 6: Overlay System Foundation 📅 (Weeks 12-14)
**Duration**: Weeks 12-14  
**Priority**: Low (Future Enhancement)

**OAuth Implementation:**
- [ ] PKCE flow for GitHub and GitLab
- [ ] Minimal read-only scopes
- [ ] In-memory token storage
- [ ] Per-repository consent management

**GitHub Integration:**
- [ ] GraphQL API integration
  - [ ] Commit → PR mapping
  - [ ] Rate limiting with exponential backoff
  - [ ] Pagination handling
- [ ] Checks/Statuses API for CI information
- [ ] Response caching with TTL

**Privacy & Controls:**
- [ ] Global overlay disable toggle
- [ ] Per-repository overlay opt-in
- [ ] Rate limit quota display
- [ ] Graceful degradation when overlays fail

**Acceptance Criteria:**
- OAuth flows work without storing tokens persistently
- Rate limiting prevents API abuse
- Overlays enhance but never block core functionality
- Clear user consent for each repository's overlay data

### Phase 7: Testing & Polish 📅 (Weeks 15-16)
**Duration**: Weeks 15-16  
**Priority**: High

**Comprehensive Testing:**
- [ ] Unit test coverage >80%
- [ ] Integration tests for Git operations
- [ ] E2E tests for complete user workflows
- [ ] Accessibility testing with real screen readers
- [ ] Performance regression testing

**Documentation & UX:**
- [ ] User documentation and tutorials
- [ ] Developer API documentation
- [ ] Accessibility conformance statement
- [ ] Performance characteristics documentation

**Quality Assurance:**
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness verification
- [ ] Security audit for data handling
- [ ] Privacy policy and data handling disclosure

## Technical Milestones

### Milestone 1: MVP (End of Phase 3)
**Definition of Done:**
- Users can visualize local Git repositories
- Full keyboard accessibility
- Basic zoom/pan interactions
- WCAG 2.2 AA compliant

### Milestone 2: Performance Target (End of Phase 5)
**Definition of Done:**
- Supports repositories with 10k+ commits
- Maintains performance targets on target hardware
- Graceful degradation for older browsers

### Milestone 3: Feature Complete (End of Phase 6)
**Definition of Done:**
- Optional overlay system working
- Privacy controls fully implemented
- All core features tested and documented

## Resource Requirements

### Development Team
- **Frontend Developer**: React/TypeScript expertise, accessibility knowledge
- **Git Specialist**: Deep understanding of Git internals and isomorphic-git
- **UX Designer**: Accessibility-first design, data visualization experience
- **QA Engineer**: Cross-browser testing, accessibility testing tools

### Infrastructure
- **Development Environment**: Node.js 18+, pnpm, modern browsers
- **CI/CD**: GitHub Actions for testing and deployment
- **Testing Tools**: Vitest, Playwright, axe-core for accessibility
- **Documentation**: GitHub Wiki or docs folder in repository

## Risk Mitigation

### Technical Risks
- **Browser API Compatibility**: Feature detection and polyfills
- **Performance on Large Repos**: Early prototyping and benchmarking
- **Accessibility Complexity**: Regular testing with screen readers

### Product Risks
- **User Adoption**: Clear onboarding and documentation
- **Privacy Concerns**: Transparent data handling policies
- **Feature Creep**: Strict adherence to privacy-first principles

## Success Metrics

### User Experience
- **Time to First Graph**: <30 seconds from repository selection
- **Accessibility Score**: WCAG 2.2 AA compliance (automated + manual)
- **Performance**: Meets defined FPS and latency targets

### Privacy & Security
- **Zero Data Exfiltration**: No repository contents leave device by default
- **Transparent Overlays**: Clear consent flows for external API usage
- **Security Audit**: No critical or high-severity vulnerabilities

### Developer Experience
- **Code Quality**: >80% test coverage, TypeScript strict mode
- **Documentation**: Complete API docs and user guides
- **Maintainability**: Clear architecture and well-documented decisions

## Future Considerations (Post-MVP)

### Additional Features
- **Export Capabilities**: SVG, PNG, PDF export
- **Advanced Filtering**: Complex queries for large repositories
- **Custom Layouts**: Plugin system for alternative layout algorithms
- **Collaborative Sharing**: Share graph views (metadata only)

### Platform Extensions
- **VS Code Extension**: Integrated repository visualization
- **Desktop Application**: Electron wrapper for enhanced file access
- **Mobile Optimization**: Touch-friendly interactions

### Integrations
- **Additional Git Providers**: Bitbucket, Azure DevOps support
- **CI/CD Systems**: Jenkins, Azure Pipelines, etc.
- **Issue Trackers**: Jira, Linear integration

## Conclusion

This development plan prioritizes privacy, accessibility, and performance while building a robust foundation for future enhancements. Each phase builds incrementally toward a complete solution that serves both Git beginners and experienced developers.