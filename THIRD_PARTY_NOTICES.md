# Third-Party Notices

## Learn Git Branching

This project includes a visual "skin" inspired by **Learn Git Branching** for educational purposes.

- **Project**: Learn Git Branching
- **Author**: Peter Cottle and contributors
- **Repository**: https://github.com/pcottle/learnGitBranching
- **License**: MIT License
- **Attribution**: The LGB mode visual styling recreates the look and feel of Learn Git Branching to provide a familiar interface for users. All colors, node geometry, and visual elements are inspired by the original project.

### MIT License Text

```
MIT License

Copyright (c) 2024 Peter Cottle

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Modifications

Git Visualizer's LGB skin includes the following modifications from the original:

1. **Accessibility**: Colors adjusted to meet WCAG 2.2 AA contrast requirements
2. **Reduced Motion**: Timing variables that collapse for users who prefer reduced motion
3. **Implementation**: Built with React + SVG instead of original canvas-based renderer
4. **Integration**: Works with Git Visualizer's layout engine (ELK) and privacy-first architecture

For more information about the LGB mode implementation, see `/docs/LGB_MODE.md`.
