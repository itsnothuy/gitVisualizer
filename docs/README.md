# Git Visualizer Documentation

Welcome to the comprehensive documentation for Git Visualizer - a privacy-first, local-first Git repository visualization tool.

## 📖 Getting Started

- **[Quick Start Guide](user-guides/quickstart.md)** - Get up and running in minutes
- **[Project Overview](../README.md)** - Main project documentation
- **[Development Setup](DEVELOPMENT.md)** - Setting up your development environment

## 🏗️ Architecture & Design

- **[System Architecture](ARCHITECTURE.md)** - Complete system design and data flow
- **[System Analysis](SYSTEM_ANALYSIS.md)** - Comprehensive system architecture analysis with diagrams
- **[User Workflow Validation](USER_WORKFLOW_VALIDATION.md)** - Complete end-to-end workflow validation
- **[Architectural Decision Records (ADRs)](adr/)** - Key technical decisions
- **[API Documentation](API_NOTES.md)** - API reference and integration points
- **[Performance Guide](PERF.md)** - Performance optimization and benchmarks

## 🛠️ Implementation Details

### Core Systems
- **[Scaffolding](implementation/core/scaffold.md)** - Foundation implementation
- **[Repository Ingestion](implementation/core/ingestion.md)** - Git repository processing
- **[Layout Engine](implementation/core/layout.md)** - ELK.js graph layout implementation
- **[SVG Renderer](implementation/core/renderer.md)** - Interactive graph visualization

### Features
- **[Animation System](implementation/features/animations.md)** - Visual transitions and effects
- **[Tutorial System](implementation/features/tutorials.md)** - Interactive learning experience
- **[User Onboarding](implementation/features/onboarding.md)** - First-time user experience
- **[Overlay System](implementation/features/overlays.md)** - GitHub/GitLab integrations

### Performance
- **[Optimizations](implementation/performance/optimizations.md)** - Performance enhancements
- **[Guardrails](implementation/performance/guardrails.md)** - Automatic performance management

## ♿ Accessibility

- **[WCAG 2.2 Checklist](../a11y/WCAG22_CHECKLIST.md)** - Comprehensive accessibility compliance
- **[A11y Implementation](../a11y/IMPLEMENTATION_SUMMARY.md)** - Accessibility implementation details
- **[Testing Artifacts](../a11y/ARTIFACTS.md)** - Accessibility testing guide

## 🧪 Testing & Quality

- **[Testing Guide](TESTING.md)** - Comprehensive testing documentation
- **[Quality Gates](QUALITY_GATES.md)** - Automated quality assurance
- **[Development Workflow](DEVELOPMENT.md)** - Development best practices

## 🔬 Research & Analysis

- **[LearnGitBranching Analysis](research/lgb-analysis.md)** - Deep dive into LGB codebase
- **[Legacy A11y Summary](research/A11Y_SUMMARY.md)** - Historical accessibility work
- **[LGB Parity Implementation](research/IMPLEMENTATION_LGB_PARITY.md)** - Feature parity notes

## 🎯 Specialized Guides

- **[I18n Implementation](I18N.md)** - Internationalization setup
- **[Level Builder](LEVEL_BUILDER.md)** - Creating custom learning levels
- **[LGB Mode](LGB_MODE.md)** - LearnGitBranching compatibility mode
- **[Advanced Operations](ADVANCED_OPS.md)** - Advanced Git visualization features
- **[Animation Framework](ANIMATION.md)** - Animation system documentation
- **[Sandbox Mode](SANDBOX.md)** - Interactive Git command sandbox
- **[Tutorial System](TUTORIAL_SYSTEM.md)** - Tutorial framework design
- **[Style Guide](STYLE_GUIDE.md)** - UI/UX design principles

## 📊 Project Status

- **System Architecture**: ✅ Complete with comprehensive analysis
- **User Workflow**: ✅ Validated end-to-end
- **Accessibility**: ✅ WCAG 2.2 AA compliant
- **Performance**: ✅ Handles repositories up to 50k+ commits
- **Cross-Browser**: ✅ Full compatibility with graceful fallbacks
- **Documentation**: ✅ Comprehensive with 15+ specialized guides

## 🤝 Contributing

- **[Development Guide](DEVELOPMENT.md)** - Setup and contribution workflow
- **[Testing Requirements](TESTING.md)** - Quality assurance standards
- **[ADR Process](adr/0001-use-adrs.md)** - Architectural decision documentation

---

*This documentation is maintained alongside the codebase to ensure accuracy and completeness. Last updated: October 21, 2025*