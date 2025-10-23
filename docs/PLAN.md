# Git Visualizer Development Roadmap

## Project Overview

For project vision, features, and getting started information, see the main [README.md](../README.md).

This document focuses on the **development roadmap** and **implementation timeline** for building the privacy-first, local-first Git visualizer.

## Development Phases

### Phase 1: Core Foundation ✅ (Complete)
**Duration**: Weeks 1-2  
**Status**: ✅ Complete

**Completed:**
- [x] Next.js 15 project scaffolding with App Router
- [x] TypeScript configuration with strict mode
- [x] Basic ELK.js layout integration
- [x] Initial SVG graph component
- [x] Development tooling (ESLint, Prettier, Vitest, Playwright)
- [x] Accessibility foundation with WCAG 2.2 AA compliance
- [x] Security headers and CSP configuration

### Phase 2: Local Repository Ingestion ✅ (Complete)
**Duration**: Weeks 3-4  
**Status**: ✅ Complete

**Completed:**
- [x] File System Access API integration with permission management
- [x] Git parsing with isomorphic-git for commit history extraction
- [x] DAG model construction with parent-child relationships
- [x] Error handling and browser compatibility fallbacks
- [x] Privacy-first local repository access

### Phase 3: Enhanced Visualization 🔄 (Current)
**Duration**: Weeks 5-7  
**Status**: 🔄 In Progress

**Completed:**
- [x] ELK.js layout optimization for Git graph structure
- [x] Performance optimization with Web Worker layout computation
- [x] Basic interactive features (zoom, pan, selection)
- [x] Learn Git Branching (LGB) mode foundation

**In Progress:**
- [ ] Advanced accessibility features
  - [ ] Complete keyboard navigation implementation
  - [ ] Screen reader enhancements with graph summaries
  - [ ] High contrast and reduced motion support
- [ ] LGB scenario system
  - [ ] Animation system for Git operations
  - [ ] Interactive step-by-step execution
  - [ ] Visual golden testing framework

**Acceptance Criteria:**
- First layout ≤ 1500ms on medium graphs (~1000 commits)
- Pan/zoom ≤ 16ms/frame for 60 FPS
- Full keyboard accessibility with visible focus indicators
- WCAG 2.2 AA compliance verified by automated and manual testing

### Phase 4: Repository Clone Support 📅 (Next)
**Duration**: Weeks 8-9  
**Priority**: Medium

**Remote Repository Features:**
- [ ] isomorphic-git + LightningFS integration
  - [ ] Shallow clone implementation (configurable depth)
  - [ ] CORS proxy documentation and configuration
  - [ ] Progress indicators with cancellation support
- [ ] OPFS storage management
  - [ ] Repository caching with quota monitoring
  - [ ] Cache eviction policies
  - [ ] Storage usage interface
- [ ] Privacy controls
  - [ ] "No-network mode" toggle
  - [ ] Repository URL validation
  - [ ] Clear data boundaries documentation

### Phase 5: Performance & Scalability 📅 (Weeks 10-11)
**Priority**: Medium

**Large Repository Support:**
- [ ] Rendering performance improvements
  - [ ] Element virtualization for graphs >10k commits
  - [ ] Canvas/WebGL fallback for extreme scale
  - [ ] Progressive edge rendering
- [ ] Memory optimization
  - [ ] Efficient DAG data structures
  - [ ] Layout result pooling
  - [ ] Garbage collection optimization

**Performance Targets:**
- Support repositories with 10k+ commits
- Maintain 60 FPS interactions regardless of size
- Memory usage scales linearly with visible elements

### Phase 6: Overlay System (Optional) 📅 (Weeks 12-14)
**Priority**: Low (Future Enhancement)

**Privacy-First Overlays:**
- [ ] PKCE OAuth flow for GitHub and GitLab
- [ ] Minimal read-only scopes with explicit consent
- [ ] In-memory token storage (no persistence)
- [ ] Rate limiting with exponential backoff
- [ ] GraphQL/REST API integration for PR/MR data

**Acceptance Criteria:**
- OAuth flows work without persistent token storage
- Overlays enhance but never block core functionality
- Clear user consent for each repository's overlay data
- Graceful degradation when overlay APIs fail

### Phase 7: Testing & Polish 📅 (Weeks 15-16)
**Priority**: High

**Quality Assurance:**
- [ ] Comprehensive test coverage (unit, integration, E2E)
- [ ] Real screen reader testing for accessibility
- [ ] Cross-browser compatibility verification
- [ ] Performance regression testing
- [ ] Security audit for data handling

## Technical Milestones

### Milestone 1: Educational MVP ✅ (Complete)
**Definition of Done:**
- Users can visualize local Git repositories
- Learn Git Branching scenarios work with animations
- Full keyboard accessibility implemented
- WCAG 2.2 AA compliant

### Milestone 2: Performance Target (End of Phase 5)
**Definition of Done:**
- Supports repositories with 10k+ commits
- Maintains 60 FPS interactions on target hardware
- Graceful degradation for older browsers and devices

### Milestone 3: Feature Complete (End of Phase 6)
**Definition of Done:**
- Optional overlay system functional
- Privacy controls fully implemented
- All core features tested and documented

## Risk Mitigation

### Technical Risks
- **Browser API Limitations**: Comprehensive feature detection and fallbacks
- **Performance on Large Repos**: Early benchmarking and Canvas/WebGL escape hatch
- **Accessibility Complexity**: Regular testing with real assistive technology users

### Product Risks
- **User Adoption**: Clear onboarding and comprehensive documentation
- **Privacy Concerns**: Transparent data handling with technical documentation
- **Educational Effectiveness**: User testing with Git beginners and educators

## Success Metrics

### Core Functionality
- **Repository Support**: Local and remote Git repositories work reliably
- **Performance**: Meets defined latency and FPS targets on target hardware
- **Accessibility**: WCAG 2.2 AA compliance verified with real users

### Privacy & Security
- **Zero Data Exfiltration**: No repository contents leave device by default
- **Transparent Overlays**: Clear consent flows for external API usage
- **Security Audit**: No critical vulnerabilities in final security review

### Educational Value
- **LGB Effectiveness**: User comprehension improvement on Git concepts
- **Beginner Friendliness**: Successful onboarding without technical background
- **Feature Adoption**: Core features used by target audience

## Resource Requirements

### Development Infrastructure
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Testing**: Vitest, Playwright, axe-core for comprehensive quality assurance
- **Documentation**: Comprehensive user and developer documentation
- **Security**: Regular dependency updates and security scanning

### Quality Assurance
- **Accessibility Testing**: Real screen reader users for usability validation
- **Performance Testing**: Automated benchmarks on representative hardware
- **Cross-Browser Testing**: Support matrix verification across target browsers

For current project status and getting started information, see the main [README.md](../README.md).